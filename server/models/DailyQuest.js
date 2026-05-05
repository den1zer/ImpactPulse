const mongoose = require('mongoose');

const QuestItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['login', 'donation', 'volunteer', 'comment'],
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  xpReward: {
    type: Number,
    required: true
  }
});

const DailyQuestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  quests: [QuestItemSchema],
  claimed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyQuest', DailyQuestSchema);
