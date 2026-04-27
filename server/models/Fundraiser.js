const mongoose = require('mongoose');

const FundraiserSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  goalAmount: {
    type: Number,
    required: true,
  },
  collectedAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
  cardName: { type: String, required: true },
  cardNumber: { type: String, required: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bonuses: [{
    minimumAmount: { type: Number, required: true },
    promoCode: { type: String, required: true },
    description: { type: String, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Fundraiser', FundraiserSchema);