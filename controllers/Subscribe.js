import UserSchema from '../models/User.js';
import PostsSchema from '../models/PostsCreate.js';
import { validationResult } from 'express-validator';
export const toggleSubscribe = async (req, res) => {
  try {
    const { userId } = req.params;
    const userSubscribe = await UserSchema.findById(userId);
    if (!userSubscribe) {
      return res.status(404).json({ message: 'Юзер не найден!' });
    }

    const existingLikeIndex = userSubscribe.subscribes.findIndex(
      (subscribe) => subscribe.user.toString() === req.userId,
    );

    if (existingLikeIndex !== -1) {
      userSubscribe.subscribes.splice(existingLikeIndex, 1);
      await userSubscribe.save();
      return res.json({ message: 'Подписка убрана!', userSubscribe });
    }

    userSubscribe.subscribes.push({ user: req.userId });
    await userSubscribe.save();

    res.json({ message: 'Подписка добавлена!', userSubscribe });
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
    const posts = await PostsSchema.find();

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
      userSubscribeMe.includes(post.user.toString()),
    );

    res.json(filteredPostsSubscribe);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера!' });
    console.log(err);
  }
};
