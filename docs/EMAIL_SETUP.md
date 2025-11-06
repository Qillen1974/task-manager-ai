# Email Setup Guide

This guide explains how to configure email sending for TaskQuadrant welcome emails.

## Quick Start (Development)

For development, the application uses **Ethereal Email** by default - a free fake SMTP service perfect for testing.

1. No configuration needed! Just run the app and emails will be logged to the console with preview URLs.

## Production Setup

For production, you need to configure a real email provider. Here are the most common options:

### Option 1: Gmail (Recommended for Small Apps)

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate a 16-character password
3. Add to your `.env.local` or Railway variables:
   ```
   EMAIL_FROM=your-email@gmail.com
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

### Option 2: Outlook / Office 365

1. Add to your `.env.local`:
   ```
   EMAIL_FROM=your-email@outlook.com
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-outlook-password
   ```

### Option 3: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Add to your `.env.local`:
   ```
   EMAIL_FROM=noreply@yourapp.com
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your_sendgrid_api_key
   ```

### Option 4: AWS SES

1. Set up SES in AWS
2. Get SMTP credentials
3. Add to your `.env.local`:
   ```
   EMAIL_FROM=noreply@yourapp.com
   EMAIL_HOST=email-smtp.region.amazonaws.com
   EMAIL_PORT=587
   EMAIL_USER=your-smtp-username
   EMAIL_PASSWORD=your-smtp-password
   ```

## Railway Deployment

To set up email on Railway:

1. Go to your Railway project
2. Select "Variables" tab
3. Add the email configuration variables (EMAIL_FROM, EMAIL_HOST, etc.)
4. Deploy

## Testing Emails Locally

### Using Ethereal Email

Ethereal is the default for development. When an email is sent, the console will show:

```
[Email] Preview URL: https://ethereal.email/message/...
```

Click the URL to see the email as it would appear in a real inbox.

### Creating an Ethereal Account

If you want to use a persistent Ethereal account:

1. Visit https://ethereal.email/create
2. Fill in a fake email and password
3. Add to your `.env.local`:
   ```
   ETHEREAL_EMAIL=your_ethereal_email@ethereal.email
   ETHEREAL_PASSWORD=your_ethereal_password
   ```

## Environment Variables

```bash
# Required for email sending in production
EMAIL_FROM=noreply@taskquadrant.com      # Sender email address
EMAIL_HOST=smtp.gmail.com                # SMTP server hostname
EMAIL_PORT=587                           # SMTP port (587 for TLS, 465 for SSL)
EMAIL_USER=your-email@gmail.com          # SMTP username
EMAIL_PASSWORD=your-app-password         # SMTP password
NEXT_PUBLIC_APP_URL=https://yourapp.com  # For email links
```

## Welcome Email

The welcome email is automatically sent when users register and includes:
- Welcome message
- User ID
- Password (for reference)
- Link to dashboard
- Getting started tips

## Troubleshooting

### Email not sending in production

1. Check that all EMAIL_* variables are set in Railway
2. Check Railway logs for email service errors
3. Verify SMTP credentials are correct
4. Check that firewall allows outbound SMTP (ports 587 or 465)

### Gmail App Password not working

- Make sure 2FA is enabled
- Generate a new App Password
- Use the 16-character password (no spaces)

### SendGrid email failing

- Verify API key starts with `SG.`
- Check that you're using `apikey` as the username
- Verify the sender email is verified in SendGrid

## Security Notes

- Never commit `.env` files with real credentials
- Use Railway's variable system for sensitive data
- Consider rotating email credentials periodically
- For production, use dedicated email services (SendGrid, AWS SES)
- Don't store passwords in emails permanently (consider a "set password on first login" flow)

## Future Improvements

- Add email verification on signup
- Add password reset emails
- Add project/task notification emails
- Add weekly digest emails
