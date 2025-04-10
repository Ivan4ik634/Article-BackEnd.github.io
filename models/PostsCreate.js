import mongoose from 'mongoose';
const surveySchema = new mongoose.Schema({
  surveyCategory: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const PostsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imgURL: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  surveyOptions: {
    type: [String], // теперь это список строк
    default: undefined,
  },

  // Ответы пользователей на опрос
  survey: [
    {
      surveyOption: { type: String, required: true }, // теперь строка
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
  ],
  tags: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
  ],
  dislikes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
  ],
  views: { type: Number, default: 0, required: true },
  hidden: { type: Boolean, default: false, require: true },
  comments: [
    {
      comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    },
  ],
  report: [
    {
      reportCategory: String,
      reportCounter: Number,
    },
  ],
  statistics: [
    {
      date: { type: Date, required: true },
      likes: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
    },
  ],
});
export default mongoose.model('Post', PostsSchema);
