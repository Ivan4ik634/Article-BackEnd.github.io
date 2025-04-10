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
  biograffy: {
    type: String,
    require: false,
  },
  avatar: {
    type: String,
    require: false,
  },
  badge: {
    type: String,
    require: false,
  },
  online: {
    type: Boolean,
    default: false,
  },

  passwordHash: {
    type: String,
    required: true,
  },
  subscribes: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    },
  ],
  blockedUsers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    },
  ],
});
export default mongoose.model('User', UserSchema);
