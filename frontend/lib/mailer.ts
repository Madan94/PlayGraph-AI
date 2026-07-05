import nodemailer from "nodemailer";

export function getMailer() {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOtpEmail(to: string, code: string, role: string) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const transporter = getMailer();

  await transporter.sendMail({
    from,
    to,
    subject: `${code} is your PlayGraphAI verification code`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #000; font-size: 24px; margin-bottom: 8px;">PlayGraphAI</h1>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
          Your ${role} verification code is:
        </p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0066FF; margin: 24px 0;">
          ${code}
        </p>
        <p style="color: #9CA3AF; font-size: 14px;">
          This code expires in 10 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}
