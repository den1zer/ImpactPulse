import DailyQuest from '../models/DailyQuest.js';
import { updateUserLevel } from './levelSystem.js';
import { BADGE_DICTIONARY } from '../constants/badges.js';

/**
 * Handle user streak update
 * @param {Object} user - User document
 */
export async function handleStreak(user) {
  const now = new Date();
  
  if (!user.streak) {
    user.streak = { current: 0, longest: 0, lastActivityDate: null };
  }

  const lastActivity = user.streak.lastActivityDate;
  
  if (lastActivity) {
    // Reset hours to 0 to compare dates purely
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
    
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      // Activity was yesterday
      user.streak.current += 1;
    } else if (diffDays > 1) {
      // Activity was more than 1 day ago
      user.streak.current = 1;
    }
  } else {
    // First activity
    user.streak.current = 1;
  }
  
  if (user.streak.current > user.streak.longest) {
    user.streak.longest = user.streak.current;
  }
  
  user.streak.lastActivityDate = now;

  // Badge logic for streak
  if (user.streak.current === 7) {
    const oldXp = user.xp || 0;
    user.xp = oldXp + 100; // Bonus XP for 7 days
    const coinsToAdd = Math.floor(user.xp / 10) - Math.floor(oldXp / 10);
    if (coinsToAdd > 0) user.coins = (user.coins || 0) + coinsToAdd;
    awardBadgeToUser(user, 'streak_7_days', 'Полум\'я', '🔥');
  } else if (user.streak.current === 30) {
    const oldXp = user.xp || 0;
    user.xp = oldXp + 500; // Bonus XP for 30 days
    const coinsToAdd = Math.floor(user.xp / 10) - Math.floor(oldXp / 10);
    if (coinsToAdd > 0) user.coins = (user.coins || 0) + coinsToAdd;
    awardBadgeToUser(user, 'streak_30_days', 'Незламний', '🛡️');
  }

  // Update level based on XP changes
  updateUserLevel(user);
}

function awardBadgeToUser(user, badgeId, name, icon) {
  const hasBadge = user.badges.some(b => b.badgeId === badgeId);
  if (!hasBadge) {
    user.badges.push({
      badgeId,
      level: 1,
      name,
      icon,
      date: new Date()
    });
  }
}

/**
 * Generate daily quests for a user
 * @param {ObjectId} userId 
 */
export async function generateDailyQuests(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Define possible quests
  const possibleQuests = [
    { type: 'login', target: 1, xpReward: 10 },
    { type: 'donation', target: 1, xpReward: 50 },
    { type: 'volunteer', target: 1, xpReward: 100 },
    { type: 'comment', target: 2, xpReward: 20 },
  ];

  // Shuffle and pick 3
  const shuffled = possibleQuests.sort(() => 0.5 - Math.random());
  const selectedQuests = shuffled.slice(0, 3).map(q => ({
    ...q,
    current: 0,
    completed: false
  }));

  const dailyQuest = new DailyQuest({
    userId,
    date: startOfDay,
    quests: selectedQuests
  });

  await dailyQuest.save();
  return dailyQuest;
}

/**
 * Update quest progress for a user
 * @param {ObjectId} userId 
 * @param {String} type - Quest type
 * @param {Number} amount - Amount to add to current progress
 */
export async function updateDailyQuestProgress(userId, type, amount = 1) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyQuest = await DailyQuest.findOne({ userId, date: startOfDay });
  if (!dailyQuest) return null;

  let updated = false;

  for (let quest of dailyQuest.quests) {
    if (quest.type === type && !quest.completed) {
      quest.current += amount;
      if (quest.current >= quest.target) {
        quest.current = quest.target;
        quest.completed = true;
      }
      updated = true;
    }
  }

  if (updated) {
    await dailyQuest.save();
  }
  
  return dailyQuest;
}

