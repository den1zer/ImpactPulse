import mongoose from 'mongoose';

const SupportMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);
export default SupportMessage;
