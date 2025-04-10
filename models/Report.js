import mongoose from 'mongoose';
const MessageSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  PostId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
  },
  reportCategory: {
    type: String,
    require: true,
  },
});
export const Report = mongoose.model('Report', MessageSchema);
