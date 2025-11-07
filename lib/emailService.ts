import { Resend } from "resend";

/**
 * Email Service using Resend
 *
 * Resend is a modern email service built for developers.
 * It provides reliable email delivery with excellent deliverability rates.
 *
 * Environment variables needed:
 * - RESEND_API_KEY: Your Resend API key from https://resend.com
 * - EMAIL_FROM: Sender email address (must be a verified domain or resend.dev for testing)
 *
 * To set up Resend:
 * 1. Sign up at https://resend.com
 * 2. Add and verify your domain
 * 3. Generate an API key from the dashboard
 * 4. Add DNS TXT record: resend._domainkey with the provided public key
 * 5. Set RESEND_API_KEY in your environment variables
 */

let resendClient: Resend | null = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    process.stderr.write("[Email] WARNING: RESEND_API_KEY is not set. Email sending will fail.\n");
    process.stderr.write("[Email] Please set RESEND_API_KEY environment variable.\n");
  }

  resendClient = new Resend(apiKey);
  process.stderr.write("[Email] Resend client initialized\n");

  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const resend = getResendClient();

    const fromEmail = process.env.EMAIL_FROM || "noreply@resend.dev";

    if (!process.env.RESEND_API_KEY) {
      process.stderr.write("[Email] CRITICAL: RESEND_API_KEY not configured. Email sending failed.\n");
      return { success: false, message: "Email service not configured" };
    }

    process.stderr.write(`[Email] Attempting to send email to: ${options.to}\n`);

    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      const errorMsg = result.error.message || "Unknown Resend error";
      process.stderr.write(`[Email] Failed to send email: ${errorMsg}\n`);
      return { success: false, error: errorMsg };
    }

    process.stderr.write(`[Email] Message sent successfully: ${result.data?.id}\n`);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.constructor.name : typeof error;
    process.stderr.write(`[Email] Failed to send email: ${errorMsg}\n`);
    process.stderr.write(`[Email] Error type: ${errorType}\n`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  userId: string,
  password: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .credentials { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .credential-item { margin: 15px 0; }
          .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all; margin-top: 5px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">📋</div>
            <h1>Welcome to TaskQuadrant!</h1>
            <p>Master your priorities. Achieve your goals.</p>
          </div>

          <div class="content">
            <p>Hi ${name},</p>

            <p>Thank you for signing up for TaskQuadrant! We're excited to have you join our community of productive professionals.</p>

            <p>Your account has been created successfully. Here are your login credentials:</p>

            <div class="credentials">
              <div class="credential-item">
                <div class="label">Email Address</div>
                <div class="value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="label">User ID</div>
                <div class="value">${userId}</div>
              </div>
              <div class="credential-item">
                <div class="label">Password</div>
                <div class="value">${password}</div>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> Please save these credentials in a secure location. We recommend using a password manager. For security, you can change your password anytime from your account settings.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taskquadrant.com'}/dashboard" class="button">Go to Dashboard</a>
            </div>

            <div class="divider"></div>

            <h2 style="color: #1f2937; margin-top: 30px;">Getting Started</h2>
            <p>Here are some tips to help you get the most out of TaskQuadrant:</p>
            <ul>
              <li><strong>Create Projects:</strong> Organize your work by creating projects</li>
              <li><strong>Add Tasks:</strong> Break down your projects into manageable tasks</li>
              <li><strong>Use the Eisenhower Matrix:</strong> Prioritize by urgency and importance</li>
              <li><strong>Track Progress:</strong> Monitor your progress with visual dashboards</li>
              <li><strong>Set Recurring Tasks:</strong> Automate repetitive tasks</li>
            </ul>

            <p>If you have any questions or need help, feel free to reach out to us at support@taskquadrant.com</p>

            <p>Happy prioritizing!<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to TaskQuadrant, ${name}! 🎉`,
    html,
  });
}
