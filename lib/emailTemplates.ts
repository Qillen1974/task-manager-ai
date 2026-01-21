/**
 * Email Templates for Notifications
 *
 * Reusable HTML email templates for various notification types
 */

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
  }
  .header p {
    margin: 10px 0 0 0;
    opacity: 0.9;
  }
  .content {
    background: #f9fafb;
    padding: 30px;
    border: 1px solid #e5e7eb;
    border-top: none;
  }
  .card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 20px;
    margin: 20px 0;
  }
  .button {
    display: inline-block;
    background: #3B82F6;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    margin-top: 20px;
    font-weight: 600;
  }
  .footer {
    background: #f9fafb;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-top: none;
    border-radius: 0 0 8px 8px;
  }
  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 20px 0;
  }
  .meta {
    font-size: 13px;
    color: #6b7280;
    margin-top: 10px;
  }
`;

/**
 * Team Invitation Email Template
 */
export function teamInvitationEmailTemplate(
  recipientName: string,
  teamName: string,
  inviterName: string,
  invitationLink: string,
  role: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">👥</div>
            <h1>You're Invited to a Team!</h1>
            <p>Join ${teamName} on TaskQuadrant</p>
          </div>

          <div class="content">
            <p>Hi ${recipientName},</p>

            <p><strong>${inviterName}</strong> has invited you to join the <strong>${teamName}</strong> team on TaskQuadrant!</p>

            <div class="card">
              <h2 style="margin-top: 0;">Team Invitation Details</h2>
              <p><strong>Team Name:</strong> ${teamName}</p>
              <p><strong>Your Role:</strong> <span style="background: #DBEAFE; padding: 4px 8px; border-radius: 4px; color: #1E40AF; font-weight: 600;">${role}</span></p>
              <p><strong>Invited by:</strong> ${inviterName}</p>
              <p style="margin-bottom: 0;"><strong>Expires in:</strong> 7 days</p>
            </div>

            <p>As a team member, you'll be able to:</p>
            <ul>
              <li>Collaborate on team projects</li>
              <li>Share documents and files</li>
              <li>Assign and track tasks together</li>
              <li>Send messages to team members</li>
            </ul>

            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">Accept Invitation</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 13px; color: #6b7280;">
              If you didn't expect this invitation or have questions, you can ignore this email.
              The invitation will expire in 7 days.
            </p>

            <p>Happy collaborating!<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You're Invited to a Team!

Hi ${recipientName},

${inviterName} has invited you to join the ${teamName} team on TaskQuadrant!

Team Invitation Details:
- Team Name: ${teamName}
- Your Role: ${role}
- Invited by: ${inviterName}
- Expires in: 7 days

Accept the invitation here:
${invitationLink}

If you didn't expect this invitation or have questions, you can ignore this email.
The invitation will expire in 7 days.

Happy collaborating!
The TaskQuadrant Team

© 2024 TaskQuadrant. All rights reserved.
  `;

  return { html, text };
}

/**
 * Task Assignment Email Template
 */
export function taskAssignmentEmailTemplate(
  recipientName: string,
  assignerName: string,
  taskTitle: string,
  projectName: string,
  dueDate: string | null,
  taskLink: string,
  role: string
): { html: string; text: string } {
  const dueDateText = dueDate ? `Due on ${dueDate}` : "No due date set";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">✅</div>
            <h1>You've Been Assigned a Task</h1>
            <p>Check it out on TaskQuadrant</p>
          </div>

          <div class="content">
            <p>Hi ${recipientName},</p>

            <p><strong>${assignerName}</strong> has assigned you a task in the <strong>${projectName}</strong> project.</p>

            <div class="card">
              <h2 style="margin-top: 0;">${taskTitle}</h2>
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Your Role:</strong> <span style="background: #DBEAFE; padding: 4px 8px; border-radius: 4px; color: #1E40AF; font-weight: 600;">${role}</span></p>
              <p style="margin-bottom: 0;"><strong>Timeline:</strong> ${dueDateText}</p>
            </div>

            <div style="text-align: center;">
              <a href="${taskLink}" class="button">View Task Details</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 13px; color: #6b7280;">
              You can manage your task assignments and notification preferences in your account settings.
            </p>

            <p>Good luck!<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You've Been Assigned a Task

Hi ${recipientName},

${assignerName} has assigned you a task in the ${projectName} project.

Task Details:
- Task: ${taskTitle}
- Project: ${projectName}
- Your Role: ${role}
- Timeline: ${dueDateText}

View the task:
${taskLink}

You can manage your task assignments and notification preferences in your account settings.

Good luck!
The TaskQuadrant Team

© 2024 TaskQuadrant. All rights reserved.
  `;

  return { html, text };
}

/**
 * Document Upload Email Template
 */
export function documentUploadEmailTemplate(
  recipientName: string,
  uploaderName: string,
  teamName: string,
  documentName: string,
  documentLink: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">📄</div>
            <h1>New Document Uploaded</h1>
            <p>Your team shared a new file</p>
          </div>

          <div class="content">
            <p>Hi ${recipientName},</p>

            <p><strong>${uploaderName}</strong> has uploaded a new document to the <strong>${teamName}</strong> workspace.</p>

            <div class="card">
              <h2 style="margin-top: 0; word-break: break-word;">${documentName}</h2>
              <p><strong>Uploaded to:</strong> ${teamName} Workspace</p>
              <p style="margin-bottom: 0;"><strong>Uploaded by:</strong> ${uploaderName}</p>
            </div>

            <div style="text-align: center;">
              <a href="${documentLink}" class="button">View Document</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 13px; color: #6b7280;">
              You can adjust your notification preferences anytime in your account settings.
            </p>

            <p>Happy collaborating!<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Document Uploaded

Hi ${recipientName},

${uploaderName} has uploaded a new document to the ${teamName} workspace.

Document Details:
- Document: ${documentName}
- Uploaded to: ${teamName} Workspace
- Uploaded by: ${uploaderName}

View the document:
${documentLink}

You can adjust your notification preferences anytime in your account settings.

Happy collaborating!
The TaskQuadrant Team

© 2024 TaskQuadrant. All rights reserved.
  `;

  return { html, text };
}

/**
 * Sticky Note Received Email Template
 */
export function stickyNoteEmailTemplate(
  recipientName: string,
  senderName: string,
  noteContent: string,
  teamName: string,
  notesLink: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">📝</div>
            <h1>You Received a Message</h1>
            <p>New sticky note from ${senderName}</p>
          </div>

          <div class="content">
            <p>Hi ${recipientName},</p>

            <p><strong>${senderName}</strong> sent you a message in the <strong>${teamName}</strong> workspace.</p>

            <div class="card" style="border-left: 4px solid #FBBF24;">
              <p style="margin: 0; white-space: pre-wrap; word-break: break-word;">"${noteContent}"</p>
              <p class="meta">— ${senderName}</p>
            </div>

            <div style="text-align: center;">
              <a href="${notesLink}" class="button">View All Messages</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 13px; color: #6b7280;">
              You can adjust your notification preferences anytime in your account settings.
            </p>

            <p>Happy collaborating!<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You Received a Message

Hi ${recipientName},

${senderName} sent you a message in the ${teamName} workspace.

Message:
"${noteContent}"
— ${senderName}

View your messages:
${notesLink}

You can adjust your notification preferences anytime in your account settings.

Happy collaborating!
The TaskQuadrant Team

© 2024 TaskQuadrant. All rights reserved.
  `;

  return { html, text };
}

/**
 * Task Completion Email Template
 */
export function taskCompletionEmailTemplate(
  recipientName: string,
  completedBy: string,
  taskTitle: string,
  projectName: string,
  taskLink: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">🎉</div>
            <h1>Task Completed!</h1>
            <p>A task you were assigned is now complete</p>
          </div>

          <div class="content">
            <p>Hi ${recipientName},</p>

            <p><strong>${completedBy}</strong> has completed the task <strong>"${taskTitle}"</strong> in the <strong>${projectName}</strong> project.</p>

            <div class="card">
              <h2 style="margin-top: 0;">${taskTitle}</h2>
              <p><strong>Project:</strong> ${projectName}</p>
              <p style="margin-bottom: 0;"><strong>Completed by:</strong> ${completedBy}</p>
            </div>

            <div style="text-align: center;">
              <a href="${taskLink}" class="button">View Task</a>
            </div>

            <div class="divider"></div>

            <p style="font-size: 13px; color: #6b7280;">
              Great work on the team effort!
            </p>

            <p>Keep up the momentum!<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Task Completed!

Hi ${recipientName},

${completedBy} has completed the task "${taskTitle}" in the ${projectName} project.

Task Details:
- Task: ${taskTitle}
- Project: ${projectName}
- Completed by: ${completedBy}

View the task:
${taskLink}

Great work on the team effort!

Keep up the momentum!
The TaskQuadrant Team

© 2024 TaskQuadrant. All rights reserved.
  `;

  return { html, text };
}

/**
 * Password Reset Code Email Template
 */
export function passwordResetCodeEmailTemplate(
  recipientName: string,
  resetCode: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 10px;">🔐</div>
            <h1>Password Reset Request</h1>
            <p>Use the code below to reset your password</p>
          </div>

          <div class="content">
            <p>Hi ${recipientName || 'there'},</p>

            <p>We received a request to reset your password for your TaskQuadrant account. Use the code below to complete the password reset process.</p>

            <div class="card" style="text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your reset code:</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3B82F6; font-family: monospace; background: #EFF6FF; padding: 20px; border-radius: 8px;">
                ${resetCode}
              </div>
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280;">This code expires in 15 minutes</p>
            </div>

            <div class="divider"></div>

            <p style="font-size: 13px; color: #6b7280;">
              <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged, and the code will expire automatically.
            </p>

            <p style="font-size: 13px; color: #6b7280;">
              Never share this code with anyone. TaskQuadrant staff will never ask for your password or reset code.
            </p>

            <p>Stay secure,<br>The TaskQuadrant Team</p>
          </div>

          <div class="footer">
            <p>&copy; 2024 TaskQuadrant. All rights reserved.</p>
            <p><a href="https://taskquadrant.com/privacy" style="color: #3B82F6; text-decoration: none;">Privacy Policy</a> | <a href="https://taskquadrant.com/terms" style="color: #3B82F6; text-decoration: none;">Terms of Service</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Password Reset Request

Hi ${recipientName || 'there'},

We received a request to reset your password for your TaskQuadrant account.

Your reset code: ${resetCode}

This code expires in 15 minutes.

SECURITY NOTICE: If you did not request a password reset, please ignore this email. Your password will remain unchanged, and the code will expire automatically.

Never share this code with anyone. TaskQuadrant staff will never ask for your password or reset code.

Stay secure,
The TaskQuadrant Team

© 2024 TaskQuadrant. All rights reserved.
  `;

  return { html, text };
}
