import UserSchema from '../models/User.js';
import PostsSchema from '../models/PostsCreate.js';
import Post from '../models/PostsCreate.js';
import NotificationSchema from '../models/Notification.js';
import { validationResult } from 'express-validator';
export const toggleSubscribe = async (req, res) => {
  try {
    const { userId } = req.params;
    const userSubscribe = await UserSchema.findById(userId);
    const userReq = await UserSchema.findById(req.userId);
    if (!userSubscribe) {
      return res.status(404).json({ message: 'Юзер не найден!' });
    }
    const existingLikeIndex = userSubscribe.subscribes.findIndex(
      (subscribe) => subscribe.user.toString() === req.userId,
    );

    let docNotification = null; // Объявляем переменную заранее

    if (existingLikeIndex !== -1) {
      userSubscribe.subscribes.splice(existingLikeIndex, 1);
      await userSubscribe.save();

      return res.json({
        message: 'Подписка убрана!',
      });
    }
    if (userSubscribe._id.toString() !== userReq._id.toString()) {
      docNotification = await NotificationSchema.create({
        user: userId,
        notification: `Добавивлась підписка`,
        TextNotification: `Від користувача ${userReq.fullName}`,
        userReq: userReq._id,
        views: false,
      });
    }
    await docNotification.save();
    userSubscribe.subscribes.push({ user: req.userId });

    await userSubscribe.save();
    res.json({ message: 'Подписка добавлена!' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера!', error: error.message });
  }
};
export const SubscribeMe = async (req, res) => {
  try {
    const users = await UserSchema.find();
    const userMe = await UserSchema.findById(req.userId);
    if (!userMe) {
      return res.status(404).json({ message: 'У вас немає акаунту!' });
    }
    const userSubscribeMe = users.filter((user) =>
      user.subscribes.some((subscribe) => subscribe.user.toString() === userMe._id.toString()),
    );
    res.json({ users: userSubscribeMe, length: userSubscribeMe.length });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера!' });
    console.log(err);
  }
};
export const SubscribeToMe = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userId).populate('subscribes.user');
    if (!user) {
      return res.status(404).json({ message: 'У вас немає акаунту!' });
    }
    res.json({ users: user.subscribes, length: user.subscribes.length });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера!' });
  }
};
export const PostsSubscribe = async (req, res) => {
  try {
    const users = await UserSchema.find();
    const userMe = await UserSchema.findById(req.userId);
    const posts = await Post.find().populate('user');

    if (!userMe) {
      return res.status(404).json({ message: 'У вас немає акаунту!' });
    }

    // На кого подписан userMe
    const userSubscribeMe = users
      .filter((user) =>
        user.subscribes.some((subscribe) => subscribe.user.toString() === userMe._id.toString()),
      )
      .map((user) => user._id.toString());

    // Фильтруем посты только от подписанных пользователей
    const filteredPostsSubscribe = posts.filter((post) =>
      userSubscribeMe.includes(post.user._id.toString()),
    );

    res.json(filteredPostsSubscribe);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера!' });
    console.log(err);
  }
};
