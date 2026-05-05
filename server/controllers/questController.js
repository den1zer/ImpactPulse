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
 * Claim rewards for completed quests
 */
exports.claimRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyQuest = await DailyQuest.findOne({ userId, date: startOfDay });

    if (!dailyQuest) {
      return res.status(404).json({ msg: 'Квести на сьогодні не знайдені' });
    }

    if (dailyQuest.claimed) {
      return res.status(400).json({ msg: 'Нагороди вже отримані' });
    }

    const completedQuests = dailyQuest.quests.filter(q => q.completed);
    
    if (completedQuests.length === 0) {
      return res.status(400).json({ msg: 'Немає виконаних квестів для отримання нагороди' });
    }

    const totalXpReward = completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Користувача не знайдено' });
    }

    // Add XP and update level
    user.xp = (user.xp || 0) + totalXpReward;
    user.points = (user.points || 0) + totalXpReward; // Optional: depending on if points & xp are parallel
    
    updateUserLevel(user);
    await user.save();

    // Mark as claimed. Note: could be partially claimed if we allow claiming individually.
    // Based on requirements, it seems we claim all completed ones at once, or claim the whole day.
    // If we mark claimed=true for the day, they can't claim any more today even if they complete more later.
    // Let's assume claimed=true applies to the dailyQuest document.
    // To allow partial claims, we could mark individual quests as claimed. 
    // The instructions say: "ставить claimed: true", referring to the model field.
    
    // Actually, if we set claimed: true, we should make sure all quests are completed, 
    // or we just mark the day as claimed.
    // Let's check if ALL quests are completed, if so set claimed = true.
    // If not, we might still reward them and need a way to track which ones were claimed.
    // But the DailyQuestSchema only has a global `claimed` boolean.
    // So let's assume they claim at the end of the day or when all are done, 
    // OR we just mark it claimed once they click claim and they get whatever is done.
    
    // I will set it to true so they can only claim once per day
    dailyQuest.claimed = true;
    await dailyQuest.save();

    res.json({ 
      msg: 'Нагороди успішно отримані!', 
      xpAdded: totalXpReward,
      currentXp: user.xp,
      level: user.level
    });

  } catch (err) {
    console.error('Error in claimRewards:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
