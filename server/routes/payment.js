import express from 'express';
import { generateLiqPayData, verifyLiqPaySignature, decodeLiqPayData } from '../utils/liqpay.js';
import Donation from '../models/Donation.js';
import Fundraiser from '../models/Fundraiser.js';
import User from '../models/User.js';
import authModule from '../middleware/authMiddleware.js';

// Витягуємо isAuthenticated з CommonJS модуля
const { isAuthenticated } = authModule;

const router = express.Router();

// POST /api/payment/create
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

// POST /api/payment/callback
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
                // Dynamically import CommonJS module
                const contributionController = await import('../controllers/contributionController.js');
                // Handle different ways Babel/Node might expose the export
                const checkAndAwardBadges = contributionController.default?.checkAndAwardBadges || contributionController.checkAndAwardBadges;
                
                if (typeof checkAndAwardBadges === 'function') {
                  await checkAndAwardBadges(user);
                }
              } catch (err) {
                console.error('Error awarding badges:', err);
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
