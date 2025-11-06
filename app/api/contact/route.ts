import { NextRequest } from "next/server";
import { sendEmail } from "@/lib/emailService";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return Response.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length < 10) {
      return Response.json(
        { success: false, error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .field { margin: 20px 0; }
            .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .value { background: white; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; margin-top: 5px; }
            .message-box { background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
            </div>

            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${body.name} &lt;${body.email}&gt;</div>
              </div>

              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${body.subject}</div>
              </div>

              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${body.message}</div>
              </div>
            </div>

            <div class="footer">
              <p>This is an automated message from the TaskQuadrant contact form.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to TaskQuadrant
    const result = await sendEmail({
      to: "TaskQuadrantAlert@gmail.com",
      subject: `Contact Form: ${body.subject}`,
      html: emailHtml,
      text: `From: ${body.name} <${body.email}>\n\nSubject: ${body.subject}\n\n${body.message}`,
    });

    if (!result.success) {
      console.error("Failed to send contact form email:", result.error);
      return Response.json(
        {
          success: false,
          error: "Failed to send message. Please try again later or email us directly at TaskQuadrantAlert@gmail.com"
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
