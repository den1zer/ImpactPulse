import Task from '../models/Task.js';
import User from '../models/User.js';
import Guild from '../models/Guild.js';
import Activity from '../models/Activity.js';
import { checkAndAwardBadges } from './contributionController.js';
import { updateUserLevel } from '../utils/levelSystem.js';

// ── helpers ─────────────────────────────────────────────────────────────────
const POPULATE_CREATED_BY = { path: 'createdBy', select: 'username avatar avatarUrl xp level' };
const POPULATE_PARTICIPANTS = {
  path: 'participants.user',
  select: 'username avatar avatarUrl xp level',
};
const POPULATE_COMMENTS = {
  path: 'comments.author',
  select: 'username avatar avatarUrl',
};
const POPULATE_GUILD = { path: 'targetGuild', select: 'name logo' };

// ── CREATE TASK (any authenticated user) ──────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    const {
      title, description, category, points, endDate,
      guildOnly, targetGuild, maxParticipants, coverEmoji,
    } = req.body;

    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ msg: 'Бали мають бути додатнім числом' });
    }

    const task = new Task({
      title: title?.trim(),
      description: description?.trim(),
      category,
      points: pointsNum,
      endDate: endDate || null,
      filePath: req.file ? req.file.path : null,
      createdBy: req.user.id,
      coverEmoji: coverEmoji || '📋',
      guildOnly: guildOnly === true || guildOnly === 'true',
      targetGuild: targetGuild || null,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      status: 'open',
    });

    await task.save();
    await task.populate([POPULATE_CREATED_BY, POPULATE_GUILD]);

    if (req.io) {
      const user = await User.findById(req.user.id);
      if (user) {
        const message = `${user.username} створив нове завдання '${task.title}' 🆕`;
        await Activity.create({ message, type: 'task_created' });
        req.io.emit('activity_feed', { message });
      }
    }

    res.status(201).json(task);
  } catch (err) {
    console.error('createTask:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── GET ALL OPEN TASKS ────────────────────────────────────────────────────────
export const getOpenTasks = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_GUILD)
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('getOpenTasks:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── GET TASK BY ID ────────────────────────────────────────────────────────────
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_PARTICIPANTS)
      .populate(POPULATE_COMMENTS)
      .populate(POPULATE_GUILD);

    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });
    res.json(task);
  } catch (err) {
    console.error('getTaskById:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── JOIN TASK ─────────────────────────────────────────────────────────────────
export const joinTask = async (req, res) => {
  try {
    const { joinMode, guildId } = req.body;   // joinMode: 'solo' | 'guild'
    const userId  = req.user.id;
    const task    = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    if (task.status === 'closed') {
      return res.status(400).json({ msg: 'Це завдання вже закрите' });
    }

    // Already a participant?
    const already = task.participants.find(p => p.user.toString() === userId);
    if (already) return res.status(400).json({ msg: 'Ви вже берете участь у цьому завданні' });

    // Max participants check
    if (task.maxParticipants && task.participants.length >= task.maxParticipants) {
      return res.status(400).json({ msg: 'Досягнуто максимальну кількість учасників' });
    }

    // Guild-mode validation
    let resolvedGuild = null;
    if (joinMode === 'guild') {
      if (!guildId) return res.status(400).json({ msg: 'Вкажіть guildId для командного вступу' });
      const guild = await Guild.findById(guildId);
      if (!guild) return res.status(404).json({ msg: 'Гільдію не знайдено' });
      if (!guild.members.some(m => m.toString() === userId)) {
        return res.status(403).json({ msg: 'Ви не є членом цієї гільдії' });
      }
      resolvedGuild = guildId;
    }

    // Guild-only check
    if (task.guildOnly && joinMode !== 'guild') {
      return res.status(403).json({ msg: 'Це завдання доступне лише для команд' });
    }

    task.participants.push({
      user: userId,
      joinMode: joinMode || 'solo',
      guild: resolvedGuild,
      status: 'working',
    });

    if (task.status === 'open') task.status = 'in_progress';
    await task.save();

    await task.populate([POPULATE_CREATED_BY, POPULATE_PARTICIPANTS, POPULATE_COMMENTS, POPULATE_GUILD]);
    res.json(task);
  } catch (err) {
    console.error('joinTask:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── LEAVE TASK ────────────────────────────────────────────────────────────────
export const leaveTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const task   = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    const idx = task.participants.findIndex(p => p.user.toString() === userId);
    if (idx === -1) return res.status(400).json({ msg: 'Ви не є учасником цього завдання' });

    const participant = task.participants[idx];
    if (participant.status === 'approved') {
      return res.status(400).json({ msg: 'Не можна покинути вже підтверджене завдання' });
    }

    task.participants.splice(idx, 1);

    if (task.participants.length === 0) task.status = 'open';
    await task.save();

    res.json({ msg: 'Ви покинули завдання' });
  } catch (err) {
    console.error('leaveTask:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── SUBMIT PROOF (participant marks as ready for review) ──────────────────────
export const submitProof = async (req, res) => {
  try {
    const userId = req.user.id;
    const { proofText } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    const participant = task.participants.find(p => p.user.toString() === userId);
    if (!participant) return res.status(403).json({ msg: 'Ви не є учасником' });
    if (participant.status === 'approved') {
      return res.status(400).json({ msg: 'Ваше виконання вже підтверджено' });
    }

    participant.proofText   = proofText || '';
    participant.proofFile   = req.file ? req.file.path : participant.proofFile;
    participant.submittedAt = new Date();
    participant.status      = 'review';

    await task.save();
    await task.populate([POPULATE_CREATED_BY, POPULATE_PARTICIPANTS, POPULATE_COMMENTS]);
    res.json(task);
  } catch (err) {
    console.error('submitProof:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── APPROVE / REJECT participant (only task creator can do this) ───────────────
export const reviewParticipant = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { participantUserId, action, reviewComment } = req.body;
    // action: 'approve' | 'reject'

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    if (task.createdBy.toString() !== creatorId) {
      return res.status(403).json({ msg: 'Тільки автор завдання може підтверджувати виконання' });
    }

    const participant = task.participants.find(p => p.user.toString() === participantUserId);
    if (!participant) return res.status(404).json({ msg: 'Учасника не знайдено' });
    if (participant.status !== 'review') {
      return res.status(400).json({ msg: 'Учасник ще не подав звіт або вже оброблений' });
    }

    participant.reviewComment = reviewComment || '';
    participant.reviewedAt    = new Date();

    if (action === 'approve') {
      participant.status = 'approved';

      // Award points & XP to the participant
      const user = await User.findById(participantUserId);
      if (user) {
        user.points = (user.points || 0) + task.points;
        user.xp     = (user.xp || 0) + task.points;
        updateUserLevel(user);
        await checkAndAwardBadges(user);
        await user.save();

        // Propagate XP to guild if joined in guild mode
        if (participant.joinMode === 'guild' && participant.guild) {
          await Guild.findByIdAndUpdate(participant.guild, {
            $inc: { totalXP: task.points },
          });
          // recompute level
          const guild = await Guild.findById(participant.guild);
          if (guild) { guild.recomputeLevel(); await guild.save(); }
        }

        if (req.io) {
          const message = `${user.username} щойно виконав завдання '${task.title}' +${task.points} XP`;
          await Activity.create({ message, type: 'task_completed' });
          req.io.emit('activity_feed', { message });
        }
      }
    } else {
      participant.status = 'rejected';
    }

    await task.save();
    await task.populate([POPULATE_CREATED_BY, POPULATE_PARTICIPANTS, POPULATE_COMMENTS]);
    res.json(task);
  } catch (err) {
    console.error('reviewParticipant:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── ADD COMMENT ───────────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Коментар не може бути порожнім' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    task.comments.push({ author: req.user.id, text: text.trim() });
    await task.save();
    await task.populate(POPULATE_COMMENTS);
    res.json(task.comments[task.comments.length - 1]);
  } catch (err) {
    console.error('addComment:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── DELETE COMMENT ────────────────────────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    const comment = task.comments.id(commentId);
    if (!comment) return res.status(404).json({ msg: 'Коментар не знайдено' });

    const isOwner   = comment.author.toString() === userId;
    const isCreator = task.createdBy.toString() === userId;
    if (!isOwner && !isCreator) {
      return res.status(403).json({ msg: 'Немає дозволу видалити цей коментар' });
    }

    task.comments.pull(commentId);
    await task.save();
    res.json({ msg: 'Коментар видалено', commentId });
  } catch (err) {
    console.error('deleteComment:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── LIKE COMMENT ──────────────────────────────────────────────────────────────
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    const comment = task.comments.id(commentId);
    if (!comment) return res.status(404).json({ msg: 'Коментар не знайдено' });

    const likedIdx = comment.likes.findIndex(l => l.toString() === userId);
    if (likedIdx > -1) {
      comment.likes.splice(likedIdx, 1); // unlike
    } else {
      comment.likes.push(userId);        // like
    }

    await task.save();
    res.json({ likes: comment.likes.length, liked: likedIdx === -1 });
  } catch (err) {
    console.error('likeComment:', err.message);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── GET MY TASKS ──────────────────────────────────────────────────────────────
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ 'participants.user': userId })
      .populate(POPULATE_CREATED_BY)
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── CLOSE TASK (creator only) ─────────────────────────────────────────────────
export const closeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Тільки автор може закрити завдання' });
    }
    task.status = 'closed';
    await task.save();

    if (req.io) {
      const user = await User.findById(req.user.id);
      if (user) {
        const message = `${user.username} щойно закрив завдання '${task.title}' 🔒`;
        await Activity.create({ message, type: 'task_closed' });
        req.io.emit('activity_feed', { message });
      }
    }

    res.json({ msg: 'Завдання закрито' });
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── ADMIN: GET ALL ────────────────────────────────────────────────────────────
export const getAllTasksAdmin = async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_PARTICIPANTS)
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── ADMIN: UPDATE ─────────────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const { title, description, category, points, status, endDate } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    if (title)       task.title       = title;
    if (description) task.description = description;
    if (category)    task.category    = category;
    if (points)      task.points      = parseInt(points);
    if (status)      task.status      = status;
    if (endDate)     task.endDate     = endDate;

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── ADMIN: DELETE ─────────────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Завдання видалено' });
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

// ── Legacy: claimTask / abandonTask (kept for compat) ────────────────────────
export const claimTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });
    if (task.status === 'closed') return res.status(400).json({ msg: 'Завдання закрите' });

    const already = task.participants.find(p => p.user.toString() === req.user.id);
    if (already) return res.status(400).json({ msg: 'Ви вже берете участь' });

    task.participants.push({ user: req.user.id, joinMode: 'solo', status: 'working' });
    task.assignedTo = req.user.id;
    if (task.status === 'open') task.status = 'in_progress';
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

export const abandonTask = async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Завдання не знайдено' });

    const idx = task.participants.findIndex(p => p.user.toString() === req.user.id);
    if (idx > -1) task.participants.splice(idx, 1);

    task.assignedTo    = null;
    task.abandonReason = reason || '';
    if (task.participants.length === 0) task.status = 'open';
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};

