import express from 'express';
import { generateLiqPayData, verifyLiqPaySignature, decodeLiqPayData } from '../utils/liqpay.js';
import Donation from '../models/Donation.js';
import Fundraiser from '../models/Fundraiser.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { checkAndAwardBadges } from '../controllers/contributionController.js';
import { handleStreak, updateDailyQuestProgress } from '../utils/gameLogic.js';

const router = express.Router();

// POST /api/payment/create
/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     summary: Create a LiqPay payment for a fundraiser
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - collectionId
 *             properties:
 *               amount:
 *                 type: number
 *               collectionId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment data and signature
 */
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { amount, collectionId, description } = req.body;

    if (!amount || !collectionId) {
      return res.status(400).json({ error: 'amount and collectionId are required' });
    }

    const userId = req.user.id;
    // Format: donation_<collectionId>_<userId>_<timestamp>
    const orderId = `donation_${collectionId}_${userId}_${Date.now()}`;
    const desc = description || `Донат на збір ${collectionId}`;

    const { data, signature } = generateLiqPayData({
      amount,
      description: desc,
      orderId
    });

    res.json({ data, signature, orderId });
  } catch (error) {
    console.error('Error in /api/payment/create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payment/support-project
/**
 * @swagger
 * /api/payment/support-project:
 *   post:
 *     summary: Create a LiqPay payment to support the project
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment data and signature
 */
router.post('/support-project', async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const orderId = `support_${Date.now()}`;
    const desc = description || `Підтримка проекту ImpactPulse`;

    const { data, signature } = generateLiqPayData({
      amount,
      description: desc,
      orderId
    });

    res.json({ data, signature, orderId });
  } catch (error) {
    console.error('Error in /api/payment/support-project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payment/callback
/**
 * @swagger
 * /api/payment/callback:
 *   post:
 *     summary: LiqPay callback handler
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Callback processed successfully
 */
router.post('/callback', async (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!data || !signature) {
      return res.status(400).send('Missing data or signature');
    }

    const isValid = verifyLiqPaySignature(data, signature);
    if (!isValid) {
      console.error('LiqPay invalid signature');
      return res.status(400).send('Invalid signature');
    }

    const decoded = decodeLiqPayData(data);
    const { order_id, status, amount, currency, sender_email } = decoded;

    // order_id is formatted as donation_<collectionId>_<userId>_<Date.now()>
    const parts = order_id.split('_');
    const collectionId = parts[1];
    const userId = parts[2];

    if (status === 'success' || status === 'sandbox') {
      // Find if donation was already processed
      const existingDonation = await Donation.findOne({ orderId: order_id });
      
      if (!existingDonation) {
        // Save donation
        await Donation.create({
          collectionId,
          amount,
          currency,
          orderId: order_id,
          status,
          payerEmail: sender_email
        });

        // Increment collectedAmount
        const fundraiser = await Fundraiser.findById(collectionId);
        if (fundraiser) {
          fundraiser.collectedAmount += Number(amount);
          
          if (fundraiser.collectedAmount >= fundraiser.goalAmount) {
            fundraiser.status = 'closed';
          }
          await fundraiser.save();
        }

        // Award points if we have a valid userId
        if (userId && userId !== 'undefined') {
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

                // Badge: "Швидка реакція"
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

              } catch (err) {
                console.error('Error awarding badges or updating quests/streaks:', err);
              }
              
              await user.save();
            }
          }
        }
      }
    }

    // Always return 200 OK for LiqPay callback
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error in /api/payment/callback:', error);
    return res.status(200).send('OK');
  }
});

export default router;

