import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Generate HTML email template for email verification
 */
function getVerificationEmailHTML(
  name: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-wrapper {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2d7a4f;
          margin-bottom: 10px;
        }
        .title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        .content {
          margin: 30px 0;
        }
        .content p {
          margin: 15px 0;
          color: #555;
        }
        .verification-link {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          padding: 12px 32px;
          background-color: #2d7a4f;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #245a3b;
        }
        .fallback-link {
          word-break: break-all;
          font-size: 12px;
          color: #888;
          margin-top: 15px;
          font-family: monospace;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">Budget App</div>
            <p class="title">Verify Your Email Address</p>
          </div>

          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for signing up! Please verify your email address to get started with your personal budget management.</p>

            <div class="verification-link">
              <a href="${verificationUrl}" class="btn">Verify Email Address</a>
            </div>

            <p>Or copy and paste this link in your browser:</p>
            <div class="fallback-link">${verificationUrl}</div>

            <div class="warning">
              ⏱️ This link will expire in 24 hours. If you didn't request this verification, please ignore this email.
            </div>

            <p>If you have any questions, feel free to reach out to us.</p>
            <p>Best regards,<br/>Budget App Team</p>
          </div>

          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2025 Budget App. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get plain text version of verification email
 */
function getVerificationEmailText(
  name: string,
  verificationUrl: string
): string {
  return `
Hi ${name},

Thank you for signing up! Please verify your email address to get started with your personal budget management.

Verify your email by clicking this link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't request this verification, please ignore this email.

Best regards,
Budget App Team
  `.trim();
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
): Promise<void> {
  try {
    const htmlContent = getVerificationEmailHTML(name, verificationUrl);
    const textContent = getVerificationEmailText(name, verificationUrl);

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Verify Your Email Address - Budget App',
      text: textContent,
      html: htmlContent,
    });

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email. Please try again later.');
  }
}
