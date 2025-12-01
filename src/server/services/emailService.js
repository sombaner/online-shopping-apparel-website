/**
 * Email Service (Console Sender Stub)
 *
 * Provides email sending functionality with a console-based stub implementation.
 * In production, this would integrate with a real email provider (e.g., SendGrid, AWS SES).
 */

/**
 * Sends an email (stub - logs to console)
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body (optional)
 * @returns {Promise<{ success: boolean, messageId: string }>} Send result
 */
export async function sendEmail({ to, subject, text, html }) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Console output for development/testing
  console.log('\n========== EMAIL SENT (STUB) ==========');
  console.log(`Message ID: ${messageId}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--- Text Body ---');
  console.log(text);
  if (html) {
    console.log('--- HTML Body ---');
    console.log(html);
  }
  console.log('========================================\n');

  return {
    success: true,
    messageId,
  };
}

/**
 * Sends email verification email
 * @param {object} options - Options
 * @param {string} options.email - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.verificationToken - Email verification token
 * @param {string} [options.baseUrl] - Base URL for verification link
 * @returns {Promise<{ success: boolean, messageId: string }>} Send result
 */
export async function sendVerificationEmail({
  email,
  firstName,
  verificationToken,
  baseUrl = process.env.APP_URL || 'http://localhost:3000',
}) {
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

  const subject = 'Verify your email address';
  const text = `Hello ${firstName},

Welcome to our e-commerce platform! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Thanks,
The Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>Hello ${firstName},</h2>
  <p>Welcome to our e-commerce platform! Please verify your email address by clicking the button below:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
  </p>
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
  <p>This link will expire in 24 hours.</p>
  <p>If you did not create an account, please ignore this email.</p>
  <p>Thanks,<br>The Team</p>
</body>
</html>`;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Sends password reset email
 * @param {object} options - Options
 * @param {string} options.email - Recipient email
 * @param {string} options.firstName - User's first name
 * @param {string} options.resetToken - Password reset token
 * @param {string} [options.baseUrl] - Base URL for reset link
 * @returns {Promise<{ success: boolean, messageId: string }>} Send result
 */
export async function sendPasswordResetEmail({
  email,
  firstName,
  resetToken,
  baseUrl = process.env.APP_URL || 'http://localhost:3000',
}) {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request';
  const text = `Hello ${firstName},

We received a request to reset your password. Click the link below to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Thanks,
The Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>Hello ${firstName},</h2>
  <p>We received a request to reset your password. Click the button below to set a new password:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
  </p>
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #666;">${resetUrl}</p>
  <p>This link will expire in 1 hour.</p>
  <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
  <p>Thanks,<br>The Team</p>
</body>
</html>`;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Sends welcome email after successful registration and verification
 * @param {object} options - Options
 * @param {string} options.email - Recipient email
 * @param {string} options.firstName - User's first name
 * @returns {Promise<{ success: boolean, messageId: string }>} Send result
 */
export async function sendWelcomeEmail({ email, firstName }) {
  const subject = 'Welcome to our E-Commerce Platform!';
  const text = `Hello ${firstName},

Your email has been verified successfully! Welcome to our e-commerce platform.

You can now:
- Browse our product catalog
- Add items to your wishlist
- Make purchases
- Track your orders

If you have any questions, feel free to contact our support team.

Happy shopping!
The Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2>Hello ${firstName},</h2>
  <p>Your email has been verified successfully! Welcome to our e-commerce platform.</p>
  <p>You can now:</p>
  <ul>
    <li>Browse our product catalog</li>
    <li>Add items to your wishlist</li>
    <li>Make purchases</li>
    <li>Track your orders</li>
  </ul>
  <p>If you have any questions, feel free to contact our support team.</p>
  <p>Happy shopping!<br>The Team</p>
</body>
</html>`;

  return sendEmail({ to: email, subject, text, html });
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
