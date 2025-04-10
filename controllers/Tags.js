import TagsSchema from '../models/Tags.js';
export const TagsGetAll = async (req, res) => {
  try {
    const Tags = await TagsSchema.find();
    const filteredTags = Tags.filter((obj) => {
      return obj.user.toString() === req.userId;
    });

    res.json(filteredTags);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const TagsPost = async (req, res) => {
  try {
    const Tags = new TagsSchema({
      tag: req.body.tag,
      user: req.userId,
    });
    await Tags.save();
    res.json(Tags);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
    console.log(error);
  }
};
export const TagsDelete = async (req, res) => {
  try {
    const Tags = await TagsSchema.findById(req.params.tagsId);
    if (!Tags) {
      res.status(403).json({ message: 'Немає такого тєга' });
    }
    if (Tags.user.toString() !== req.userId) {
      res.status(403).json({ message: 'Ви не можете видалити цей тег, у вас немає прав' });
    }
    await Tags.deleteOne({ _id: req.params.tagId });
    res.json(Tags);
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
export const TagsDeleteAllUser = async (req, res) => {
  try {
    // Находим все теги по ID пользователя
    const tags = await TagsSchema.find({ user: req.userId });

    if (!tags.length) {
      return res.status(404).json({ message: 'Теги не знайдено' });
    }

    // Удаляем все теги пользователя
    await TagsSchema.deleteMany({ user: req.userId });

    res.json({ message: 'Усі теги користувача видалено' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера!' });
  }
};
