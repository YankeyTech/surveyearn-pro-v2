import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "onboarding@resend.dev";
const APP_URL = process.env.APP_URL || "https://surveyearn-pro-v2.onrender.com";

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your SurveyEarn password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">SurveyEarn Pro</h2>
        <p>Hi ${name},</p>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#666;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <p style="color:#999;font-size:12px">— The SurveyEarn Team</p>
      </div>
    `,
  });
}