import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  subscribes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, require: true },
    },
  ],
});
export default mongoose.model('User', UserSchema);
