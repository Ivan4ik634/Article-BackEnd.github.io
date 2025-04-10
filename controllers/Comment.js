import PostsSchema from '../models/PostsCreate.js';
import CommentSchema from '../models/Comment.js';
import Post from '../models/PostsCreate.js';
import NotificationSchema from '../models/Notification.js';
import UserSchema from '../models/User.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import Comment from '../models/Comment.js';

export const commentArticle = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postId = req.params.postId;
    const post = await Post.findById(postId).populate('comments.comment');
    if (!post) {
      return res.status(404).json({ message: 'Пост не знайдено' });
    }

    const user = req.userId;
    const userfull = await User.findById(user);
    if (!userfull) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    const doc = new CommentSchema({
      user,
      article: postId,
      text: req.body.text,
    });

    post.comments.push({ comment: doc._id });

    // Запускаем сохранение одновременно, чтобы ускорить
    await Promise.all([doc.save(), post.save()]);

    // Создаем уведомление, но не ждем его завершения
    if (req.userId !== post.user._id.toString()) {
      const docNotification = new NotificationSchema({
        user: post.user,
        notification: `Створився комент на ${post.title} цьому посту`,
        TextNotification: `Від користувача ${userfull.fullName} з написом ${doc.text} `,
        article: postId,
        userReq: userfull._id,
        views: false,
      });
      docNotification.save().catch((err) => console.error('Ошибка сохранения уведомления:', err));
    }

    res.json({ message: 'Ви добавили коментарій!', doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const commentArticleGetAll = async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.postId })
      .populate('user')
      .populate('comments.comment')
      .populate({
        path: 'comments.comment', // путь к массиву комментариев
        populate: {
          path: 'user', // внутри комментариев заполняем поле user
          select: 'fullName email', // выбираем только нужные поля пользователя
        },
      }); // здесь мы заполняем данные пользователя в комментариях

    if (!post) {
      res.status(400).json({ message: 'Такої статьі немає!' });
    }
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const commentArticleGetAllSorted = async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.postId })
      .populate('user')
      .populate('comments.comment')
      .populate({
        path: 'comments.comment',
        populate: {
          path: 'user',
          select: 'fullName email',
        },
      });
    if (!post) {
      res.status(400).json({ message: 'Такої статьі немає!' });
    }

    if (req.body.action === 'SortLikes') {
      const sortedPosts = post.comments.sort(
        (a, b) => b.comment.likes.length - a.comment.likes.length,
      );

      res.json(sortedPosts);
    }
    if (req.body.action === 'SortData') {
      const sortedPosts = post.comments.sort(
        (a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt),
      );
      res.json(sortedPosts);
    }
  } catch (err) {
    res.status(500).json({ message: `Помилка сервера! ${err}` });
  }
};
export const commentArticleGetOne = async (req, res) => {
  try {
    const comment = await Comment.findById({ _id: req.params.commentId }).populate('user');
    if (!comment) {
      res.status(400).json({ message: 'Такого коментаря немає!' });
    }
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const commentArticlePatch = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }
    const comment = await Comment.findById({ _id: req.params.commentId }).populate('user');
    const post = await PostsSchema.findById({ _id: req.params.postId });
    const user = req.userId;
    if (comment.user._id.toString() !== user) {
      return res.status(403).json({ message: 'Ви не власник коментаря!' });
    }
    if (!comment) {
      res.status(400).json({ message: 'Такого коментаря немає!' });
    }
    if (!post) {
      res.status(400).json({ message: 'Такої статьі немає!' });
    }
    await CommentSchema.updateOne({ _id: req.params.commentId }, { text: req.body.text });
    await comment.save();
    res.json({ message: 'Коментарь обновлен!', doc: comment });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
    console.log(err);
  }
};
export const commentArticleDelete = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const comment = await CommentSchema.findById(commentId);
    const post = await PostsSchema.findById(postId);
    const user = req.userId;
    if (comment.user.toString() !== user) {
      return res.status(403).json({ message: 'Ви не власник коментаря!' });
    }
    if (!comment) {
      return res.status(400).json({ message: 'Такого комментария нет!' });
    }
    if (!post) {
      return res.status(400).json({ message: 'Такой статьи нет!' });
    }

    post.comments = post.comments.filter((c) => c.comment.toString() !== commentId);

    await CommentSchema.deleteOne({ _id: commentId });

    await post.save();
    res.json({ message: 'Коментарь видален!' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
    console.log(err);
  }
};
export const toggleLikeDislikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body; // action = 'like' или 'dislike'

    const comment = await CommentSchema.findById(commentId);
    const userReq = await UserSchema.findById(req.userId);
    if (!comment) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    // Проверяем, ставил ли пользователь лайк или дизлайк
    const likeIndex = comment.likes.findIndex((like) => like.user.toString() === req.userId);
    const dislikeIndex = comment.dislikes.findIndex(
      (dislike) => dislike.user.toString() === req.userId,
    );

    if (action === 'like') {
      if (likeIndex !== -1) {
        // Если лайк уже есть — удаляем его
        comment.likes.splice(likeIndex, 1);
        await comment.save();
        return res.json({ message: 'Лайк удалён', comment });
      }

      // Удаляем дизлайк, если он был
      if (dislikeIndex !== -1) {
        comment.dislikes.splice(dislikeIndex, 1);
      }

      // Добавляем лайк
      comment.likes.push({ user: req.userId });

      await comment.save();

      if (comment.user._id !== userReq._id) {
        const docNotification = new NotificationSchema({
          user: comment.user,
          notification: `Добавився лайк на ${comment.text} цьому коммент`,
          TextNotification: `Від користувача ${userReq.fullName} `,

          userReq: userReq._id,
          views: false,
        });
        docNotification.save().catch((err) => console.error('Ошибка сохранения уведомления:', err));
      }

      return res.json({ message: 'Лайк добавлен', comment });
    }

    if (action === 'dislike') {
      if (dislikeIndex !== -1) {
        // Если дизлайк уже есть — удаляем его
        comment.dislikes.splice(dislikeIndex, 1);
        await comment.save();
        return res.json({ message: 'Дизлайк удалён', comment });
      }

      // Удаляем лайк, если он был
      if (likeIndex !== -1) {
        comment.likes.splice(likeIndex, 1);
      }

      // Добавляем дизлайк
      comment.dislikes.push({ user: req.userId });
      await comment.save();
      return res.json({ message: 'Дизлайк добавлен', comment });
    }

    res.status(400).json({ message: 'Некорректное действие' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};
export const securedComment = async (req, res) => {
  const userId = req.userId;
  const commentId = req.params.id;

  if (!commentId) {
    return res.status(400).json({ message: 'Невірний айді у поста!' });
  }

  const comment = await Comment.findById(commentId).populate('article');

  if (!userId) {
    return res.status(400).json({ message: 'У вас немає акаунту!' });
  }
  console.log(comment);
  if (comment.article.user.toString() !== userId) {
    return res.status(400).json({ message: 'У вас немає прав ' });
  }

  // Перевірка, чи пост вже скритий, та переключення состояния
  const isSecured = comment.secured;
  comment.secured = !isSecured;

  await comment.save();

  res.json({
    message: isSecured ? 'Пост більше не скритий!' : 'Ви зробили пост скритим!',
  });
};
