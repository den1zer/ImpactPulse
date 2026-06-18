import Contribution from '../models/Contribution.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Guild from '../models/Guild.js';
import Activity from '../models/Activity.js';
import { handleStreak, updateDailyQuestProgress } from '../utils/gameLogic.js';
import { BADGE_DICTIONARY } from '../constants/badges.js';

/**
 * Creates a new contribution (donation, volunteering, or aid report).
 * If linked to a task, updates the task status to completed.
 *
 * @param {import('express').Request} req - The Express request object containing contribution data and a file.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response indicating successful submission.
 */
export const addContribution = async (req, res) => {
  const { title, description, type, amount, itemList, comment, location, taskId } = req.body;
  const userId = req.user.id; 

  if (!req.file) {
    return res.status(400).json({ msg: 'Файл підтвердження є обов\'язковим' });
  }
  const filePath = req.file.path;

  try {
    const newContribution = new Contribution({
      user: userId, title, description, type, filePath,
      amount: type === 'donation' ? amount : null, 
      itemList: type === 'aid' ? itemList : null, 
      comment: comment,
      location: (type === 'aid' || type === 'volunteering') ? (location ? JSON.parse(location) : null) : null,
      task: taskId || null, 
      status: 'pending',
    });
    
    await newContribution.save();
    
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        submission: newContribution._id, 
        status: 'completed' 
      });
    }
    
    res.status(201).json({ msg: 'Ваш внесок/звіт успішно додано та відправлено на перевірку!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Checks the user's statistics against the badge dictionary and awards new badges.
 *
 * @param {Object} user - The user Mongoose document.
 * @returns {Promise<void>} Modifies the user object in place.
 */
export const checkAndAwardBadges = async (user) => {
  if (!user.badges) user.badges = [];
  
  for (const badge of BADGE_DICTIONARY) {
    const hasBadge = user.badges.some(b => b.badgeId === badge.id);
    if (hasBadge) continue;
    
    let isEligible = false;
    const reqs = badge.requirements;

    if (reqs.points && user.points >= reqs.points) isEligible = true;
    if (reqs.totalDonations && user.stats.totalDonations >= reqs.totalDonations) isEligible = true;
    if (reqs.totalVolunteering && user.stats.totalVolunteering >= reqs.totalVolunteering) isEligible = true;
    if (reqs.totalAid && user.stats.totalAid >= reqs.totalAid) isEligible = true;
    if (reqs.versatile && user.stats.hasDonation && user.stats.hasVolunteering && user.stats.hasAid) isEligible = true;
    if (reqs.profileComplete && user.stats.profileComplete) isEligible = true;
    if (reqs.longestStreak && user.streak && user.streak.longest >= reqs.longestStreak) isEligible = true;
    if (reqs.highRoller && user.stats.highRoller) isEligible = true;
    if (reqs.totalGeo && user.stats.totalGeo >= reqs.totalGeo) isEligible = true;
    if (reqs.totalRejections && user.stats.totalRejections >= reqs.totalRejections) isEligible = true;

    if (isEligible) {
      user.badges.push({
        badgeId: badge.id,
        level: 1,
        name: badge.name,
        icon: badge.icon,
        date: Date.now()
      });
    }
  }
};

/**
 * Approves a pending contribution, awards points, updates user statistics,
 * processes daily quests, and broadcasts an activity feed event.
 *
 * @param {import('express').Request} req - The Express request object containing the contribution ID in params.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming approval.
 */
export const approveContribution = async (req, res) => {
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ msg: 'Заявку не знайдено' });
    if (contribution.status !== 'pending') return res.status(400).json({ msg: 'Заявка вже була оброблена' });
    
    const pointsToAward = parseInt(req.body.points) || 100;
    contribution.status = 'approved';
    contribution.pointsAwarded = pointsToAward;
    await contribution.save();
    
    const user = await User.findById(contribution.user);
    user.points += pointsToAward;
    if (contribution.type === 'donation') {
      user.stats.totalDonations += 1;
      user.stats.hasDonation = true;
    }
    if (contribution.type === 'volunteering') {
      user.stats.totalVolunteering += 1;
      user.stats.hasVolunteering = true;
    }
    if (contribution.type === 'aid') {
      user.stats.totalAid += 1;
      user.stats.hasAid = true;
    }
    if (contribution.location) { 
      user.stats.totalGeo += 1;
    }
    if (pointsToAward >= 1000) {
      user.stats.highRoller = true;
    }
    
    await checkAndAwardBadges(user);
    await handleStreak(user);
    
    const questType = contribution.type === 'volunteering' ? 'volunteer' : contribution.type;
    await updateDailyQuestProgress(user._id, questType, 1);

    // Логіка унікального бейджа "Командний гравець": перевіряємо, чи має юзер активність усіх трьох типів одночасно.
    if (user.stats.hasDonation && user.stats.hasVolunteering && user.stats.hasAid) {
      const hasTeamBadge = user.badges.some(b => b.badgeId === 'team_player');
      if (!hasTeamBadge) {
        user.badges.push({
          badgeId: 'team_player',
          level: 1,
          name: 'Командний гравець',
          icon: '🤝',
          date: new Date()
        });
      }
    }

    await user.save();

    // Синхронізація гільдій: бали за внесок нараховуються також на рахунок гільдії користувача.
    await Guild.addXPForUser(user._id, pointsToAward);

    if (req.io) {
      const message = `${user.username} щойно виконав завдання '${contribution.title}' +${pointsToAward} XP`;
      await Activity.create({ message, type: 'contribution_approved' });
      req.io.emit('activity_feed', { message });
    }

    res.json({ msg: 'Заявку схвалено, бали нараховано!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Rejects a pending contribution and records the rejection in user stats.
 *
 * @param {import('express').Request} req - The Express request object containing the contribution ID and a comment.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming rejection.
 */
export const rejectContribution = async (req, res) => {
  const { comment } = req.body; 
  try {
    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) return res.status(404).json({ msg: 'Заявку не знайдено' });
    
    contribution.status = 'rejected';
    contribution.rejectionComment = comment || 'Причину не вказано';
    await contribution.save();
    
    const user = await User.findById(contribution.user);
    user.stats.totalRejections += 1;
    await checkAndAwardBadges(user);
    await user.save();
    
    res.json({ msg: 'Заявку відхилено' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves all pending contributions for administrative review.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of pending contributions.
 */
export const getPendingContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ status: 'pending' })
                                            .populate('user', 'username email');
    res.json(contributions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves all contributions submitted by the authenticated user.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of the user's contributions.
 */
export const getMyContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ user: req.user.id })
                                            .sort({ createdAt: -1 }); 
    res.json(contributions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};