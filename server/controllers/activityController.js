import Activity from '../models/Activity.js';

/**
 * Retrieves the 10 most recent global platform activities.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of recent activities.
 */
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
