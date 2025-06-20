# 🌐 Workspace Manager

A powerful team and personal productivity tool where users can collaborate, manage their websites, and boost workflow — all from one unified workspace.

## 🚀 Hosted Link

👉 [Live Website](https://v8-dev.onrender.com/)

## 📸 Screenshots

| Dashboard | Link Management | File Sharing | Tasks | Notes | Monitoring |
|----------|----------------|--------------|-------|-------|------------|
| ![Dashboard](./screenshots/dashboard.png) | ![Link](./screenshots/link.png) | ![Files](./screenshots/files.png) | ![Tasks](./screenshots/tasks.png) | ![Notes](./screenshots/notes.png) | ![Monitor](./screenshots/monitor.png) |

> 📁 Replace the images in `./screenshots/` and update the links above.

---

## ✨ Features

### 🧩 Workspaces & Collaboration
- Create multiple workspaces for teams or personal use.
- Invite team members to collaborate via email.
- Role-based access control for better security and management.

### 🔗 Custom Link Shortener
- Shorten URLs using a **custom domain**.
- Add **password protection** for private links.
- Set **expiry dates** to make links time-sensitive.
- View detailed **click analytics** (views, locations, timestamps).

### 📁 File Sharing
- Upload and share files securely using shareable links.
- Preview support for images, documents, and more.

### ✅ Task Management
- Assign tasks to team members with:
  - **Status** (pending, ongoing, completed)
  - **Priority** (Low, Medium, High)
  - **Deadlines**
- **Email notifications** sent to assignees for task assignment and deadline alerts.

### 🗒️ Notes (Notion-like)
- Create, edit, and organize notes within a workspace.
- Markdown support for formatting.
- Great for brainstorming, documentation, and planning workflows.

### 📡 Website Uptime Monitoring
- Monitor any website for uptime status.
- Set custom **intervals** for checks (e.g., every 5 mins).
- Get notified if the website goes **down**.

---

## 🛠️ Tech Stack

- **Frontend**: React.js / Tailwind CSS (your choice)
- **Backend**: Node.js / Express.js
- **Database**: MongoDB
- **Authentication**: Google OAuth
- **Email Service**: Nodemailer
- **File Storage**: Cloudinary
- **Uptime Monitoring**: Cron Jobs + Fetch/Ping Tools
- **Deployment**: Render

---

## 📦 Installation & Setup (for local development)

```bash
git clone https://github.com/your-username/workspace-manager.git
cd workspace-manager
npm install
# or yarn install
npm run dev
