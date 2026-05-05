const Contribution = require('../models/Contribution');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Task = require('../models/Task');
const { handleStreak, updateDailyQuestProgress } = require('../utils/gameLogic');

exports.addContribution = async (req, res) => {
  
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

const checkAndAwardBadges = async (user) => {
  const allBadges = await Badge.find(); 
  for (const badge of allBadges) {
    let currentValue = 0;
    let currentLevel = 0;
    const userBadge = user.badges.find(b => b.badgeId === badge.badgeId);
    if (userBadge) {
      currentLevel = userBadge.level;
    }
    if (badge.triggerType === 'POINTS') currentValue = user.points;
    if (badge.triggerType === 'DONATION_COUNT') currentValue = user.stats.totalDonations;
    if (badge.triggerType === 'VOLUNTEER_COUNT') currentValue = user.stats.totalVolunteering;
    if (badge.triggerType === 'AID_COUNT') currentValue = user.stats.totalAid;
    if (badge.triggerType === 'GEO') currentValue = user.stats.totalGeo;
    if (badge.triggerType === 'REJECTED') currentValue = user.stats.totalRejections;
    if (badge.triggerType === 'VERSATILE' && user.stats.hasDonation && user.stats.hasVolunteering && user.stats.hasAid) currentValue = 1;
    if (badge.triggerType === 'PROFILE' && user.stats.profileComplete) currentValue = 1;
    if (badge.triggerType === 'HIGH_ROLLER' && user.stats.highRoller) currentValue = 1;
    let newLevel = null;
    for (const level of badge.levels) { 
      if (currentValue >= level.value && level.level > currentLevel) {
        newLevel = level;
      }
    }
    if (newLevel) {
      if (userBadge) {
        userBadge.level = newLevel.level;
        userBadge.name = newLevel.name;
        userBadge.icon = newLevel.icon_color;
        userBadge.date = Date.now();
      } else {
        user.badges.push({
          badgeId: badge.badgeId,
          level: newLevel.level,
          name: newLevel.name,
          icon: newLevel.icon_color,
        });
      }
    }
  }
};
exports.checkAndAwardBadges = checkAndAwardBadges;

exports.approveContribution = async (req, res) => {
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
    
    // Process streak and daily quests
    await handleStreak(user);
    const questType = contribution.type === 'volunteering' ? 'volunteer' : contribution.type;
    await updateDailyQuestProgress(user._id, questType, 1);

    // Badge: Командний гравець
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
    res.json({ msg: 'Заявку схвалено, бали нараховано!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.rejectContribution = async (req, res) => {
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

exports.getPendingContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ status: 'pending' })
                                            .populate('user', 'username email');
    res.json(contributions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.getMyContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ user: req.user.id })
                                            .sort({ createdAt: -1 }); 
    res.json(contributions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};