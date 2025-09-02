const prisma = require('../db/db.config');
const redis = require("../redisClient");

// Helper: always generate consistent keys
function generateChatKey(sender_id, receiver_id) {
    const ids = [sender_id, receiver_id].sort();
    return `chat:${ids[0]}:${ids[1]}`;
}

const ChatController = {
    getOnetoOneChat: async (req, res, next) => {
        try {
            const { sender_id, receiver_id } = req.params;
            const cacheKey = generateChatKey(sender_id, receiver_id);
            const cachedChat = await redis.get(cacheKey);

            if (cachedChat) {
                return res.status(200).json({
                    message: 'Chat found (from cache)',
                    chat: JSON.parse(cachedChat),
                });
            }

            // 2. Query DB
            let findChat = await prisma.chat.findFirst({
                where: {
                    AND: [
                        { users: { some: { id: sender_id } } },
                        { users: { some: { id: receiver_id } } }
                    ]
                },
                include: {
                    messages: {
                        orderBy: { created_at: 'asc' },
                        include: {
                            sender: { select: { name: true, id: true } },
                            receiver: { select: { name: true, id: true } }
                        }
                    }
                }
            });

            if (!findChat) {
                findChat = await prisma.chat.create({
                    data: {
                        users: { connect: [{ id: sender_id }, { id: receiver_id }] }
                    },
                    include: {
                        messages: {
                            orderBy: { created_at: 'asc' },
                            include: {
                                sender: { select: { name: true, id: true } },
                                receiver: { select: { name: true, id: true } }
                            }
                        }
                    }
                });
            }

            // 3. Cache result
            await redis.set(cacheKey, JSON.stringify(findChat));

            return res.status(200).json({
                message: 'Chat found (from DB)',
                chat: findChat,
            });
        } catch (error) {
            next(error);
        }
    },

    getChatMessages: async (req, res, next) => {
        try {
            const { chat_id } = req.params;
            const cacheKey = `chat:messages:${chat_id}`;

            // Try Redis
            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.status(200).json({
                    message: 'Messages found (from cache)',
                    messages: JSON.parse(cached),
                });
            }

            // DB
            const messages = await prisma.message.findMany({
                where: { chat_id },
                orderBy: { created_at: 'asc' }
            });

            // Cache
            await redis.set(cacheKey, JSON.stringify(messages), "EX", 60);

            return res.status(200).json({
                message: 'Messages found (from DB)',
                messages
            });
        } catch (error) {
            next(error);
        }
    },

    getChats: async (req, res, next) => {
        try {
            const { user_id } = req.params;
            const cacheKey = `user:chats:${user_id}`;

            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.status(200).json({
                    message: 'Chats found (from cache)',
                    chats: JSON.parse(cached)
                });
            }

            const chats = await prisma.chat.findMany({
                where: { users: { some: { id: user_id } } },
                include: {
                    users: true,
                    messages: {
                        orderBy: { created_at: 'desc' },
                        take: 1
                    }
                }
            });

            await redis.set(cacheKey, JSON.stringify(chats), "EX", 60);

            return res.status(200).json({
                message: 'Chats found (from DB)',
                chats
            });
        } catch (error) {
            next(error);
        }
    },

    getGroupChat: async (req, res, next) => {
        try {
            const { group_id } = req.params;
            const cacheKey = `group:${group_id}`;

            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.status(200).json({
                    message: 'Group chat found (from cache)',
                    groupChat: JSON.parse(cached)
                });
            }

            const groupChat = await prisma.group.findUnique({
                where: { id: group_id },
                include: {
                    messages: {
                        orderBy: { created_at: 'asc' },
                        include: {
                            user: { select: { name: true, id: true } }
                        }
                    },
                    users: {
                        where: { group_users: { some: { group_id } } },
                        select: { name: true, id: true }
                    }
                }
            });

            await redis.set(cacheKey, JSON.stringify(groupChat), "EX", 60);

            return res.status(200).json({
                message: 'Group chat found (from DB)',
                groupChat
            });
        } catch (error) {
            next(error);
        }
    },

    sendMessageWithAttachment: async (req, res, next) => {
        try {
            const { chat_id, receiver_id, content } = req.body;
            const sender_id = req.user.id;

            let attachmentData = {};
            if (req.file) {
                attachmentData = {
                    attachmentUrl: `/uploads/${req.file.filename}`,
                    attachmentName: req.file.originalname,
                    attachmentType: req.file.mimetype,
                    attachmentSize: req.file.size
                };
            }

            const message = await prisma.message.create({
                data: {
                    chat_id,
                    sender_id,
                    receiver_id,
                    content: content || '',
                    type: req.file ? 'attachment' : 'text',
                    ...attachmentData
                },
                include: {
                    sender: { select: { name: true, id: true } },
                    receiver: { select: { name: true, id: true } }
                }
            });

            // Invalidate related cache
            const chatKey = generateChatKey(sender_id, receiver_id);
            await redis.del(chatKey);
            await redis.del(`chat:messages:${chat_id}`);

            req.io.to(chat_id).emit('receive_message', message);
            res.status(201).json({ message: 'Message sent', data: message });
        } catch (error) {
            next(error);
        }
    },
    getGroups: async (req, res, next) => {
        try {

            const groups = await prisma.group.findMany({
                where: {
                    group_users: { some: { user_id: req.user.id } }
                }
            });




            return res.status(200).json({ message: 'Groups found', groups: groups });




        }




        catch (error) {


            return next(error)


        }



    },
    sendGroupMessageWithAttachment: async (req, res, next) => {
        try {
            const { group_id, content } = req.body;
            const user_id = req.user.id;

            let attachmentData = {};
            if (req.file) {
                attachmentData = {
                    attachmentUrl: `/uploads/${req.file.filename}`,
                    attachmentName: req.file.originalname,
                    attachmentType: req.file.mimetype,
                    attachmentSize: req.file.size
                };
            }

            const message = await prisma.groupMessage.create({
                data: {
                    group_id,
                    user_id,
                    content: content || '',
                    type: req.file ? 'attachment' : 'text',
                    ...attachmentData
                },
                include: {
                    user: { select: { name: true, id: true } }
                }
            });

            // Invalidate cache
            await redis.del(`group:${group_id}`);

            req.io.to(group_id).emit('receive_group_message', message);
            res.status(201).json({ message: 'Group message sent', data: message });
        } catch (error) {
            next(error);
        }
    },
    createGroup: async (req, res, next) => {
        try {
            const { name, user_ids } = req.body;
            const group = await prisma.group.create({
                data: {
                    name: name,
                    users: {
                        connect: [...user_ids.map(id => ({ id: id })), { id: req.user.id }]
                    },
                    admin_id: req.user.id
                }
            });

            const groupUsers = await prisma.groupUser.createMany({
                data: [...user_ids.map(id => ({ group_id: group.id, user_id: id })),
                { group_id: group.id, user_id: req.user.id }]
            });

            const groupMessages = await prisma.groupMessage.create({
                data: { group_id: group.id, user_id: req.user.id, content: `Welcome to the group ${name}` }
            });

            return res.status(200).json({
                message: 'Group created',
                group: group,
                groupUsers: groupUsers,
                groupMessages: groupMessages
            });
        } catch (error) {
            next(error);
        }
    },


    removeUserFromGroup: async (req, res, next) => {
        try {
            const { group_id, user_id } = req.params;

            // Check if the requesting user is the admin of the group
            const group = await prisma.group.findUnique({
                where: { id: group_id }
            });

            console.log('group', group.admin);
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }

            if (group.admin_id !== req.user.id) {
                return res.status(403).json({ message: 'Only group admin can remove users' });
            }

            // Remove user from group
            await prisma.groupUser.deleteMany({
                where: {
                    group_id: group_id,
                    user_id: user_id
                }
            });

            // Create a system message about user removal
            const message = await prisma.groupMessage.create({
                data: {
                    group_id: group_id,
                    user_id: req.user.id,
                    content: `User has been removed from the group by admin`
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            id: true
                        }
                    }
                }
            });
            req.io.to(group_id).emit('receive_group_message', message);
            req.io.to(group_id).emit('remove_group_user', user_id)
            return res.status(200).json({
                message: 'User removed from group successfully'
            });
        } catch (error) {
            next(error);
        }
    },

    addUserToGroup: async (req, res, next) => {
        try {
            const { group_id } = req.params;
            const { user_ids } = req.body;

            // Check if the requesting user is the admin of the group
            const group = await prisma.group.findUnique({
                where: { id: group_id }
            });

            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }

            if (group.admin_id !== req.user.id) {
                return res.status(403).json({ message: 'Only group admin can add users' });
            }

            // Add users to group
            const groupUsers = await prisma.groupUser.createMany({
                data: user_ids.map(user_id => ({
                    group_id: group_id,
                    user_id: user_id
                })),
                skipDuplicates: true
            });

            // Create a system message about user addition
            const message = await prisma.groupMessage.create({
                data: {
                    group_id: group_id,
                    user_id: req.user.id,
                    content: `New members have been added to the group by admin`
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            id: true
                        }
                    }
                }
            });
            req.io.to(group_id).emit('receive_group_message'
                , message);

            return res.status(200).json({
                message: 'Users added to group successfully',
                groupUsers
            });
        } catch (error) {
            next(error);
        }
    },

};

module.exports = ChatController;




