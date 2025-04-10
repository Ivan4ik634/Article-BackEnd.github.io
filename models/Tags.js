import mongoose from 'mongoose';
const TagsSchema = new mongoose.Schema({
  tag: { type: String, required: true },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
});
export default mongoose.model('Tags', TagsSchema);
