import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  roomId: String,
  senderId: String,
  receiverId: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model('Message', messageSchema);
