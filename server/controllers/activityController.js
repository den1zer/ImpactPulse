import Activity from '../models/Activity.js';

export const getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (err) {
    console.error('getRecentActivities error:', err);
    res.status(500).json({ msg: 'Помилка сервера' });
  }
};
