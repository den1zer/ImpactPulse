import Donation from '../models/Donation.js';
import Fundraiser from '../models/Fundraiser.js';
import User from '../models/User.js';
import { checkAndAwardBadges } from '../controllers/contributionController.js';
import { handleStreak, updateDailyQuestProgress } from '../utils/gameLogic.js';

/**
 * Processes a successful payment: creates a Donation record,
 * updates Fundraiser collected amount, and awards user points/badges.
 */
export const processSuccessfulPayment = async (decoded, io) => {
  const { order_id, status, amount, currency, sender_email } = decoded;

  // order_id format: donation_<collectionId>_<userId>_<timestamp>
  const parts = order_id.split('_');
  const type = parts[0];
  const collectionId = parts[1];
  const userId = parts[2];

  if (type !== 'donation') {
    console.log(`[Payment] Skipping non-donation order: ${order_id}`);
    return;
  }

  // Find if donation was already processed
  const existingDonation = await Donation.findOne({ orderId: order_id });
  if (existingDonation) {
    console.log(`[Payment] Donation already processed: ${order_id}`);
    return;
  }

  // Create Donation record
  const donation = await Donation.create({
    collectionId,
    amount,
    currency,
    orderId: order_id,
    status,
    payerEmail: sender_email
  });

  console.log(`[Payment] Created donation record for order: ${order_id}`);

  // Increment collectedAmount for Fundraiser
  const fundraiser = await Fundraiser.findById(collectionId);
  if (fundraiser) {
    fundraiser.collectedAmount += Number(amount);
    
    if (fundraiser.collectedAmount >= fundraiser.goalAmount) {
      fundraiser.status = 'closed';
    }
    await fundraiser.save();
    console.log(`[Payment] Updated fundraiser ${collectionId}: +${amount}`);

    if (io) {
      io.emit('fundraiser_updated', fundraiser);
    }
  } else {
    console.warn(`[Payment] Fundraiser not found for ID: ${collectionId}`);
  }

  // Award points/badges to User
  if (userId && userId !== 'undefined' && userId !== 'null') {
    const COEFFICIENT = 0.1;
    const pointsToAward = Math.floor(Number(amount) * COEFFICIENT);
    
    if (pointsToAward > 0) {
      const user = await User.findById(userId);
      if (user) {
        user.points += pointsToAward;
        
        try {
          await checkAndAwardBadges(user);
          await handleStreak(user);
          await updateDailyQuestProgress(user._id, 'donation', 1);

          // Badge: "Швидка реакція" (Quick Reaction) - if donated within 1h of creation
          if (fundraiser && (Date.now() - new Date(fundraiser.createdAt).getTime() < 60 * 60 * 1000)) {
            const hasQuickBadge = user.badges.some(b => b.badgeId === 'quick_reaction');
            if (!hasQuickBadge) {
              user.badges.push({
                badgeId: 'quick_reaction',
                level: 1,
                name: 'Швидка реакція',
                icon: '⚡',
                date: new Date()
              });
            }
          }
          await user.save();
          console.log(`[Payment] Awarded ${pointsToAward} points and updated badges for user: ${userId}`);
        } catch (err) {
          console.error('[Payment] Error awarding badges or updating quests/streaks:', err);
        }
      }
    }
  }
};
