import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a study assistant. Given a student's notes, generate study materials in JSON.
Return ONLY valid JSON with no additional text, matching exactly this structure:
{
  "flashcards": [{"front": "...", "back": "..."}],
  "quiz_questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}],
  "summary": "...",
  "study_guide": "..."
}"""


def generate_study_materials(note_content: str, max_flashcards: int = 100, max_questions: int = 25) -> dict:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    user_prompt = (
        f"Generate as many flashcards as needed to fully cover the material (up to {max_flashcards}), "
        f"and as many multiple-choice quiz questions as needed to thoroughly test the material (up to {max_questions}). "
        f"Also write a concise summary and a detailed study guide from the following notes.\n\n"
        f"Notes:\n{note_content}"
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )

    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    return json.loads(raw)
