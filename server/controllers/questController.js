import DailyQuest from '../models/DailyQuest.js';
import User from '../models/User.js';
import Guild from '../models/Guild.js';
import { generateDailyQuests } from '../utils/gameLogic.js';
import { updateUserLevel } from '../utils/levelSystem.js';

/**
 * Get daily quests for the current user. Generates new ones if they don't exist for today.
 */
export const getTodayQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let dailyQuest = await DailyQuest.findOne({ userId, date: startOfDay });

    if (!dailyQuest) {
      dailyQuest = await generateDailyQuests(userId);
    }

    res.json(dailyQuest);
  } catch (err) {
    console.error('Error in getTodayQuests:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Claim reward for a specific completed quest
 */
export const claimRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questId } = req.body;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyQuest = await DailyQuest.findOne({ userId, date: startOfDay });

    if (!dailyQuest) {
      return res.status(404).json({ msg: 'Квести на сьогодні не знайдені' });
    }

    const quest = dailyQuest.quests.id(questId);
    
    if (!quest) {
      return res.status(404).json({ msg: 'Квест не знайдено' });
    }

    if (!quest.completed) {
      return res.status(400).json({ msg: 'Квест ще не виконано' });
    }

    if (quest.claimed) {
      return res.status(400).json({ msg: 'Нагороду за цей квест вже отримано' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Користувача не знайдено' });
    }

    // Add XP and update level
    const oldXp = user.xp || 0;
    user.xp = oldXp + quest.xpReward;
    user.points = (user.points || 0) + quest.xpReward; 
    
    // ImpactCoin reward: 1 coin per 10 XP
    const coinsToAdd = Math.floor(user.xp / 10) - Math.floor(oldXp / 10);
    if (coinsToAdd > 0) {
      user.coins = (user.coins || 0) + coinsToAdd;
    }

    updateUserLevel(user);
    await user.save();

    // Guild XP aggregation — propagate quest XP to the user's guild
    await Guild.addXPForUser(userId, quest.xpReward);

    // Mark specific quest as claimed
    quest.claimed = true;
    
    // Check if all quests are claimed, then mark dailyQuest as claimed
    if (dailyQuest.quests.every(q => q.claimed)) {
      dailyQuest.claimed = true;
    }
    
    await dailyQuest.save();

    res.json({ 
      msg: 'Нагороду успішно отримано!', 
      xpAdded: quest.xpReward,
      currentXp: user.xp,
      coinsAdded: coinsToAdd,
      currentCoins: user.coins,
      level: user.level,
      dailyQuest
    });

  } catch (err) {
    console.error('Error in claimRewards:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

