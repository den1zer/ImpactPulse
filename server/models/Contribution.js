import mongoose from 'mongoose';

const ContributionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['donation', 'volunteering', 'aid', 'other'],
  },
  filePath: {
    type: String,
  },
  amount: {
    type: Number, 
  },
  itemList: {
    type: String, 
  },
  comment: {
    type: String, 
  },
  location: {
    lat: Number,
    lng: Number,
  },
  task: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  rejectionComment: {
    type: String,
    default: '',
  }
}, { timestamps: true });

const Contribution = mongoose.model('Contribution', ContributionSchema);
export default Contribution;