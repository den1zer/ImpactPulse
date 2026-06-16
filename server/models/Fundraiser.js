import mongoose from 'mongoose';

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
    enum: ['open', 'closed', 'reported'],
    default: 'open',
  },
  report: {
    description: { type: String, default: null },
    images: [{ type: String }],
    reportedAt: { type: Date, default: null },
  },
  cardName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  coverImage: { type: String, default: null },

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

const Fundraiser = mongoose.model('Fundraiser', FundraiserSchema);
export default Fundraiser;