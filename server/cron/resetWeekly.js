import cron from 'node-cron';
import User from '../models/User.js';

// Запускається щопонеділка о 00:00 (за серверним часом)
cron.schedule('0 0 * * 1', async () => {
  console.log('Running weekly points reset cron job...');
  try {
    const result = await User.updateMany(
      {},
      { 
        $set: { 
          'weeklyPoints.amount': 0,
          'weeklyPoints.lastReset': new Date()
        } 
      }
    );
    console.log(`Weekly points reset successfully for ${result.modifiedCount} users.`);
  } catch (error) {
    console.error('Error resetting weekly points:', error);
  }
});

