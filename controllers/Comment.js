import PostsSchema from '../models/PostsCreate.js';
import CommentSchema from '../models/Comment.js';
import { validationResult } from 'express-validator';
export const commentArticle = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const postId = req.params.postId;
    const post = await PostsSchema.findById(postId).populate('comments.comment');
    const user = req.userId;
    const doc = new CommentSchema({
      user,
      article: postId,
      text: req.body.text,
    });
    await doc.save();
    post.comments.push({ comment: doc._id });
    await post.save();
    res.json({ message: 'Ви добавили коментарій!', doc });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
    console.log(err);
  }
};
export const commentArticleGetAll = async (req, res) => {
  try {
    const post = await PostsSchema.findById({ _id: req.params.postId });
    if (!post) {
      res.status(400).json({ message: 'Такої статьі немає!' });
    }
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const commentArticleGetOne = async (req, res) => {
  try {
    const comment = await CommentSchema.findById({ _id: req.params.commentId });
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
    const comment = await CommentSchema.findById({ _id: req.params.commentId });
    const post = await PostsSchema.findById({ _id: req.params.postId });
    const user = req.userId;
    if (comment.user.toString() !== user) {
      return res.status(403).json({ message: 'Ви не власник коментаря!' });
    }
    if (!comment) {
      res.status(400).json({ message: 'Такого коментаря немає!' });
    }
    if (!post) {
      res.status(400).json({ message: 'Такої статьі немає!' });
    }
    await CommentSchema.updateOne({ _id: req.params.commentId }, { text: req.body.text });
    post.comments.push({ comment: req.params.postId });
    await post.save();
    res.json({ message: 'Коментарь обновлен!' });
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
