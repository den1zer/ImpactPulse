const User = require('../models/User');
const { checkAndAwardBadges } = require('./contributionController'); 
const cloudinary = require('../config/cloudinary');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { username, age, backupEmail, city, gender, profileCustomization } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });
    user.username = username || user.username;
    user.age = age || user.age;
    user.backupEmail = backupEmail || user.backupEmail;
    user.city = city || user.city;
    user.gender = gender || user.gender;
    if (profileCustomization) {
      let parsedCustomization = profileCustomization;
      if (typeof profileCustomization === 'string') {
        try { parsedCustomization = JSON.parse(profileCustomization); } catch(e) {}
      }
      if (parsedCustomization.nicknameIcon !== undefined) user.profileCustomization.nicknameIcon = parsedCustomization.nicknameIcon;
      if (parsedCustomization.avatarFrame !== undefined) user.profileCustomization.avatarFrame = parsedCustomization.avatarFrame;
      if (parsedCustomization.profileTheme !== undefined) user.profileCustomization.profileTheme = parsedCustomization.profileTheme;
    }
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'avatars',
        public_id: `user_${user._id}`,
        overwrite: true,
        transformation: [
          { width: 256, height: 256, crop: 'fill', gravity: 'face' },
          { fetch_format: 'auto', quality: 'auto' }
        ]
      });
      user.avatarUrl = result.secure_url;
      user.avatar = result.secure_url; 
    }

    if (user.avatar && user.city && user.age) {
      user.stats.profileComplete = true;
    }

    await checkAndAwardBadges(user); 

    await user.save();
    res.json(user); 

  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Цей username або email вже зайнято' });
    }
    res.status(500).send('Помилка на сервері');
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });

    if (!req.file) {
      return res.status(400).json({ msg: 'Будь ласка, завантажте файл' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'avatars',
      public_id: `user_${user._id}`,
      overwrite: true,
      transformation: [
        { width: 256, height: 256, crop: 'fill', gravity: 'face' },
        { fetch_format: 'auto', quality: 'auto' }
      ]
    });

    user.avatarUrl = result.secure_url;
    await user.save();

    res.json({ avatarUrl: user.avatarUrl, msg: 'Аватарку успішно оновлено' });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ msg: 'Помилка при завантаженні аватарки' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ msg: 'Невірна роль' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });
    
    user.role = role;
    await user.save();
    res.json({ msg: 'Роль користувача оновлено' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'user' })
      .sort({ points: -1 })
      .limit(10)
      .select('username avatar points level selectedBadge profileCustomization');

    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.updateSelectedBadge = async (req, res) => {
  try {
    const { badgeId, level, name, icon } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'Користувача не знайдено' });

    // Validate that the user has earned this badge
    const hasBadge = user.badges.some(badge =>
      badge.badgeId === badgeId && badge.level === level
    );

    if (!hasBadge && badgeId !== null) {
      return res.status(400).json({ msg: 'Цей бейдж не зароблено' });
    }

    user.selectedBadge = {
      badgeId: badgeId || null,
      level: level || null,
      name: name || null,
      icon: icon || null
    };

    await user.save();
    res.json({ msg: 'Вибраний бейдж оновлено', selectedBadge: user.selectedBadge });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const users = await User.find({ role: 'user' }).select('points stats level badges createdAt');

    const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
    const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

    const pointsDistribution = {
      '0-100': users.filter(u => u.points <= 100).length,
      '101-500': users.filter(u => u.points > 100 && u.points <= 500).length,
      '501-1000': users.filter(u => u.points > 500 && u.points <= 1000).length,
      '1001+': users.filter(u => u.points > 1000).length,
    };

    const topContributors = users
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map(user => ({
        username: user.username,
        points: user.points,
        level: user.level,
        badgesCount: user.badges.length
      }));

    const totalDonations = users.reduce((sum, user) => sum + user.stats.totalDonations, 0);
    const totalVolunteering = users.reduce((sum, user) => sum + user.stats.totalVolunteering, 0);
    const totalAid = users.reduce((sum, user) => sum + user.stats.totalAid, 0);
    const totalGeo = users.reduce((sum, user) => sum + user.stats.totalGeo, 0);
    const highRollers = users.filter(u => u.stats.highRoller).length;
    const profileCompletes = users.filter(u => u.stats.profileComplete).length;

    const recentRegistrations = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(user => ({
        username: user.username,
        createdAt: user.createdAt
      }));

    res.json({
      totalUsers,
      totalAdmins,
      averagePoints,
      pointsDistribution,
      topContributors,
      totalDonations,
      totalVolunteering,
      totalAid,
      totalGeo,
      highRollers,
      profileCompletes,
      recentRegistrations
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};
