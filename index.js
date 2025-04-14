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
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/chats', checkAuth, async (req, res) => {
  const chats = await Chat.find({
    participants: { $in: [req.userId] },
  });
  res.json(chats);
});

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

// Эндпоинт для получения сообщений конкретного чата
app.get('/messages/:roomId', async (req, res) => {
  const chat = await Chat.findById(req.params.roomId);
  res.json(chat.messages);
});

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(userId, socket.id);
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { online: true });

  // Уведомляем других
  socket.broadcast.emit('user-online', { userId });
  socket.on('joinRoom', async ({ senderId, receiverId }) => {
    // Создаем уникальный roomId для чата между пользователями
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      // Если чат не существует, создаем новый
      chat = new Chat({
        participants: [senderId, receiverId],
        messages: [],
      });
      await chat.save();
    }

    // Подключаемся к комнате по ID чата
    socket.join(chat._id.toString());
  });

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

    // Создаем сообщение и сохраняем его в чат
    const message = { senderId, receiverId, from: senderId, text };
    chat.messages.push(message);
    await chat.save();
    // Отправляем новое сообщение в комнату чата
    io.to(chat._id.toString()).emit('newMessage', message);
  });

  socket.on('deleteMessage', async ({ roomId, messageId }) => {
    const chat = await Chat.findById(roomId);
    if (chat) {
      // Удаляем сообщение по его ID
      chat.messages.id(messageId).remove();
      await chat.save();
      io.to(roomId).emit('messageDeleted', { messageId });
    }
  });

  // 🧯 Когда отключается
  socket.on('disconnect', async () => {
    await User.findByIdAndUpdate(userId, { online: false });

    socket.broadcast.emit('user-offline', { userId });
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
