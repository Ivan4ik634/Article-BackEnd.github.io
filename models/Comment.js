import mongoose from 'mongoose';
const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  article: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  text: {
    type: String,
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
export default mongoose.model('Comment', CommentSchema);
