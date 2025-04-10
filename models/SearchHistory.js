import mongoose from 'mongoose';
const HistorySearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  HistorySearch: {
    type: String,
    required: true,
  },
});
export default mongoose.model('History', HistorySearchSchema);
