"""
Email service for HireQ - Handles all email notifications.

Supports multiple providers:
- Resend (recommended)
- SMTP (fallback)

Usage:
    from app.services.email import get_email_service
    
    email_service = get_email_service()
    await email_service.send_welcome_email("user@example.com", "John Doe")
"""

import logging
from typing import Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class EmailService(ABC):
    """Abstract base class for email services."""
    
    @abstractmethod
    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None
    ) -> bool:
        """Send an email. Returns True if successful."""
        pass


class ResendEmailService(EmailService):
    """Email service using Resend API."""
    
    def __init__(self, api_key: str, from_email: str):
        self.api_key = api_key
        self.from_email = from_email
        self._client = None
    
    def _get_client(self):
        if self._client is None:
            try:
                import resend
                resend.api_key = self.api_key
                self._client = resend
            except ImportError:
                logger.warning("Resend package not installed. Run: pip install resend")
                return None
        return self._client
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None
    ) -> bool:
        client = self._get_client()
        if not client:
            return False
        
        try:
            client.Emails.send({
                "from": from_email or self.from_email,
                "to": to,
                "subject": subject,
                "html": html
            })
            logger.info(f"Email sent successfully to {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False


class MockEmailService(EmailService):
    """Mock email service for development (logs emails instead of sending)."""
    
    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None
    ) -> bool:
        logger.info(f"[MOCK EMAIL] To: {to}, Subject: {subject}")
        logger.debug(f"[MOCK EMAIL] HTML: {html[:200]}...")
        return True


class HireQEmailService:
    """
    High-level email service with pre-built templates for HireQ.
    
    Usage:
        email_service = get_email_service()
        await email_service.send_welcome_email("user@example.com", "John")
    """
    
    def __init__(self, provider: EmailService, frontend_url: str):
        self.provider = provider
        self.frontend_url = frontend_url
    
    # ==================== BASE TEMPLATE ====================
    
    def _wrap_template(self, content: str) -> str:
        """Wrap content in HireQ email template."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HireQ</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); padding: 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">HireQ</h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">AI-Powered Recruitment Platform</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    {content}
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                        © 2024 HireQ. All rights reserved.
                                    </p>
                                    <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                                        You received this email because you have an account on HireQ.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
    
    # ==================== EMAIL TEMPLATES ====================
    
    async def send_welcome_email(self, to: str, name: str) -> bool:
        """Send welcome email to new user."""
        content = f"""
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Welcome to HireQ, {name}! 🎉</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for joining our AI-powered recruitment platform. We're excited to help you find your perfect opportunity!
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong>Get started by:</strong>
        </p>
        <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>Completing your profile</li>
            <li>Uploading your resume</li>
            <li>Browsing available jobs</li>
        </ul>
        <a href="{self.frontend_url}/candidate/profile" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Complete Your Profile
        </a>
        """
        
        return await self.provider.send_email(
            to=to,
            subject="Welcome to HireQ! 🎉",
            html=self._wrap_template(content)
        )
    
    async def send_application_received(self, to: str, name: str, job_title: str, company: str) -> bool:
        """Send confirmation when application is received."""
        content = f"""
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Application Received ✓</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi {name},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Your application has been successfully submitted!
        </p>
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 20px; margin: 0 0 30px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #0d9488; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">Position</p>
            <p style="color: #111827; font-size: 18px; margin: 0; font-weight: bold;">{job_title}</p>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">{company}</p>
        </div>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            The hiring team will review your application and get back to you soon. You can track your application status in your dashboard.
        </p>
        <a href="{self.frontend_url}/candidate/applications" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Application
        </a>
        """
        
        return await self.provider.send_email(
            to=to,
            subject=f"Application Received: {job_title}",
            html=self._wrap_template(content)
        )
    
    async def send_application_status_update(
        self,
        to: str,
        name: str,
        job_title: str,
        status: str,
        message: Optional[str] = None
    ) -> bool:
        """Send application status update email."""
        
        status_config = {
            "screening": {
                "emoji": "🔍",
                "title": "Application Under Review",
                "message": "Your application is currently being reviewed by the hiring team.",
                "color": "#f59e0b"
            },
            "interview": {
                "emoji": "🎉",
                "title": "Interview Invitation",
                "message": "Congratulations! You've been selected for an interview.",
                "color": "#8b5cf6"
            },
            "offer": {
                "emoji": "🏆",
                "title": "Job Offer!",
                "message": "Great news! You have received a job offer.",
                "color": "#10b981"
            },
            "hired": {
                "emoji": "🎊",
                "title": "Welcome Aboard!",
                "message": "Congratulations on your new position!",
                "color": "#10b981"
            },
            "rejected": {
                "emoji": "📋",
                "title": "Application Update",
                "message": "Thank you for your interest. After careful consideration, we've decided to move forward with other candidates.",
                "color": "#6b7280"
            }
        }
        
        config = status_config.get(status, {
            "emoji": "📋",
            "title": "Application Update",
            "message": "Your application status has been updated.",
            "color": "#0d9488"
        })
        
        custom_message = ""
        if message:
            custom_message = f"""
            <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="color: #374151; font-size: 14px; margin: 0; font-style: italic;">"{message}"</p>
            </div>
            """
        
        content = f"""
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">{config['emoji']} {config['title']}</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi {name},
        </p>
        <div style="background-color: #f0fdfa; border-left: 4px solid {config['color']}; padding: 20px; margin: 0 0 20px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Position</p>
            <p style="color: #111827; font-size: 18px; margin: 0; font-weight: bold;">{job_title}</p>
        </div>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            {config['message']}
        </p>
        {custom_message}
        <a href="{self.frontend_url}/candidate/applications" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Details
        </a>
        """
        
        return await self.provider.send_email(
            to=to,
            subject=f"{config['emoji']} {config['title']}: {job_title}",
            html=self._wrap_template(content)
        )
    
    async def send_new_message_notification(
        self,
        to: str,
        recipient_name: str,
        sender_name: str,
        message_preview: str,
        job_title: Optional[str] = None
    ) -> bool:
        """Send notification when user receives a new message."""
        
        job_context = ""
        if job_title:
            job_context = f"""
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Regarding: <strong>{job_title}</strong>
            </p>
            """
        
        content = f"""
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">New Message 💬</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi {recipient_name},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            You have a new message from <strong>{sender_name}</strong>:
        </p>
        {job_context}
        <div style="background-color: #f9fafb; padding: 20px; margin: 0 0 30px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.6;">
                "{message_preview[:200]}{'...' if len(message_preview) > 200 else ''}"
            </p>
        </div>
        <a href="{self.frontend_url}/candidate/messages" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reply Now
        </a>
        """
        
        return await self.provider.send_email(
            to=to,
            subject=f"New message from {sender_name}",
            html=self._wrap_template(content)
        )
    
    async def send_interview_reminder(
        self,
        to: str,
        name: str,
        job_title: str,
        company: str,
        interview_date: str,
        interview_time: str,
        interview_type: str = "Video Call"
    ) -> bool:
        """Send interview reminder email."""
        content = f"""
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Interview Reminder 📅</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi {name},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            This is a friendly reminder about your upcoming interview.
        </p>
        <div style="background-color: #f0fdfa; border: 1px solid #0d9488; padding: 25px; margin: 0 0 30px 0; border-radius: 12px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%" style="padding: 10px 0;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Position</p>
                        <p style="color: #111827; font-size: 16px; margin: 0; font-weight: bold;">{job_title}</p>
                    </td>
                    <td width="50%" style="padding: 10px 0;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Company</p>
                        <p style="color: #111827; font-size: 16px; margin: 0; font-weight: bold;">{company}</p>
                    </td>
                </tr>
                <tr>
                    <td width="50%" style="padding: 10px 0;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Date</p>
                        <p style="color: #111827; font-size: 16px; margin: 0; font-weight: bold;">{interview_date}</p>
                    </td>
                    <td width="50%" style="padding: 10px 0;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Time</p>
                        <p style="color: #111827; font-size: 16px; margin: 0; font-weight: bold;">{interview_time}</p>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 10px 0;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Interview Type</p>
                        <p style="color: #111827; font-size: 16px; margin: 0; font-weight: bold;">{interview_type}</p>
                    </td>
                </tr>
            </table>
        </div>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            <strong>Tips for your interview:</strong>
        </p>
        <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
            <li>Test your audio and video beforehand</li>
            <li>Find a quiet, well-lit space</li>
            <li>Have your resume ready to reference</li>
            <li>Prepare questions about the role</li>
        </ul>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Good luck! 🍀
        </p>
        """
        
        return await self.provider.send_email(
            to=to,
            subject=f"Interview Reminder: {job_title} at {company}",
            html=self._wrap_template(content)
        )
    
    async def send_password_reset(self, to: str, name: str, reset_link: str) -> bool:
        """Send password reset email."""
        content = f"""
        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password 🔐</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi {name},
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            We received a request to reset your password. Click the button below to create a new password:
        </p>
        <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 30px;">
            Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        """
        
        return await self.provider.send_email(
            to=to,
            subject="Reset Your HireQ Password",
            html=self._wrap_template(content)
        )


# ==================== SINGLETON INSTANCE ====================

_email_service: Optional[HireQEmailService] = None


def get_email_service() -> HireQEmailService:
    """Get the singleton email service instance."""
    global _email_service
    
    if _email_service is None:
        from app.config import settings
        
        # Choose provider based on configuration
        if hasattr(settings, 'RESEND_API_KEY') and settings.RESEND_API_KEY:
            provider = ResendEmailService(
                api_key=settings.RESEND_API_KEY,
                from_email=getattr(settings, 'FROM_EMAIL', 'noreply@hireq.app')
            )
            logger.info("Email service initialized with Resend")
        else:
            provider = MockEmailService()
            logger.info("Email service initialized with Mock (emails will be logged)")
        
        _email_service = HireQEmailService(
            provider=provider,
            frontend_url=settings.FRONTEND_URL
        )
    
    return _email_service
