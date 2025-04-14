import mongoose from 'mongoose';
const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // ID отправителя и получателя

  name: String,
  messages: [
    {
      senderId: String,
      receiverId: String,
      from: String,
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export const Chat = mongoose.model('Chat', chatSchema);
