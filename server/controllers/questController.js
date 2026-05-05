const DailyQuest = require('../models/DailyQuest');
const User = require('../models/User');
const { generateDailyQuests } = require('../utils/gameLogic');
const { updateUserLevel } = require('../utils/levelSystem');

/**
 * Get daily quests for the current user. Generates new ones if they don't exist for today.
 */
exports.getTodayQuests = async (req, res) => {
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
exports.claimRewards = async (req, res) => {
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
    user.xp = (user.xp || 0) + quest.xpReward;
    user.points = (user.points || 0) + quest.xpReward; 
    
    updateUserLevel(user);
    await user.save();

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
      level: user.level,
      dailyQuest
    });

  } catch (err) {
    console.error('Error in claimRewards:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
