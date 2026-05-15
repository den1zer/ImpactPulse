import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String, required: true },
  question: { type: String, required: true },
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', TicketSchema);
export default Ticket;