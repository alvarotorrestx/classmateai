import os
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Max characters of note content sent to Gemini (~200k chars ≈ 50k tokens, well within limits)
_MAX_CONTENT_CHARS = 200_000

SYSTEM_PROMPT = """You are a study assistant. Given a student's notes, generate study materials.
Return ONLY valid JSON matching exactly this structure:
{
  "flashcards": [{"front": "...", "back": "..."}],
  "quiz_questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}],
  "summary": "...",
  "study_guide": "..."
}"""

FLASHCARDS_ONLY_PROMPT = """You are a study assistant. Given a student's notes, generate flashcards.
Return ONLY valid JSON matching exactly this structure:
{
  "flashcards": [{"front": "...", "back": "..."}]
}"""

QUIZ_ONLY_PROMPT = """You are a study assistant. Given a student's notes, generate multiple-choice quiz questions.
Return ONLY valid JSON matching exactly this structure:
{
  "quiz_questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}]
}"""


class GeminiRateLimitError(Exception):
    """Raised when the Gemini API rate limit (429) is hit and retries are exhausted."""
    pass


def _is_rate_limit_error(e: Exception) -> bool:
    """Return True if the exception represents a Gemini 429 / quota-exceeded error."""
    msg = str(e).lower()
    return (
        "429" in msg
        or "rate" in msg
        or "quota" in msg
        or "resource_exhausted" in msg
        or "too many requests" in msg
    )


def _parse_response(response) -> dict:
    """Extract and parse JSON from a Gemini response, raising ValueError on failure."""
    text = getattr(response, "text", None)
    if not text or not text.strip():
        raise ValueError("Gemini returned an empty response — the content may have been blocked or filtered")
    raw = text.strip()
    # Strip accidental markdown fences just in case
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(raw)


def _call_gemini(system_prompt: str, user_prompt: str, retries: int = 2) -> dict:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    last_error: Exception = None
    for attempt in range(retries + 1):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                ),
            )
            return _parse_response(response)
        except Exception as e:
            last_error = e
            if _is_rate_limit_error(e):
                if attempt < retries:
                    # Rate limit: wait longer before retrying (15s, then 30s)
                    time.sleep(15 * (attempt + 1))
                else:
                    raise GeminiRateLimitError(
                        "Gemini API rate limit reached. Please wait a minute and try again."
                    ) from e
            else:
                # Transient error: shorter backoff
                if attempt < retries:
                    time.sleep(1.5 * (attempt + 1))  # 1.5s, then 3s
    raise last_error


def generate_study_materials(note_content: str, max_flashcards: int = 100, max_questions: int = 25) -> dict:
    content = note_content[:_MAX_CONTENT_CHARS]
    user_prompt = (
        f"Generate as many flashcards as needed to fully cover the material (up to {max_flashcards}), "
        f"and as many multiple-choice quiz questions as needed to thoroughly test the material (up to {max_questions}). "
        f"Also write a concise summary and a detailed study guide from the following notes.\n\n"
        f"Notes:\n{content}"
    )
    return _call_gemini(SYSTEM_PROMPT, user_prompt)


def generate_flashcards(note_content: str, max_flashcards: int = 100) -> dict:
    content = note_content[:_MAX_CONTENT_CHARS]
    user_prompt = (
        f"Generate as many flashcards as needed to fully cover the material (up to {max_flashcards}). "
        f"Vary the cards from any previously generated ones so the student gets fresh practice.\n\n"
        f"Notes:\n{content}"
    )
    return _call_gemini(FLASHCARDS_ONLY_PROMPT, user_prompt)


def generate_course_study_guide(full_content: str) -> str:
    """Generate a comprehensive plain-text study guide from the full accumulated course content."""
    content = full_content[:_MAX_CONTENT_CHARS]
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    last_error: Exception = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=(
                    f"Create a comprehensive, well-organized study guide from all the following course notes. "
                    f"Include key concepts, definitions, main topics with thorough explanations, and important "
                    f"relationships between ideas. Use clear section headers and bullet points.\n\n"
                    f"Notes:\n{content}"
                ),
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are a study assistant. Write a comprehensive study guide in plain text with "
                        "clear sections and organized content. Do not return JSON."
                    )
                ),
            )
            text = getattr(response, "text", None)
            if not text or not text.strip():
                raise ValueError("Gemini returned an empty study guide")
            return text.strip()
        except Exception as e:
            last_error = e
            if _is_rate_limit_error(e):
                if attempt < 2:
                    time.sleep(15 * (attempt + 1))
                else:
                    raise GeminiRateLimitError(
                        "Gemini API rate limit reached. Please wait a minute and try again."
                    ) from e
            else:
                if attempt < 2:
                    time.sleep(1.5 * (attempt + 1))
    raise last_error


def generate_quiz(note_content: str, max_questions: int = 25) -> dict:
    content = note_content[:_MAX_CONTENT_CHARS]
    user_prompt = (
        f"Generate as many multiple-choice quiz questions as needed to thoroughly test the material (up to {max_questions}). "
        f"Vary the questions from any previously generated ones so the student gets fresh practice.\n\n"
        f"Notes:\n{content}"
    )
    return _call_gemini(QUIZ_ONLY_PROMPT, user_prompt)
