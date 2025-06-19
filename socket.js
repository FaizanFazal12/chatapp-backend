// socket.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function setupSocket(io) {
  // Middleware for authenticating socket connections
  // io.use((socket, next) => {
  //   const token = socket.handshake.auth.token;
  //   console.log(token);
  //   if (!token) return next(new Error("No token"));

  //   try {
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //     socket.user = decoded;
  //     console.log(socket.user);
  //     next();
  //   } catch (err) {
  //     next(new Error("Invalid token"));
  //   }
  // });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });
    socket.on('leave', (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat: ${chatId}`);
    });
    socket.on('send_message', async (data) => {
      const { sender_id, receiver_id, content, chat_id } = data;
      const message = await prisma.message.create({
        data: {
          content,
          sender_id: sender_id,
          chat_id: chat_id,
          receiver_id: receiver_id
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      io.to(chat_id).emit('receive_message', message);
    });

    socket.on('join_group', (groupId) => {
      socket.join(groupId);
      console.log(`User joined group: ${groupId}`);
    });
    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      console.log(`User left group: ${groupId}`);
    });
    socket.on('send_group_message', async (data) => {
      const { group_id, content, user_id } = data;
      const message = await prisma.groupMessage.create({
        data: { group_id, user_id, content },
        include: {
          user: {
            select: {
              name: true,
              id: true
            }
          }
        }
      });

      io.to(group_id).emit('receive_group_message', message);
    });

   
   

    socket.on('send_voice_note', async (data) => {
      const { sender_id, receiver_id, audio, chat_id } = data;

      try {
        const filename = `voice-note-${Date.now()}.webm`;
        const filepath = path.join(uploadsDir, filename);

        fs.writeFileSync(filepath, audio);

        const message = await prisma.message.create({
          data: {
            content: `/uploads/${filename}`,
            sender_id: sender_id,
            chat_id: chat_id,
            receiver_id: receiver_id,
            type: 'voice'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            },
            receiver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        io.to(chat_id).emit('receive_message', message);
      } catch (error) {
        console.error('Error handling voice note:', error);
        socket.emit('error', { message: 'Failed to send voice note' });
      }
    });

    socket.on('send_group_voice_note', async (data) => {
      const { sender_id, group_id, audio } = data;

      try {
        const filename = `voice-note-${Date.now()}.webm`;
        const filepath = path.join(uploadsDir, filename);

        fs.writeFileSync(filepath, audio);

        const message = await prisma.groupMessage.create({
          data: {
            group_id, user_id: sender_id, type: 'voice', content: `/uploads/${filename}`
          },
            include: {
              user: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
        })

        io.to(group_id).emit('receive_group_message', message);
      } catch (error) {
        console.error('Error handling group voice note:', error);
        socket.emit('error', { message: 'Failed to send group voice note' });
      }
    })

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;
