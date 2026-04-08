import os
from urllib.parse import quote

import httpx


# Send a transactional verification email via Brevo.
def send_verification_email(email: str, full_name: str, token: str) -> None:
    api_key = os.getenv("BREVO_API_KEY")
    email_from = os.getenv("EMAIL_FROM")
    frontend_url = os.getenv("FRONTEND_URL")

    if not api_key:
        raise RuntimeError("BREVO_API_KEY is not set")
    if not email_from:
        raise RuntimeError("EMAIL_FROM is not set")
    if not frontend_url:
        raise RuntimeError("FRONTEND_URL is not set")

    verify_link = f"{frontend_url.rstrip('/')}/verify-email?token={quote(token)}"

    subject = "Verify your email for ClassmateAI"
    html_content = f"""
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5;">
      <p style="margin: 0 0 16px;">Hi {full_name or "there"},</p>
      <p style="margin: 0 0 16px;">
        Thanks for creating a ClassmateAI account. Please verify your email address to finish setup.
      </p>
      <p style="margin: 0 0 18px;">
        <a href="{verify_link}"
           style="display: inline-block; background: #00cc99; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 12px; font-weight: 600;">
          Verify Email
        </a>
      </p>
      <p style="margin: 0 0 6px; color: #666; font-size: 12px;">
        If the button doesn't work, copy and paste this link:
      </p>
      <p style="margin: 0; font-size: 12px; word-break: break-all;">
        <a href="{verify_link}">{verify_link}</a>
      </p>
    </div>
    """.strip()

    payload = {
        "sender": {"email": email_from, "name": "ClassmateAI"},
        "to": [{"email": email, "name": full_name or ""}],
        "subject": subject,
        "htmlContent": html_content,
    }

    headers = {
        "api-key": api_key,
        "accept": "application/json",
        "content-type": "application/json",
    }

    with httpx.Client(timeout=15.0) as client:
        res = client.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers)
        res.raise_for_status()

