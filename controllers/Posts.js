import UserSchema from '../models/User.js';
import PostsSchema from '../models/PostsCreate.js';
import Post from '../models/PostsCreate.js';
import NotificationSchema from '../models/Notification.js';
import mongoose from 'mongoose';
import moment from 'moment';
import { Report } from '../models/Report.js';

import { validationResult } from 'express-validator';
export const PostsCreate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const { title, text, imgURL, tags, surveyOptions, survey } = req.body;

    const user = await UserSchema.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Такого користувача немає!' });
    }
    if (surveyOptions.length > 4) {
      return res.status(404).json({ message: "Більше п'яти опросів нельзя" });
    }

    const doc = new PostsSchema({
      user,
      imgURL,
      title,
      text,
      tags,
      surveyOptions, // список вариантов типа ["JS", "Python"]
      survey: survey || [], // можно не передавать, если нет
    });

    const createdPost = await doc.save();

    // Статистика по голосованию

    res.json({
      ...createdPost.toObject(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const PostsSurvey = async (req, res) => {
  const { option } = req.body; // строка, например "Python"
  const userId = req.userId;
  const postId = req.params.id;

  const post = await PostsSchema.findById(postId);

  if (!post) {
    return res.status(404).json({ message: 'Пост не знайдено!' });
  }

  // Проверка: уже голосовал?
  const alreadyVoted = post.survey.some((vote) => vote.user.toString() === userId);
  if (alreadyVoted) {
    return res.status(400).json({ message: 'Ви вже голосували!' });
  }

  // Проверка: вариант есть в списке?
  if (!post.surveyOptions.includes(option)) {
    return res.status(400).json({ message: 'Такого варіанту немає в опитуванні!' });
  }

  // Добавляем голос
  post.survey.push({
    user: userId,
    surveyOption: option,
  });

  await post.save();

  res.json({ message: 'Голос зараховано!' });
};
export const PostsArticles = async (req, res) => {
  try {
    const Articles = await Post.find()
      .populate('user')
      .populate('comments.comment')
      .populate({
        path: 'comments.comment', // путь к массиву комментариев
        populate: {
          path: 'user', // внутри комментариев заполняем поле user
          select: 'fullName email avatar', // выбираем только нужные поля пользователя
        },
      });

    res.json(Articles.filter((obj) => !obj.hidden));
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!', err });
  }
};
export const PostsArticle = async (req, res) => {
  try {
    const Article = await Post.findById(req.params.id)
      .populate('user')
      .populate('comments.comment')
      .populate({
        path: 'comments.comment', // путь к массиву комментариев
        populate: {
          path: 'user', // внутри комментариев заполняем поле user
          select: 'fullName email avatar', // выбираем только нужные поля пользователя
        },
      });

    await PostsSchema.updateOne(
      { _id: req.params.id },
      {
        views: Article.views + 1,
      },
    );
    if (!Article) {
      res.status(400).json({ message: 'Немає такої статьі!' });
    }
    const votes = Article.survey || [];
    const total = votes.length;
    const counts = {};

    votes.forEach((v) => {
      counts[v.surveyOption] = (counts[v.surveyOption] || 0) + 1;
    });

    const stats = (Article.surveyOptions || []).map((option) => {
      const count = counts[option] || 0;
      return {
        option,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0',
      };
    });
    res.json({ Article, stats });
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
    await NotificationSchema.deleteMany({ article: req.params.id });
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
    const { title, text, tags } = req.body;
    const article = await PostsSchema.findById({ _id: req.params.id });
    if (article.user.toString() !== req.userId) {
      res.status(403).json({ message: 'Ви не власник цієї статьі!' });
    }
    if (!article) {
      res.status(401).json({ message: 'Немає такої статьі' });
    }
    await PostsSchema.updateOne(
      { _id: req.params.id },
      {
        title,

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
    const articles = await PostsSchema.find().populate('user');
    const articlesUser = articles.filter((article) => {
      return article.user._id.toString() === user;
    });

    if (!articlesUser) {
      return res.status(400).json({ message: 'Неправильний айді юзера, або у нього немає статей' });
    }

    res.json(articlesUser.filter((obj) => !obj.hidden));
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};
export const toggleLikeDislikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // action = 'like' или 'dislike'

    const post = await PostsSchema.findById(postId);
    const userReq = await UserSchema.findById(req.userId);
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
      if (post._id !== req.userId) {
        const docNotification = new NotificationSchema({
          user: post.user,
          notification: `Добавився лайк на ${post.title} цьому посту`,
          TextNotification: `Від користувача ${userReq.fullName} `,
          article: postId,
          userReq,
          views: false,
        });
        await docNotification.save();
      }

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
    const posts = await Post.find()
      .populate('user')
      .populate('comments.comment')
      .populate({
        path: 'comments.comment', // путь к массиву комментариев
        populate: {
          path: 'user', // внутри комментариев заполняем поле user
          select: 'fullName email', // выбираем только нужные поля пользователя
        },
      });
    const LikesPostsUser = posts.filter((post) =>
      post.likes.some((obj) => obj.user.toString() === req.userId),
    );
    res.json(LikesPostsUser.filter((obj) => !obj.hidden));
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};
export const UserPosts = async (req, res) => {
  try {
    const user = req.userId;
    const articles = await Post.find().populate('user');
    const articlesUser = articles.filter((article) => {
      return article.user._id.toString() === user;
    });

    res.json(articlesUser);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};
export const reportPost = async (req, res) => {
  try {
    const { PostId, reportCategory } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(PostId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid Post ID or user ID' });
    }

    // Перевіряємо, чи вже юзер репортив це відео в цій категорії
    const existingReport = await Report.findOne({ PostId, reportCategory, userId });
    if (existingReport) {
      return res
        .status(400)
        .json({ message: 'You have already reported this post in this category.' });
    }

    // Додаємо новий репорт
    await Report.create({ PostId, reportCategory, userId, createdAt: new Date() });

    // Перевіряємо кількість репортів конкретної категорії за останню годину
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const categoryReports = await Report.find({
      PostId,
      reportCategory,
      createdAt: { $gte: oneHourAgo },
    });

    if (categoryReports.length >= 10) {
      await Post.findByIdAndDelete(PostId);
      await Report.deleteMany({ PostId });
      return res.json({
        message: 'Post has been permanently deleted due to excessive reports in a single category.',
      });
    }

    // Якщо за 1 годину репортів менше 10 у будь-якій категорії, видаляємо пост і репорти
    setTimeout(async () => {
      const allReports = await Report.find({ PostId, createdAt: { $gte: oneHourAgo } });
      const categoryCounts = {};

      allReports.forEach((report) => {
        categoryCounts[report.reportCategory] = (categoryCounts[report.reportCategory] || 0) + 1;
      });

      const hasCriticalCategory = Object.values(categoryCounts).some((count) => count >= 10);

      if (!hasCriticalCategory) {
        await Post.findByIdAndDelete(PostId);
        await Report.deleteMany({ PostId });
      }
    }, 60 * 60 * 1000);

    res.json({ message: 'Report submitted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const hiddenPost = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;

  if (!postId) {
    return res.status(400).json({ message: 'Невірний айді у поста!' });
  }

  const post = await Post.findById(postId);

  if (!userId) {
    return res.status(400).json({ message: 'У вас немає акаунту!' });
  }

  if (post.user.toString() !== userId) {
    return res.status(400).json({ message: 'У вас немає прав ' });
  }

  // Перевірка, чи пост вже скритий, та переключення состояния
  const isHidden = post.hidden;
  post.hidden = !isHidden;

  await post.save();

  res.json({
    message: isHidden ? 'Пост більше не скритий!' : 'Ви зробили пост скритим!',
  });
};
export const statisticsPost = async (req, res) => {
  const { postId } = req.params;

  // Находим пост по ID
  const post = await Post.findOne({ postId });

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Преобразуем статистику в нужный формат
  const formattedStats = post.statistics.map((stat) => ({
    day: moment(stat.date).format('YYYY-MM-DD'), // Делаем day в формате YYYY-MM-DD
    likes: stat.likes,
    comments: stat.comments,
    views: stat.views,
  }));

  // Отправляем преобразованную статистику
  res.json(formattedStats);
};
export const updateStatistisc = async (req, res) => {
  const { type } = req.body; // type: 'like', 'view', or 'comment'
  const postId = req.params.id;
  // Получаем текущую дату в формате YYYY-MM-DD
  const currentDate = moment().startOf('day').toDate();

  // Находим пост
  let post = await Post.findById(postId);

  // Если пост не найден, создаем новый
  if (!post) {
    return;
  }

  // Проверяем, есть ли статистика для сегодняшнего дня
  let stat = post.statistics.find((s) => moment(s.date).isSame(currentDate, 'day'));

  if (!stat) {
    // Если статистики за этот день нет, создаем новый объект
    stat = { date: currentDate, likes: 0, views: 0, comments: 0 };
    post.statistics.push(stat);
  }

  // Обновляем статистику в зависимости от типа
  if (type === 'like') {
    stat.likes += 1;
  } else if (type === 'DeleteLike') {
    stat.views -= 1;
  } else if (type === 'view') {
    stat.views += 1;
  } else if (type === 'comment') {
    stat.comments += 1;
  } else if (type === 'DeleteComment') {
    stat.comments -= 1;
  }

  // Сохраняем изменения в базе данных
  await post.save();

  res.json(post);
};
