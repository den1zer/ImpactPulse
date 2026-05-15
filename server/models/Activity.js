import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String, // e.g., 'task_completed', 'task_created', etc.
    default: 'general',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
