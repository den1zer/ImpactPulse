const mongoose = require('mongoose');

const EarnedBadgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true }, 
  level: { type: Number, required: true },   
  name: { type: String, required: true },    
  icon: { type: String, required: true },    
  date: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  passwordResetCode: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },

  avatar: {
    type: String,
    default: '', 
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    min: 13,
  },
  backupEmail: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unspecified'],
    default: 'unspecified',
  },
  stats: {
    totalDonations: { type: Number, default: 0 },
    totalVolunteering: { type: Number, default: 0 },
    totalAid: { type: Number, default: 0 },
    profileComplete: { type: Boolean, default: false }, 
    totalGeo: { type: Number, default: 0 },           
    highRoller: { type: Boolean, default: false },     
    totalRejections: { type: Number, default: 0 }
  },
  
  badges: [EarnedBadgeSchema],

  selectedBadge: {
    badgeId: { type: String, default: null },
    level: { type: Number, default: null },
    name: { type: String, default: null },
    icon: { type: String, default: null }
  },

  profileCustomization: {
    nicknameIcon: { type: String, default: '' },
    avatarFrame: { type: String, default: 'none' },
    profileTheme: { type: String, default: 'default' }
  }

}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);