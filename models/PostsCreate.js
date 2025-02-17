import mongoose from 'mongoose';
const PostsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
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
  tags: {
    type: String,
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
  comments: [
    {
      comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    },
  ],
});
export default mongoose.model('Posts', PostsSchema);
