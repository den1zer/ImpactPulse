import mongoose from 'mongoose';

// XP thresholds for each guild level (10 levels)
export const GUILD_LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000, 10000, 16000, 24000, 35000, 50000];

const GuildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    logo: {
      type: String,          // emoji or URL
      default: '⚔️',
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalXP: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Recompute guild level from totalXP
GuildSchema.methods.recomputeLevel = function () {
  let lvl = 1;
  for (let i = GUILD_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (this.totalXP >= GUILD_LEVEL_THRESHOLDS[i]) {
      lvl = i + 1;
      break;
    }
  }
  this.level = lvl;
};

// Static helper: add XP to the guild that contains a given user
GuildSchema.statics.addXPForUser = async function (userId, xpAmount) {
  const guild = await this.findOne({ members: userId });
  if (!guild) return null;

  guild.totalXP += xpAmount;
  guild.recomputeLevel();
  await guild.save();
  return guild;
};

// Virtual: XP needed for next level
GuildSchema.virtual('xpForNextLevel').get(function () {
  const idx = this.level; // level is 1-based; threshold array is 0-based
  return GUILD_LEVEL_THRESHOLDS[idx] ?? null;
});

// Virtual: XP at start of current level
GuildSchema.virtual('xpCurrentLevelStart').get(function () {
  return GUILD_LEVEL_THRESHOLDS[this.level - 1] ?? 0;
});

GuildSchema.set('toJSON', { virtuals: true });
GuildSchema.set('toObject', { virtuals: true });

const Guild = mongoose.model('Guild', GuildSchema);
export default Guild;

