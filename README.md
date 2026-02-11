# 🚀 Social App Backend

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socket.io&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?logo=mongoose&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?logo=google&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-338833?logo=npm&logoColor=white)
![Crypto](https://img.shields.io/badge/Crypto-000000?logo=node.js&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-4A4A4A?logo=npm&logoColor=white)  
![CORS](https://img.shields.io/badge/CORS-339933?logo=npm&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-8A2BE2?logo=npm&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-FF6600?logo=npm&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-232F3E?logo=amazonaws&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-0078D4?logo=gmail&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---
> Production-ready scalable backend for a modern Social Media Web Application.

---

## 📌 Overview

This project is a modular, production-structured backend built using **Node.js, Express, TypeScript, and MongoDB**.

It provides secure authentication, user management, posts, comments, friendships, real-time communication, OTP verification, token management, and scheduled cleanup tasks.

Designed with:

* Clean Architecture principles
* Repository Pattern
* Service Layer abstraction
* Middleware-based security
* Modular feature separation

---

# 🏗 Architecture

```
src/
 ├── modules/
 │    ├── user/
 │    ├── post/
 │    ├── comment/
 │    ├── react/
 │    ├── chat/
 │    └── index.ts
 └── app.ts
```

### Architectural Highlights

* ✅ Modular Feature-Based Structure
* ✅ Repository Pattern
* ✅ Service Layer Logic
* ✅ Global Error Handling
* ✅ JWT Authentication (Access + Refresh)
* ✅ Blacklisted Token System
* ✅ OTP System with Expiration
* ✅ Socket Authentication Layer
* ✅ Cron Jobs for Cleanup

---

# 🔐 Security Features

* JWT Access & Refresh Tokens
* Token Blacklisting
* OTP with expiration & attempts limit
* Password hashing (bcrypt)
* Middleware-based authentication
* Device tracking
* Centralized error handling

---

# ⚙️ Tech Stack

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Node.js    | Runtime                       |
| Express.js | Web Framework                 |
| TypeScript | Type Safety                   |
| MongoDB    | Database                      |
| Mongoose   | ODM                           |
| JWT        | Authentication                |
| Socket.io  | Real-time Communication       |
| Cron       | Scheduled Jobs                |
| AWS S3     | File Storage (Images / Media) |

---

# ☁️ AWS S3 Integration

The application supports secure file uploads (profile images, post media, etc.) using **Amazon S3**.

## 📦 Features

* Secure file uploads
* Pre-signed URL support (optional)
* Public/Private bucket configuration
* Media URL storage inside database
* Environment-based configuration

---

## 🔐 Environment Variables

Add the following to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=social-app-bucket
```

---

## 📤 Upload Flow

1. User uploads file via API
2. Backend validates file type & size
3. File is uploaded to S3 bucket
4. S3 returns file URL
5. URL is stored in database

---

## 🛡 Security Best Practices

* Validate MIME type
* Limit file size
* Use unique file naming (UUID)
* Store sensitive buckets as private
* Use IAM with minimum required permissions
* Prefer pre-signed URLs for private uploads

---

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/MuhammedApdulkawi/SocialApp.git
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Run Development Server

```bash
npm run dev
```

## 4️⃣ Build for Production

```bash
npm run build
npm start
```

---

# 📡 API Documentation

Base URL:

```
/api/
```

---

# 🔑 Authentication APIs (`/user/auth`)

| Method | Endpoint                     | Description                | Auth Required      |
| ------ | ---------------------------- | -------------------------- | ------------------ |
| POST   | `/user/auth/signup`          | Register new user          | ❌                 |
| POST   | `/user/auth/confirm-email`   | Confirm email with OTP     | ❌                 |
| POST   | `/user/auth/login`           | Login user                 | ❌                 |
| POST   | `/user/auth/logout`          | Logout user                | ✅                 |
| POST   | `/user/auth/auth-gmail`      | Login/Register with Google | ❌                 |
| PUT    | `/user/auth/reset-password`  | Reset password             | ❌                 |
| POST   | `/user/auth/forgot-password` | Request password reset     | ❌                 |
| POST   | `/user/auth/change-password` | Change password            | ✅                 |
| POST   | `/user/auth/enable-2fa`      | Enable Two-Factor Auth     | ✅                 |
| POST   | `/user/auth/disable-2fa`     | Disable Two-Factor Auth    | ✅                 |
| POST   | `/user/auth/login-2fa`       | Login with 2FA OTP         | ❌                 |
| POST   | `/user/auth/refresh-token`   | Refresh access token       | ❌ (Refresh Token) |

---

# 👤 User Profile APIs (`/user/profile`)

| Method | Endpoint                               | Description                          | Auth Required |
| ------ | -------------------------------------- | ------------------------------------ | ------------- |
| GET    | `/user/profile/get-profile/:userId`    | Get user profile by ID               | ❌            |
| GET    | `/user/profile/get-all-profiles`       | Get all user profiles                | ❌            |
| PUT    | `/user/profile/update-profile`         | Update user profile                  | ✅            |
| POST   | `/user/profile/upload-profile-picture` | Upload profile picture               | ✅            |
| GET    | `/user/profile/renew-signed-url`       | Renew signed URL for profile picture | ✅            |
| DELETE | `/user/profile/delete-profile`         | Delete user profile                  | ✅            |
| GET    | `/user/profile/search-user`            | Search users                         | ✅            |
| POST   | `/user/profile/deactivate-account`     | Deactivate account                   | ✅            |

## 📧 Email Management

| Method | Endpoint                     | Description          | Auth Required |
| ------ | ---------------------------- | -------------------- | ------------- |
| POST   | `/user/profile/update-Email` | Request email update | ✅            |
| POST   | `/user/profile/change-Email` | Confirm email change | ✅            |

## 🤝 Friendship APIs

| Method | Endpoint                                | Description                  | Auth Required |
| ------ | --------------------------------------- | ---------------------------- | ------------- |
| POST   | `/user/profile/send-friend-request`     | Send friend request          | ✅            |
| POST   | `/user/profile/remove-friend`           | Remove friend                | ✅            |
| POST   | `/user/profile/respond-friend`          | Accept/Reject friend request | ✅            |
| GET    | `/user/profile/list-friends-and-groups` | List friends and groups      | ✅            |

## 🚫 Block Management

| Method | Endpoint                           | Description        | Auth Required |
| ------ | ---------------------------------- | ------------------ | ------------- |
| GET    | `/user/profile/list-blocked-users` | List blocked users | ✅            |
| POST   | `/user/profile/block-user`         | Block a user       | ✅            |
| POST   | `/user/profile/unblock-user`       | Unblock a user     | ✅            |

## 👥 Groups

| Method | Endpoint                     | Description       | Auth Required |
| ------ | ---------------------------- | ----------------- | ------------- |
| POST   | `/user/profile/create-group` | Create chat group | ✅            |

---

# 📝 Post APIs (`/post`)

| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| POST | `/post/add-post` | Create new post | ✅ |
| GET | `/post/home` | Get home feed posts | ✅ |
| GET | `/post/user` | Get user's posts | ✅ |
| GET | `/post/:postId/comments` | Get post with comments | ✅ |
| PUT | `/post/update/:postId` | Update post | ✅ |
| DELETE | `/post/delete/:postId` | Delete post | ✅ |

---

# 💬 Comment APIs (`/comment`)

| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| POST | `/comment/addComment/:refId` | Add comment to post/comment | ✅ |
| DELETE | `/comment/deleteComment/:commentId` | Delete comment | ✅ |
| PUT | `/comment/updateComment/:commentId` | Update comment | ✅ |
| GET | `/comment/getComments/:refId` | Get comments for post | ✅ |
| GET | `/comment/getCommentById/:commentId` | Get single comment | ✅ |
| GET | `/comment/getAllRepliesForComment/:commentId` | Get all replies for comment | ✅ |

---

# ❤️ React APIs (`/react`)

| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| POST | `/react/:postId/addReact` | Add/Toggle reaction on post | ✅ |
| GET | `/react/:postId/ListAllReacts` | Get all reactions for post | ✅ |

---

# 🔄 Real-Time (Socket.io)

* Authenticated socket connection
* Private messaging
* Online status tracking

---

# ⏱ Cron Jobs

* Clean expired blacklist tokens
* Clean old friendship requests

---

# 📦 Production Recommendations

* Use Redis for token blacklist
* Add rate limiting
* Add Helmet
* Enable HTTPS
* Use Docker
* Add Swagger Documentation
* Implement centralized logging (Winston/Pino)

---

# 🧪 Testing (Recommended)

Use:

* Jest
* Supertest

---

# 📄 License

MIT License

---

# 👨‍💻 Author

**Muhammed Apdulkawi**
Dizzy Backend Developer

---

# ⭐ Support

If you like this project:

* ⭐ Star the repository
* 🍴 Fork it
* 🛠 Contribute

---

> Built with scalability, security, and production-readiness in mind.
