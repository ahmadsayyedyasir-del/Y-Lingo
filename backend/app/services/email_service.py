"""Email service — sends transactional emails via SMTP.

Uses Python's standard-library smtplib so no extra dependency is required.
Configure SMTP credentials in .env (see .env.example for the keys).

Currently used for:
- Password reset OTP emails
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    """Sends emails via the configured SMTP server."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def send_password_reset_otp(self, *, to_email: str, to_name: str, otp_code: str) -> None:
        """
        Send a 6-digit password reset OTP to the user's email address.

        Raises:
            RuntimeError: If SMTP credentials are not configured or sending fails.
        """
        subject = "Your Y-Lingo Password Reset Code"

        # Plain-text body
        text_body = (
            f"Hi {to_name},\n\n"
            f"You requested a password reset for your Y-Lingo account.\n\n"
            f"Your verification code is:\n\n"
            f"    {otp_code}\n\n"
            f"This code is valid for {self.settings.password_reset_code_expire_minutes} minutes.\n\n"
            f"If you did not request a password reset, please ignore this email.\n\n"
            f"— The Y-Lingo Team"
        )

        # HTML body
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px;">
              <h2 style="color: #60a5fa; margin-bottom: 8px;">Password Reset</h2>
              <p style="color: #94a3b8;">Hi <strong style="color: #f1f5f9;">{to_name}</strong>,</p>
              <p style="color: #94a3b8;">
                You requested a password reset for your Y-Lingo account.
                Use the code below to set a new password.
              </p>
              <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #60a5fa;">
                  {otp_code}
                </span>
              </div>
              <p style="color: #94a3b8; font-size: 13px;">
                This code expires in
                <strong style="color: #f1f5f9;">
                  {self.settings.password_reset_code_expire_minutes} minutes
                </strong>.
              </p>
              <p style="color: #475569; font-size: 12px; margin-top: 24px;">
                If you did not request a password reset, please ignore this email.
                Your password will not be changed.
              </p>
              <hr style="border-color: #334155; margin: 24px 0;" />
              <p style="color: #475569; font-size: 12px; text-align: center;">
                — The Y-Lingo Team
              </p>
            </div>
          </body>
        </html>
        """

        self._send(to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)

    def _send(
        self,
        *,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: str,
    ) -> None:
        """
        Internal: build MIME message and send via SMTP.

        Raises:
            RuntimeError: If SMTP is not configured or the send fails.
        """
        s = self.settings

        if not s.smtp_username or not s.smtp_password:
            raise RuntimeError(
                "SMTP credentials are not configured. "
                "Set SMTP_USERNAME and SMTP_PASSWORD in your .env file."
            )

        from_address = s.smtp_from_email or s.smtp_username
        from_header = f"{s.smtp_from_name} <{from_address}>"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = to_email

        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            if s.smtp_use_tls:
                # STARTTLS (port 587)
                with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(s.smtp_username, s.smtp_password)
                    server.sendmail(from_address, to_email, msg.as_string())
            else:
                # SSL (port 465)
                with smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=15) as server:
                    server.login(s.smtp_username, s.smtp_password)
                    server.sendmail(from_address, to_email, msg.as_string())

            logger.info("Password reset OTP sent to %s", to_email)

        except smtplib.SMTPException as exc:
            logger.error("Failed to send email to %s: %s", to_email, exc)
            raise RuntimeError(f"Failed to send email: {exc}") from exc


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_email_service: EmailService | None = None


def get_email_service() -> EmailService:
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
