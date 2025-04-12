import mongoose from 'mongoose';
const chatSchema = new mongoose.Schema({
  participants: [String], // ID отправителя и получателя
  name: String,
  messages: [
    {
      senderId: String,
      receiverId: String,
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export const Chat = mongoose.model('Chat', chatSchema);
