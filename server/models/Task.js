import mongoose from 'mongoose';

// ── Comment sub-schema ─────────────────────────────────────────
const CommentSchema = new mongoose.Schema({
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:    { type: String, required: true, maxlength: 1000 },
  likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ── Participant sub-schema ─────────────────────────────────────
// Each participant tracks their own proof submission & approval
const ParticipantSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt:   { type: Date, default: Date.now },
  // 'solo' = joined individually, 'guild' = joined as part of guild
  joinMode:   { type: String, enum: ['solo', 'guild'], default: 'solo' },
  guild:      { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null },
  // Submission
  proofText:  { type: String, default: '' },
  proofFile:  { type: String, default: null },
  submittedAt:{ type: Date, default: null },
  // Approval by creator
  status:     {
    type: String,
    enum: ['working', 'review', 'approved', 'rejected'],
    default: 'working',
  },
  reviewComment: { type: String, default: '' },
  reviewedAt:    { type: Date, default: null },
});

// ── Main Task schema ───────────────────────────────────────────
const TaskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['volunteering', 'aid', 'donation', 'education', 'ecology', 'military', 'other'],
  },
  points:    { type: Number, required: true, default: 100 },
  startDate: { type: Date, default: Date.now },
  endDate:   { type: Date },
  filePath:  { type: String },     // attachment/instruction
  coverEmoji:{ type: String, default: '📋' },
  coverImage:{ type: String, default: null },  // Cloudinary URL

  // Who created it (any authenticated user)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Whether this task is open only to a specific guild
  guildOnly:    { type: Boolean, default: false },
  targetGuild:  { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', default: null },

  // Max participants (null = unlimited)
  maxParticipants: { type: Number, default: null },

  // Overall task status (derived from participants but tracked for easy querying)
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open',
  },

  participants: [ParticipantSchema],
  comments:     [CommentSchema],

  // Location fields
  lat:      { type: Number },
  lng:      { type: Number },
  address:  { type: String },

}, { timestamps: true });

// Virtual: participant count
TaskSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

TaskSchema.set('toJSON',   { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', TaskSchema);
export default Task;