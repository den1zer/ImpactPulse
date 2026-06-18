import DailyQuest from '../models/DailyQuest.js';
import User from '../models/User.js';
import Guild from '../models/Guild.js';
import { generateDailyQuests } from '../utils/gameLogic.js';
import { updateUserLevel } from '../utils/levelSystem.js';
import { checkAndAwardBadges } from './contributionController.js';

/**
 * Retrieves the daily quests for the authenticated user.
 * If no quests exist for today, generates a new set.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the user's daily quests.
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
 * Claims the reward for a completed specific quest.
 * Updates user XP, ImpactCoins, level, and propagates XP to the user's guild.
 *
 * @param {import('express').Request} req - The Express request object containing the questId.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with updated stats and quest status.
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

    const oldXp = user.xp || 0;
    user.xp = oldXp + quest.xpReward;
    user.points = (user.points || 0) + quest.xpReward; 
    
    // Економіка винагород: ImpactCoin нараховується у співвідношенні 1 монета за кожні 10 отриманих XP.
    const coinsToAdd = Math.floor(user.xp / 10) - Math.floor(oldXp / 10);
    if (coinsToAdd > 0) {
      user.coins = (user.coins || 0) + coinsToAdd;
    }

    updateUserLevel(user);
    await checkAndAwardBadges(user);
    await user.save();

    // Синхронізація гільдій: XP, отримані користувачем, також додаються до загального прогресу його гільдії.
    await Guild.addXPForUser(userId, quest.xpReward);

    quest.claimed = true;
    
    // Перевірка повного закриття щоденних квестів: якщо всі виконані та отримані, закриваємо загальний щоденний прогрес.
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
