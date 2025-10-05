# 💬 Chat App Backend

A powerful **real-time chat backend** built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**.  
It supports **user authentication (JWT)**, **one-to-one and group messaging**, **file attachments**, **online status tracking**, and **real-time video calls** using **Socket.IO**.

---

## ⚙️ Tech Stack

- **Node.js** – Backend runtime  
- **Express.js** – Web framework  
- **PostgreSQL** – Relational database  
- **Prisma** – ORM for PostgreSQL  
- **Socket.IO** – Real-time event communication  
- **JWT** – Stateless authentication  
- **Multer / Cloud storage** – (for file & media uploads, if applicable)

---

## 🚀 Features

- 🔐 **User Authentication**
  - Register and login with JWT-based stateless authentication
- 💬 **One-to-One Chat**
  - Send & receive text messages in real time
  - Share attachments and media files
  - Check **online/offline** status of users
  - **Video calling** feature (WebRTC integrated with Socket.IO)
- 👥 **Group Chat**
  - Create, update, or delete groups
  - Add or remove members dynamically
  - Send messages and attachments (no video calls in group)
- ⚡ **Socket.IO Integration**
  - Real-time updates for messages, online status, and typing indicators
========================================
💬 CHAT APP BACKEND - SETUP & INSTALLATION GUIDE
========================================

A backend built with Node.js, Express, PostgreSQL, Prisma ORM, and Socket.IO.

----------------------------------------
🔧 PREREQUISITES
----------------------------------------
1. Node.js (v18+ recommended)
2. Docker & Docker Compose
3. npm or yarn package manager

----------------------------------------
📂 PROJECT SETUP
----------------------------------------

1. Clone the repository
   git clone https://github.com/FaizanFazal12/chatapp-backend
   cd chat-app-backend

2. Start PostgreSQL using Docker
   docker compose up -d

3. Install dependencies
   npm install

4. Create a .env file in the project root with the following variables:
   ----------------------------------------
   DATABASE_URL="postgresql://postgres:12345678@localhost:5432/ecommerce"
   PORT=8000
   JWT_SECRET=your_super_secret_key
   JWT_EXPIRES_IN=1d
   ----------------------------------------

5. Run Prisma migrations to create database tables
   npx prisma migrate dev --name init

6. Start the development server
   npm run dev

----------------------------------------
🚀 SERVER RUNNING
----------------------------------------
The backend will start at:
http://localhost:8000

----------------------------------------
🧰 OPTIONAL TOOLS
----------------------------------------
- Prisma Studio: npx prisma studio
  (View and edit your database visually)
- Postman or Thunder Client for testing API endpoints

----------------------------------------
✅ YOU'RE READY TO GO!
----------------------------------------
Your Chat App backend is now running locally.


## 🧩 Project Structure

