import mongoose from 'mongoose';
const ChatSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

export const Chat = mongoose.model('Chat', ChatSchema);
