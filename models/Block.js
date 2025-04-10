import mongoose from 'mongoose';
const BlockUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userBlock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});
export default mongoose.model('BlockUser', BlockUserSchema);
