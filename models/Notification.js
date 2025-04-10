import mongoose from 'mongoose';
const UserNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notification: {
    type: String,
    required: true,
  },
  TextNotification: {
    type: String,
    required: true,
  },
  article: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userReq: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  views: {
    type: Boolean,
    required: true,
  },
});
export default mongoose.model('Notification', UserNotificationSchema);
