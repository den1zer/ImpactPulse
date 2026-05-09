import mongoose from 'mongoose';

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

const Donation = mongoose.model('Donation', DonationSchema);
export default Donation;

