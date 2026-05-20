import mongoose from 'mongoose';

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
  },
  promoCode: {
    type: String, // Optional specific promo code
  }
}, { timestamps: true });

const RewardItem = mongoose.model('RewardItem', RewardItemSchema);
export default RewardItem;

