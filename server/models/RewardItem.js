const mongoose = require('mongoose');

const RewardItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['badge', 'frame', 'partner_coupon'],
    required: true,
  },
  stock: {
    type: Number,
    default: -1, // -1 means infinite stock
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  imageUrl: {
    type: String, // Optional image for the item
  }
}, { timestamps: true });

module.exports = mongoose.model('RewardItem', RewardItemSchema);
