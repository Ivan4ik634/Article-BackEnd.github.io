import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import http from 'http';
import { Server } from 'socket.io';

import {
  GetMe,
  GetUser,
  login,
  register,
  saveAvatar,
  saveBadge,
  saveBiograffy,
  SearchUsersAndPosts,
  UserHistoryAll,
  UserHistoryCreate,
  UserHistoryDelete,
  UserHistoryDeleteAll,
  UserNotification,
} from './controllers/User.js';
import checkAuth from './utils/checkAuth.js';
import {
  hiddenPost,
  PostsArticle,
  PostsArticles,
  PostsCreate,
  PostsDelete,
  PostsLike,
  PostsSurvey,
  PostsUpdate,
  PostsUser,
  reportPost,
  statisticsPost,
  toggleLikeDislikePost,
  updateStatistisc,
  UserPosts,
} from './controllers/Posts.js';
import {
  commentArticle,
  commentArticleDelete,
  commentArticleGetAll,
  commentArticleGetAllSorted,
  commentArticleGetOne,
  commentArticlePatch,
  securedComment,
  toggleLikeDislikeComment,
} from './controllers/Comment.js';
import {
  acticleValidation,
  validatorComment,
  validatorEdit,
  validatorRegister,
} from './validator.js';
import {
  PostsSubscribe,
  SubscribeMe,
  SubscribeToMe,
  toggleSubscribe,
} from './controllers/Subscribe.js';
import { TagsDelete, TagsDeleteAllUser, TagsGetAll, TagsPost } from './controllers/Tags.js';
import { BlockPost, BlockUser, UnblockUser } from './controllers/blockUser.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import 'dotenv/config';
import Notification from './models/Notification.js';
import { Message } from './models/Message.js';
import { Chat } from './models/Chat.js';
import User from './models/User.js';
import { timeStamp } from 'console';

mongoose
  .connect(
    'mongodb+srv://admin:wwwwww@db.xp4rr.mongodb.net/?retryWrites=true&w=majority&appName=DB',
    { useNewUrlParser: true, useUnifiedTopology: true },
  )
  .then(() => console.log('✅ Подключено к MongoDB!'))
  .catch((err) => {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    process.exit(1); // Завершаем процесс, если БД не подключилась
  });

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: 'dfycv7biq',
  api_key: '367843177175288',
  api_secret: 'oJP0SrNmqpeVJEYAMwfpHULcX4Q',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads', // Папка в Cloudinary
    resource_type: 'auto', // Разрешает все форматы (jpg, png, webp, gif и т.д.)
    public_id: (req, file) => file.originalname, // Оставляет оригинальное имя файла
  },
});
const port = process.env.PORT || 5555;

const upload = multer({ storage });
app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));

app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err); // Лог в консоль
  res.status(500).json({
    message: 'Помилка сервера!',
    error: err.message || 'Неизвестная ошибка',
    stack: err.stack, // Выведет стек ошибки
  });
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://article-next-js.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.get('/chats', checkAuth, async (req, res) => {
  const chats = await Chat.find({
    participants: { $in: [req.userId] },
  }).populate('participants');

  res.json(chats);
});
//create Chats
app.post('/chats', async (req, res) => {
  try {
    const { participants, name } = req.body;
    const newChat = new Chat({
      participants,
      name,
      messages: [],
    });
    console.log(newChat, participants, name);
    await newChat.save();
    const populatedChat = await Chat.findById(newChat._id).populate('participants'); // Потом популятим
    console.log(populatedChat);
    // const docNotification = await NotificationSchema.create({
    //   user: participants[1],
    //   notification: `Добавився чат!`,
    //   TextNotification: `Назва чата ${name}`,
    //   userReq: req.userId,
    //   views: false,
    // });
    // await docNotification.save();
    res.json(populatedChat);
  } catch (error) {
    console.log(error);
  }
});
//Chat Delete

//pin Chat
app.post('/chats/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);

    if (!chat) return;
    chat.pin = !chat.pin;
    await chat.save();
    res.json({ message: 'pin chat true' });
  } catch (err) {
    console.log(err);
  }
});
// Эндпоинт для получения сообщений конкретного чата

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId) return;

  // Обновляем статус пользователя
  await User.findByIdAndUpdate(userId, { online: true });

  const chats = await Chat.find({ participants: userId }).populate({
    path: 'participants',
  });

  const filteredChats = chats.filter((chat) =>
    chat.participants.some((p) => p._id.toString() !== userId),
  );

  // 3. Отправим клиенту список чатов с онлайн-юзерами
  socket.to(userId).emit('online:users', { users: filteredChats });
  // Присоединяемся к глобальной комнате (например, на странице "Чаты")
  socket.on('joinGlobalRoom', () => {
    socket.join('global-room');
  });
  socket.on('deleteChat', async ({ chatId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const participants = chat.participants; // [user1Id, user2Id]

      await Chat.deleteOne({ _id: chatId }); // сначала удаляем чат

      // Для каждого участника отправляем его актуальные чаты
      for (const userId of participants) {
        const chats = await Chat.find({ participants: userId }); // только после удаления
        io.to(userId.toString()).emit('chatsUpdate', { chats });
      }
    } catch (err) {
      console.log(err);
    }
  });
  // Присоединяемся к конкретной комнате по chatId
  socket.on('joinRoom', async ({ senderId, receiverId }) => {
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, receiverId],
        messages: [],
      });
      await chat.save();
    }

    socket.join(chat._id.toString());
  });
  // Отмечаем сообщения как прочитанные
  socket.on('readMessages', async ({ chatId, userId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      let updated = false;

      chat.messages.forEach((msg) => {
        if (!msg.isRead && msg.senderId !== userId) {
          msg.isRead = true;
          updated = true;
        }
      });

      if (updated) {
        await chat.save();
        io.to(chatId).emit('messagesRead', { chatId, userId });
        io.to('global-room').emit('chatListUpdate', {
          chatId: chat._id.toString(),
          messages: chat.messages,
        });
      }
    } catch (err) {
      console.error('Error reading messages:', err);
    }
  });
  // Отправка сообщения
  socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, receiverId],
        messages: [],
      });
      await chat.save();
    }

    const message = {
      _id: new mongoose.Types.ObjectId(),
      chatId: chat._id,
      senderId,
      receiverId,
      from: senderId,
      text,
      timestamp: new Date(),
      isRead: false,
    };

    chat.messages.push(message);
    await chat.save();
    console.log(chat);
    // Отправка в чат-комнату
    io.to(chat._id.toString()).emit('newMessage', message);

    // Отправка в глобальную комнату для обновления списка чатов
    io.to('global-room').emit('chatListUpdate', {
      chatId: chat._id.toString(),
      messages: chat.messages,
    });
  });
  // Удаление одного сообщения
  socket.on('deleteMessage', async ({ roomId, messageId }) => {
    try {
      const chat = await Chat.findById(roomId);
      if (!chat) return;

      const messageIndex = chat.messages.findIndex((msg) => msg._id.toString() === messageId);

      if (messageIndex === -1) return;

      chat.messages.splice(messageIndex, 1);
      await chat.save();

      io.to(roomId).emit('messageDeleted', { messageId });
      io.to('global-room').emit('chatListUpdate', {
        chatId: chat._id.toString(),
        messages: chat.messages,
      });
    } catch (err) {
      console.error('Ошибка при удалении сообщения:', err);
    }
  });
  // Очистка истории чата
  socket.on('clearHistory', async ({ chatId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.messages = [];
        await chat.save();

        io.to(chatId).emit('historyClear', { chatId });
        io.to('global-room').emit('chatListUpdate', {
          chatId: chat._id.toString(),
          messages: chat.messages,
        });
      }
    } catch (error) {
      console.error('Ошибка при очистке истории чата:', error);
    }
  });

  // Отключение пользователя
  socket.on('disconnect', async () => {
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        online: false,
        lastSeen: new Date(),
      });

      const filteredChatsDisconect = chats.filter((chat) =>
        chat.participants.some((p) => p._id.toString() !== userId),
      );
      io.to(userId).emit('online:users', { users: filteredChatsDisconect });
    }
  });
});

server.listen(4000, () => console.log('Server running on port 4000'));
// Тестовый маршрут
app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({ url: req.file.path });
});

app.post('/upload/avatar', upload.single('image'), (req, res) => {
  res.json({ url: req.file.path });
});
app.post('/upload/badge', upload.single('image'), (req, res) => {
  res.json({ url: req.file.path });
});
app.post('/auth/login', login);
app.post('/auth/register', validatorRegister, register);
app.get('/auth/me', checkAuth, GetMe);

app.post('/saveBiograffy', checkAuth, saveBiograffy);

app.post('/saveAvatar', checkAuth, saveAvatar);
app.post('/saveBadge', checkAuth, saveBadge);

app.get('/subscribes', checkAuth, SubscribeToMe);
app.get('/subscribes/me', checkAuth, SubscribeMe);
app.get('/posts/subscribes', checkAuth, PostsSubscribe);
app.get('/infoProfile/:userId', GetUser);

app.get('/hiddenPost/:id', checkAuth, hiddenPost);
app.get('/securedComment/:id', checkAuth, securedComment);
app.post('/updateStats/:id', checkAuth, updateStatistisc);

app.get('/getStats/:postId', checkAuth, statisticsPost);

app.get('/search', SearchUsersAndPosts);

app.get('/notification', checkAuth, UserNotification);
app.patch('/notifications/read', checkAuth, async (req, res) => {
  const userId = req.userId;
  await Notification.updateMany({ user: userId, views: false }, { $set: { views: true } });

  res.json({ success: true });
});
app.get('/posts/likes', checkAuth, PostsLike);
app.get('/profile/posts', checkAuth, UserPosts);

app.post('/posts', checkAuth, acticleValidation, PostsCreate);
app.post('/post/:id/voit', checkAuth, PostsSurvey);
app.get('/posts', PostsArticles);
app.post('/report/posts', checkAuth, reportPost);

app.get('/comment/:postId', commentArticleGetAll);
app.post('/comment/sort/:postId', commentArticleGetAllSorted);

app.get('/tags', checkAuth, TagsGetAll);
app.delete('/tags/:tagsId', checkAuth, TagsDelete);
app.delete('/tags', checkAuth, TagsDeleteAllUser);
app.post('/tags', checkAuth, TagsPost);

app.post('/block/:userId', checkAuth, BlockUser);
app.get('/block/posts', checkAuth, BlockPost);
app.delete('/block/:blockedUserId', checkAuth, UnblockUser);

app.get('/posts/:id', PostsArticle);
app.post('/comment/:postId', checkAuth, commentArticle);

app.delete('/posts/:id', checkAuth, PostsDelete);
app.patch('/posts/:id', checkAuth, acticleValidation, PostsUpdate);
app.get('/:user/posts', PostsUser);

app.post('/likes/:postId', checkAuth, toggleLikeDislikePost);
app.post('/subscribes/:userId', checkAuth, toggleSubscribe);
app.post('/likes/comment/:commentId', checkAuth, toggleLikeDislikeComment);

app.delete('/comment/:postId/:commentId', checkAuth, commentArticleDelete);
app.patch('/comment/:postId/:commentId', checkAuth, validatorComment, commentArticlePatch);
app.get('/comment/:postId/:commentId', commentArticleGetOne);

app.post('/history', checkAuth, UserHistoryCreate);
app.get('/history', checkAuth, UserHistoryAll);
app.delete('/history/:id', checkAuth, UserHistoryDelete);
app.delete('/history', checkAuth, UserHistoryDeleteAll);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
