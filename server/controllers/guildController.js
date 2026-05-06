const Guild = require('../models/Guild');
const User  = require('../models/User');

const MAX_MEMBERS      = 20;
const MIN_LEADER_XP   = 100;

// ─── CREATE GUILD ──────────────────────────────────────────────────────────────
exports.createGuild = async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    const userId = req.user.id;

    // Validation: leader must have ≥ 100 XP
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });
    if ((user.xp || 0) < MIN_LEADER_XP) {
      return res.status(403).json({
        msg: `Для створення гільдії потрібно мінімум ${MIN_LEADER_XP} XP. У вас: ${user.xp || 0} XP`,
      });
    }

    // Validation: user must not already be in a guild
    const existing = await Guild.findOne({ members: userId });
    if (existing) {
      return res.status(400).json({ msg: `Ви вже є членом гільдії "${existing.name}"` });
    }

    // Validation: guild name uniqueness is handled by schema, but give friendly message
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ msg: 'Назва гільдії має містити мінімум 3 символи' });
    }

    const guild = new Guild({
      name: name.trim(),
      description: (description || '').trim(),
      logo: (logo || '⚔️').trim(),
      leader: userId,
      members: [userId],
      totalXP: user.xp || 0,
    });

    guild.recomputeLevel();
    await guild.save();

    await guild.populate('leader', 'username avatar avatarUrl xp level');
    await guild.populate('members', 'username avatar avatarUrl xp level');

    res.status(201).json(guild);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Гільдія з такою назвою вже існує' });
    }
    console.error('createGuild:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};

// ─── JOIN GUILD ────────────────────────────────────────────────────────────────
exports.joinGuild = async (req, res) => {
  try {
    const userId  = req.user.id;
    const guildId = req.params.id;

    // Check user not already in any guild
    const alreadyIn = await Guild.findOne({ members: userId });
    if (alreadyIn) {
      return res.status(400).json({ msg: `Ви вже є членом гільдії "${alreadyIn.name}"` });
    }

    const guild = await Guild.findById(guildId);
    if (!guild) return res.status(404).json({ msg: 'Гільдію не знайдено' });

    if (guild.members.length >= MAX_MEMBERS) {
      return res.status(400).json({ msg: `Гільдія заповнена (максимум ${MAX_MEMBERS} учасників)` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });

    guild.members.push(userId);
    guild.totalXP += user.xp || 0;
    guild.recomputeLevel();
    await guild.save();

    await guild.populate('leader', 'username avatar avatarUrl xp level');
    await guild.populate('members', 'username avatar avatarUrl xp level');

    res.json(guild);
  } catch (err) {
    console.error('joinGuild:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};

// ─── LEAVE GUILD ───────────────────────────────────────────────────────────────
exports.leaveGuild = async (req, res) => {
  try {
    const userId  = req.user.id;
    const guildId = req.params.id;

    const guild = await Guild.findById(guildId);
    if (!guild) return res.status(404).json({ msg: 'Гільдію не знайдено' });

    if (!guild.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({ msg: 'Ви не є членом цієї гільдії' });
    }

    if (guild.leader.toString() === userId) {
      // Leader leaving → disband if no other members, else transfer to first member
      if (guild.members.length === 1) {
        await Guild.findByIdAndDelete(guildId);
        return res.json({ msg: 'Гільдію розпущено — ви були єдиним учасником' });
      }
      // Transfer leadership
      const newLeader = guild.members.find((m) => m.toString() !== userId);
      guild.leader = newLeader;
    }

    const user = await User.findById(userId);
    guild.members = guild.members.filter((m) => m.toString() !== userId);
    guild.totalXP = Math.max(0, guild.totalXP - (user?.xp || 0));
    guild.recomputeLevel();
    await guild.save();

    res.json({ msg: 'Ви покинули гільдію' });
  } catch (err) {
    console.error('leaveGuild:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};

// ─── GET ALL GUILDS ────────────────────────────────────────────────────────────
exports.getAllGuilds = async (req, res) => {
  try {
    const guilds = await Guild.find()
      .populate('leader', 'username avatar avatarUrl xp level')
      .sort({ totalXP: -1 });
    res.json(guilds);
  } catch (err) {
    console.error('getAllGuilds:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};

// ─── GET GUILD BY ID ───────────────────────────────────────────────────────────
exports.getGuildById = async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id)
      .populate('leader', 'username avatar avatarUrl xp level')
      .populate('members', 'username avatar avatarUrl xp level');
    if (!guild) return res.status(404).json({ msg: 'Гільдію не знайдено' });
    res.json(guild);
  } catch (err) {
    console.error('getGuildById:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};

// ─── GET MY GUILD ──────────────────────────────────────────────────────────────
exports.getMyGuild = async (req, res) => {
  try {
    const guild = await Guild.findOne({ members: req.user.id })
      .populate('leader', 'username avatar avatarUrl xp level')
      .populate('members', 'username avatar avatarUrl xp level');
    if (!guild) return res.json(null);
    res.json(guild);
  } catch (err) {
    console.error('getMyGuild:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
exports.getGuildLeaderboard = async (req, res) => {
  try {
    const guilds = await Guild.find()
      .populate('leader', 'username avatar avatarUrl')
      .select('name logo description level totalXP members leader')
      .sort({ totalXP: -1 })
      .limit(50);

    const ranked = guilds.map((g, i) => ({
      rank       : i + 1,
      _id        : g._id,
      name       : g.name,
      logo       : g.logo,
      description: g.description,
      level      : g.level,
      totalXP    : g.totalXP,
      memberCount: g.members.length,
      leader     : g.leader,
    }));

    res.json(ranked);
  } catch (err) {
    console.error('getGuildLeaderboard:', err.message);
    res.status(500).json({ msg: 'Помилка на сервері' });
  }
};
