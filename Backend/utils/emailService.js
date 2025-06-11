import nodemailer from 'nodemailer';

// Create a transporter using SMTP with secure configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER || "nandeeshforstorage3205@gmail.com",
    pass: process.env.EMAIL_APP_PASSWORD || "uzed ejob wfrv ylgd"
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

// Send task assignment email
export const sendTaskAssignmentEmail = async (user, task) => {
  if (!user || !user.email) {
    console.error('Invalid user or missing email address');
    return;
  }

  const mailOptions = {
    from: `"Task Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `New Task Assigned: ${task.title}`,
    html: `
      <h2>You have been assigned a new task</h2>
      <p><strong>Task Title:</strong> ${task.title}</p>
      <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
      <p><strong>Priority:</strong> ${task.priority}</p>
      <p><strong>Deadline:</strong> ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline set'}</p>
      <p><strong>Status:</strong> ${task.status}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Task assignment email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    throw error; // Re-throw the error to handle it in the controller
  }
};

// Send deadline reminder email
export const sendDeadlineReminderEmail = async (user, task) => {
  if (!user || !user.email) {
    console.error('Invalid user or missing email address');
    return;
  }

  const mailOptions = {
    from: `"Task Management System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Task Deadline Reminder: ${task.title}`,
    html: `
      <h2>Task Deadline Reminder</h2>
      <p>The following task is due today:</p>
      <p><strong>Task Title:</strong> ${task.title}</p>
      <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
      <p><strong>Priority:</strong> ${task.priority}</p>
      <p><strong>Status:</strong> ${task.status}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Deadline reminder email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending deadline reminder email:', error);
    throw error; // Re-throw the error to handle it in the controller
  }
}; 