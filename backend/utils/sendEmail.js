const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Email templates
const emailTemplates = {
  verification: {
    subject: 'Verify Your ExportIndia Account',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ExportIndia!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Thank you for registering with ExportIndia Marketplace. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${data.verificationUrl}</p>
            <p><strong>Note:</strong> This verification link will expire in 24 hours for security purposes.</p>
            <p>If you didn't create an account with ExportIndia, please ignore this email.</p>
            <p>Best regards,<br>The ExportIndia Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ExportIndia Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  passwordReset: {
    subject: 'Password Reset Request - ExportIndia',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>We received a request to reset your password for your ExportIndia account. If you made this request, click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">${data.resetUrl}</p>
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This reset link will expire in 10 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            <p>For security reasons, we recommend using a strong password that includes:</p>
            <ul>
              <li>At least 8 characters</li>
              <li>A mix of uppercase and lowercase letters</li>
              <li>Numbers and special characters</li>
            </ul>
            <p>Best regards,<br>The ExportIndia Security Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ExportIndia Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  orderConfirmation: {
    subject: 'Order Confirmation - ExportIndia',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.buyerName},</h2>
            <p>Thank you for your order! We've received your purchase and are processing it now.</p>
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Total Amount:</strong> ${data.totalAmount}</p>
              <p><strong>Exporter:</strong> ${data.exporterName}</p>
              <p><strong>Expected Delivery:</strong> ${data.expectedDelivery}</p>
            </div>
            <p>You can track your order status in your account dashboard.</p>
            <p>Best regards,<br>The ExportIndia Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 ExportIndia Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration (using actual SMTP)
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development email configuration (using Ethereal for testing)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    // Get template if provided
    let html = options.html;
    let subject = options.subject;

    if (options.template && emailTemplates[options.template]) {
      const template = emailTemplates[options.template];
      html = template.getHtml(options.data || {});
      subject = subject || template.subject;
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'ExportIndia <noreply@exportindia.com>',
      to: options.to,
      subject: subject,
      html: html,
      text: options.text // Plain text fallback
    };

    // Add attachments if provided
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: subject
    });

    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production' && info.envelope) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return info;

  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Send bulk emails (for newsletters, announcements)
const sendBulkEmails = async (recipients, options) => {
  const results = [];
  const batchSize = 10; // Send emails in batches to avoid rate limiting

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchPromises = batch.map(async (recipient) => {
      try {
        const emailOptions = {
          ...options,
          to: recipient.email,
          data: {
            ...options.data,
            name: recipient.name
          }
        };
        
        const result = await sendEmail(emailOptions);
        return { success: true, email: recipient.email, messageId: result.messageId };
      } catch (error) {
        return { success: false, email: recipient.email, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  verifyEmailConfig,
  emailTemplates
};