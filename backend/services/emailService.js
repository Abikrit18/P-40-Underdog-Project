const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your email address
    pass: process.env.EMAIL_PASSWORD || 'your-app-password', // Your email password or app password
  },
});

/**
 * Send an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a walk scheduled notification
 * @param {Object} user - User who scheduled the walk
 * @param {Object} walk - Walk details
 * @param {Object} marshall - Marshall assigned to the walk
 */
const sendWalkScheduledEmail = async (user, walk, marshall) => {
  const subject = 'Walk Scheduled - P-40 Underdogs';
  const text = `
    Hello ${user.firstName},
    
    Your walk has been successfully scheduled for ${walk.date} at ${walk.time}.
    
    Marshall: ${marshall.firstName} ${marshall.lastName}
    
    Thank you for supporting P-40 Underdogs!
    
    Best regards,
    The P-40 Underdogs Team
  `;

  return sendEmail(user.email, subject, text);
};

/**
 * Send a walk completed notification
 * @param {Object} user - User who completed the walk
 * @param {Object} walk - Walk details
 */
const sendWalkCompletedEmail = async (user, walk) => {
  const subject = 'Walk Completed - P-40 Underdogs';
  const text = `
    Hello ${user.firstName},
    
    Your walk on ${walk.date} at ${walk.time} has been marked as completed.
    
    Thank you for your participation!
    
    Best regards,
    The P-40 Underdogs Team
  `;

  return sendEmail(user.email, subject, text);
};

/**
 * Send a walk canceled notification
 * @param {Object} user - User whose walk was canceled
 * @param {Object} walk - Walk details
 */
const sendWalkCanceledEmail = async (user, walk) => {
  const subject = 'Walk Canceled - P-40 Underdogs';
  const text = `
    Hello ${user.firstName},
    
    Your walk scheduled for ${walk.date} at ${walk.time} has been canceled.
    
    If you have any questions, please contact us.
    
    Best regards,
    The P-40 Underdogs Team
  `;

  return sendEmail(user.email, subject, text);
};

/**
 * Send a welcome email to new users
 * @param {Object} user - New user
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to P-40 Underdogs!';
  const text = `
    Hello ${user.firstName},
    
    Welcome to P-40 Underdogs! We're excited to have you join our community.
    
    You can now schedule walks with our dogs and help make a difference in their lives.
    
    Best regards,
    The P-40 Underdogs Team
  `;

  return sendEmail(user.email, subject, text);
};

module.exports = {
  sendEmail,
  sendWalkScheduledEmail,
  sendWalkCompletedEmail,
  sendWalkCanceledEmail,
  sendWelcomeEmail,
};
