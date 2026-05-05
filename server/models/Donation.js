const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  collectionId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Fundraiser',
    required: true,
  },
  amount: {
    type:     Number,
    required: true,
  },
  currency: {
    type:    String,
    default: 'UAH',
  },
  orderId: {
    type:     String,
    required: true,
    unique:   true,
  },
  status: {
    type:     String,
    required: true,
  },
  payerEmail: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);
