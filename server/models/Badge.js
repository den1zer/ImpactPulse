import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true,
  },
  triggerType: {
    type: String,
    enum: ['POINTS', 'DONATION_COUNT', 'VOLUNTEER_COUNT', 'AID_COUNT'],
    required: true,
  },
  levels: [
    {
      level: { type: Number, required: true }, 
      name: { type: String, required: true }, 
      value: { type: Number, required: true }, 
      icon_color: { type: String, required: true }, 
      icon_locked: { type: String, required: true }, 
    }
  ]
});

const Badge = mongoose.model('Badge', BadgeSchema);
export default Badge;