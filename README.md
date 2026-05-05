# 🚀 Team Task Manager

A full-stack project management application with role-based access control, real-time task management, and comprehensive security features.

## 📋 Overview

Team Task Manager is a complete project management solution designed for teams to collaborate effectively. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js), it provides role-based access control, secure authentication, drag-and-drop task management, project collaboration, and complete activity logging.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with access and refresh tokens
- Password complexity validation (8+ chars, uppercase, number, special char)
- Account locking after 5 failed attempts (30 minutes)
- Password history (prevents reuse of last 5 passwords)
- Security questions for account recovery
- HTTP-only cookies for refresh tokens
- Rate limiting on authentication endpoints
- CORS protection with allowed origins

### 👥 Role-Based Access Control
- **Admin** - Full system access, user management, delete any project
- **Manager** - Create projects, manage team members, edit all tasks
- **Member** - View assigned projects, create/edit personal tasks
- **Project-level roles** - Owner, Manager, Member with granular permissions

### 📊 Dashboard
- Real-time statistics (total projects, tasks, completion rate)
- Task distribution by status and priority
- Overdue tasks tracking
- Recent activity feed
- Glass morphism UI design

### 📁 Project Management
- Create, read, update, and delete projects
- Add/remove team members with role assignment
- Project owner cannot be removed
- Member list with role badges
- Archive functionality

### ✅ Task Management
- Kanban board with drag-and-drop interface
- Four status columns: To Do, In Progress, Review, Done
- Priority levels: High, Medium, Low
- Due date tracking with overdue detection
- Task assignment to team members
- Optimistic UI updates for smooth experience

### 👥 Team Management (Admin only)
- View all registered users
- Change user roles (Admin/Manager/Member)
- Lock/unlock user accounts
- User status indicators (Active/Locked)

### ⚙️ User Settings
- Profile information display
- Password change with history check
- Security questions setup
- Logout from all devices

### 📝 Activity Logging
- Complete audit trail of all actions
- User login/logout tracking
- Project and task change history
- IP address logging
- Activity retrieval for admins

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling and utilities |
| React Router DOM | Client-side routing |
| Axios | HTTP client with interceptors |
| Hello Pangea DND | Drag-and-drop functionality |
| React Context API | State management |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Express Validator | Input validation |
| Helmet | Security headers |
| CORS | Cross-origin resource sharing |
| Morgan | HTTP request logging |
| Socket.io | Real-time features (prepared) |

## 📁 Project Structure
