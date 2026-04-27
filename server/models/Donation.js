import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fundraiser', // ref to collection model
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'UAH'
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true
  },
  payerEmail: {
    type: String
  }
}, { timestamps: true }); // includes createdAt

export default mongoose.model('Donation', DonationSchema);
