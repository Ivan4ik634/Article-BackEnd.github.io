import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import UserSchema from '../models/User.js';
import User from '../models/User.js';
import Post from '../models/PostsCreate.js';
import Notification from '../models/Notification.js';
import SearchHistory from '../models/SearchHistory.js';

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const password = req.body.password;
    const sait = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, sait);

    const doc = new UserSchema({
      email: req.body.email,
      passwordHash,
      fullName: req.body.fullName,
    });

    const user = await doc.save();
    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret',
      {
        expiresIn: '30d',
      },
    );
    res.json({
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: `Не вдалось зареєструватись ${error}`,
    });
    console.log(error);
  }
};
export const login = async (req, res) => {
  try {
    const user = await UserSchema.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден' });
    }
    const IsPassValid = await bcrypt.compare(req.body.password, user._doc.passwordHash);
    if (!IsPassValid) {
      return res.status(404).json({ message: 'Пароль або логін не вспівпадають' });
    }
    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret',
      {
        expiresIn: '30d',
      },
    );
    res.json({ token });
  } catch (error) {
    res.status(400).json({
      message: 'Не вдалося увійти',
    });
  }
};
export const GetMe = async (req, res) => {
  const user = await User.findById(req.userId).populate('subscribes.user');
  console.log(user);
  if (!user) {
    res.status(403).json({ message: 'У вас немає акаунту!' });
  }
  res.json(user);
};

export const saveBiograffy = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(403).json({ message: 'У вас немає акаунту!' });
    }

    await UserSchema.updateOne(
      { _id: user._id },
      {
        biograffy: req.body.biograffy,
      },
    );

    await user.save();
    res.json({ message: 'Ви поміняли профіль' });
  } catch (error) {
    console.log(error);
  }
};
export const saveAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(403).json({ message: 'У вас немає акаунту!' });
    }

    await UserSchema.updateOne(
      { _id: user._id },
      {
        avatar: req.body.avatar,
      },
    );

    await user.save();
    res.json({ message: 'Ви поміняли профіль' });
  } catch (error) {
    return res.status(500).json({ message: `Помилка сервера ${error}` });
  }
};
export const saveBadge = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(403).json({ message: 'У вас немає акаунту!' });
    }

    await UserSchema.updateOne(
      { _id: user._id },
      {
        badge: req.body.badge,
      },
    );

    await user.save();
    res.json({ message: 'Ви поміняли профіль' });
  } catch (error) {
    return res.status(500).json({ message: `Помилка сервера ${error}` });
  }
};

export const GetUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('subscribes.user');
    if (!user) {
      res.status(403).json({ message: 'У цього юзера немає акаунту' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Не правильний айді акаунту' });
  }
};
export const SearchUsersAndPosts = async (req, res) => {
  try {
    const users = await User.find().populate('subscribes.user');
    const posts = await Post.find().populate('user');
    res.json({ users, posts });
  } catch (error) {
    res.status(500).json({ message: `Сталася помилка ${error}` });
  }
};
export const UserNotification = async (req, res) => {
  try {
    const user = req.userId;
    const notificationsUser = await Notification.find({ user })
      .sort({ createdAt: -1 })
      .populate('user')
      .populate('userReq');
    const FilteredNotificationsMe = notificationsUser.filter(
      (obj) => obj.userReq._id.toString() !== user,
    );
    res.json(FilteredNotificationsMe);
  } catch (error) {
    res.status(500).json(notificationsUser);
  }
};

export const UserHistoryAll = async (req, res) => {
  try {
    const userHistorys = await SearchHistory.find({ user: req.userId });
    if (!userHistorys) {
      return res.json({ message: 'Немає історії пошуку!' });
    }
    res.json(userHistorys);
  } catch (error) {
    res.json({ error });
  }
};
export const UserHistoryDelete = async (req, res) => {
  try {
    const user = await UserSchema.findById({ _id: req.userId });
    if (!user) {
      return res.json({ message: 'Немає акаунту!' });
    }
    const userHistory = await SearchHistory.findById({ _id: req.params.id });
    if (!userHistory) {
      return res.json({ message: 'Немає історії пошуку!' });
    }
    await SearchHistory.deleteOne({ _id: req.params.id });

    res.json(userHistorys);
  } catch (error) {
    res.json({ error });
  }
};
export const UserHistoryDeleteAll = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userId);
    if (!user) {
      return res.json({ message: 'Немає акаунту!' });
    }
    await SearchHistory.deleteMany({ user: req.userId });

    res.json({ message: 'Тепер немає історії!' });
  } catch (error) {
    res.json({ error });
  }
};
export const UserHistoryCreate = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userId);
    if (!user) {
      return res.json({ message: 'Немає акаунту' });
    }
    const userHistoryCreate = new SearchHistory({
      user: user._id,
      HistorySearch: req.body.history,
    });
    await userHistoryCreate.save();
    res.json(userHistoryCreate);
  } catch (error) {
    res.json({ error });
  }
};
