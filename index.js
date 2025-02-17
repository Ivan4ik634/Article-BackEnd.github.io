import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { login, register } from './controllers/User.js';
import checkAuth from './utils/checkAuth.js';
import {
  PostsArticle,
  PostsArticles,
  PostsCreate,
  PostsDelete,
  PostsLike,
  PostsUpdate,
  PostsUser,
  toggleLikeDislikePost,
} from './controllers/Posts.js';
import {
  commentArticle,
  commentArticleDelete,
  commentArticleGetAll,
  commentArticleGetOne,
  commentArticlePatch,
  toggleLikeDislikeComment,
} from './controllers/Comment.js';
import { acticleValidation, validatorComment, validatorRegister } from './validator.js';
import {
  PostsSubscribe,
  SubscribeMe,
  SubscribeToMe,
  toggleSubscribe,
} from './controllers/Subscribe.js';

mongoose
  .connect(
    'mongodb+srv://admin:wwwwww@cluster0.xd1vv.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0',
  )
  .then(() => {
    console.log('DB OK');
  })
  .catch(() => console.log('error'));
const app = express();

const uploadDir = path.join(process.cwd(), 'tmp/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created:', uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});
const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('tmp/uploads'));

app.get('/', (req, res) => {
  res.send('Server is working!');
});
app.post('/auth/login', login);
app.post('/auth/register', validatorRegister, register);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  const filePath = path.join('tmp/uploads', req.file.filename);

  // Проверяем, существует ли файл
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: 'File was not saved on the server' });
  }
});

app.post('/subscribes', checkAuth, SubscribeToMe);
app.get('/subscribes/me', checkAuth, SubscribeMe);
app.get('/posts/subscribes', checkAuth, PostsSubscribe);

app.get('/posts/likes', checkAuth, PostsLike);

app.post('/posts', checkAuth, acticleValidation, PostsCreate);
app.get('/posts', PostsArticles);

app.get('/posts/:id', PostsArticle);
app.delete('/posts/:id', checkAuth, PostsDelete);
app.patch('/posts/:id', checkAuth, acticleValidation, PostsUpdate);
app.get('/:user/posts', PostsUser);

app.post('/likes/:postId', checkAuth, toggleLikeDislikePost);

app.post('/subscribes/:userId', checkAuth, toggleSubscribe);

app.post('/likes/comment/:commentId', checkAuth, validatorComment, toggleLikeDislikeComment);
app.post('/comment/:postId', checkAuth, validatorComment, commentArticle);

app.delete('/comment/:postId/:commentId', checkAuth, commentArticleDelete);
app.patch('/comment/:postId/:commentId', checkAuth, validatorComment, commentArticlePatch);
app.get('/comment/:postId/:commentId', commentArticleGetOne);
app.get('/comment/:postId', commentArticleGetAll);

app.listen(5555, (err) => {
  err ? console.log(err) : console.log('OK');
});
