import UserSchema from '../models/User.js';
import PostsSchema from '../models/PostsCreate.js';
import { validationResult } from 'express-validator';
export const PostsCreate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    const { title, text, imgURL, tags } = req.body;
    const user = await UserSchema.findOne({ _id: req.userId });
    if (!user) {
      res.status(404).json({ message: 'Такого користувача немає!' });
    }
    const doc = new PostsSchema({
      user,
      imgURL,
      title,
      text,
      tags,
    });
    const createPosts = await doc.save();
    res.json(createPosts);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const PostsArticles = async (req, res) => {
  try {
    const Articles = await PostsSchema.find().populate('user');
    res.json(Articles);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const PostsArticle = async (req, res) => {
  try {
    const Article = await PostsSchema.findById(req.params.id).populate('user');
    await PostsSchema.updateOne(
      { _id: req.params.id },
      {
        views: Article.views + 1,
      },
    );
    if (!Article) {
      res.status(400).json({ message: 'Немає такої статьі!' });
    }
    res.json(Article);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const PostsDelete = async (req, res) => {
  try {
    const article = await PostsSchema.findById({ _id: req.params.id });
    if (article.user.toString() !== req.userId) {
      res.status(403).json({ message: 'Ви не власник цієї статьі!' });
    }
    if (!article) {
      res.status(400).json({ message: 'Немає такої статьі' });
    }
    await PostsSchema.deleteOne({ _id: req.params.id });
    res.json({ message: 'Ви видалили свою статью!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const PostsUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    const { title, text, imgURL, tags } = req.body;
    const article = await PostsSchema.findById({ _id: req.params.id });
    if (article.user.toString() !== req.userId) {
      res.status(403).json({ message: 'Ви не власник цієї статьі!' });
    }
    if (!article) {
      res.status(400).json({ message: 'Немає такої статьі' });
    }
    await PostsSchema.updateOne(
      { _id: req.params.id },
      {
        title,
        imgURL,
        text,
        tags,
      },
    );
    res.json({ message: 'Ви обновили свою статью!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const PostsUser = async (req, res) => {
  try {
    const user = req.params.user;
    const articles = await PostsSchema.find();
    const articlesUser = articles.filter((article) => article.user.toString() === user);

    if (!articlesUser.length) {
      return res.status(400).json({ message: 'Неправильний айді юзера, або у нього немає статей' });
    }

    res.json(articlesUser);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};
export const toggleLikeDislikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // action = 'like' или 'dislike'

    const post = await PostsSchema.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    // Проверяем, ставил ли пользователь лайк или дизлайк
    const likeIndex = post.likes.findIndex((like) => like.user.toString() === req.userId);
    const dislikeIndex = post.dislikes.findIndex(
      (dislike) => dislike.user.toString() === req.userId,
    );

    if (action === 'like') {
      if (likeIndex !== -1) {
        // Если лайк уже есть — удаляем его
        post.likes.splice(likeIndex, 1);
        await post.save();
        return res.json({ message: 'Лайк удалён', post });
      }

      // Удаляем дизлайк, если он был
      if (dislikeIndex !== -1) {
        post.dislikes.splice(dislikeIndex, 1);
      }

      // Добавляем лайк
      post.likes.push({ user: req.userId });
      await post.save();
      return res.json({ message: 'Лайк добавлен', post });
    }

    if (action === 'dislike') {
      if (dislikeIndex !== -1) {
        // Если дизлайк уже есть — удаляем его
        post.dislikes.splice(dislikeIndex, 1);
        await post.save();
        return res.json({ message: 'Дизлайк удалён', post });
      }

      // Удаляем лайк, если он был
      if (likeIndex !== -1) {
        post.likes.splice(likeIndex, 1);
      }

      // Добавляем дизлайк
      post.dislikes.push({ user: req.userId });
      await post.save();
      return res.json({ message: 'Дизлайк добавлен', post });
    }

    res.status(400).json({ message: 'Некорректное действие' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

export const PostsLike = async (req, res) => {
  try {
    const posts = await PostsSchema.find();
    const LikesPostsUser = posts.filter((post) =>
      post.likes.some((obj) => obj.user.toString() === req.userId),
    );
    res.json(LikesPostsUser);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};
