import UserSchema from '../models/User.js';
import Post from '../models/PostsCreate.js';
export const BlockUser = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userId);
    const userBlocked = req.params.userId;
    if (!userBlocked) {
      res.status(400).json({ message: 'Немає такого юзера!' });
    }
    user.blockedUsers.push({ user: userBlocked });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const BlockPost = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено!' });
    }

    const usersBlocked = user.blockedUsers;
    const posts = await Post.find();

    const blockedPosts = posts.filter((post) =>
      usersBlocked.some((blockedUser) => blockedUser.user.toString() === post.user.toString()),
    );

    res.json(blockedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
    console.error(error);
  }
};
export const UnblockUser = async (req, res) => {
  try {
    const user = await UserSchema.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено!' });
    }

    const { blockedUserId } = req.params;

    // Фильтруем, удаляя указанного пользователя из списка заблокированных
    user.blockedUsers = user.blockedUsers.filter(
      (blockedUser) => blockedUser.user.toString() !== blockedUserId,
    );

    await user.save();
    res.json({ message: 'Користувача розблоковано!' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
    console.error(error);
  }
};
