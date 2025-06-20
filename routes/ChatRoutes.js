const express = require('express');
const router = express.Router();
const ChatController = require('../controller/ChatController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/get-chat/:sender_id/:receiver_id', auth, ChatController.getOnetoOneChat);
router.get('/get-chat-messages/:chat_id', auth, ChatController.getChatMessages);
router.get('/get-chats/:user_id', auth, ChatController.getChats);
router.get('/get-group-chat/:group_id', auth, ChatController.getGroupChat);
router.get('/get-groups', auth, ChatController.getGroups);
router.post('/create-group', auth, ChatController.createGroup);
router.delete('/remove-user/:group_id/:user_id', auth, ChatController.removeUserFromGroup);
router.post('/add-users/:group_id', auth, ChatController.addUserToGroup);
router.post('/send-message-with-attachment', auth, upload.single('attachment'), ChatController.sendMessageWithAttachment);
router.post('/send-group-message-with-attachment', auth, upload.single('attachment'), ChatController.sendGroupMessageWithAttachment);


module.exports = router;