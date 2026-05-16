import express from 'express';
import { generateLiqPayData, verifyLiqPaySignature, decodeLiqPayData, checkLiqPayStatus } from '../utils/liqpay.js';
import { processSuccessfulPayment } from '../services/paymentService.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to get base URL for callback
const getBaseUrl = (req) => {
  // If we're on localhost, we can't get a public callback anyway, 
  // but we can try to use process.env.BASE_URL if it exists.
  if (req.get('host').includes('localhost')) {
    return process.env.BASE_URL || `http://${req.get('host')}`;
  }
  // On production (Render/Vercel), we should use https
  return `https://${req.get('host')}`;
};

// POST /api/payment/create
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { amount, collectionId, description } = req.body;

    if (!amount || !collectionId) {
      return res.status(400).json({ error: 'amount and collectionId are required' });
    }

    const userId = req.user.id;
    const orderId = `donation_${collectionId}_${userId}_${Date.now()}`;
    const desc = description || `Донат на збір ${collectionId}`;

    const baseUrl = getBaseUrl(req);
    const { data, signature } = generateLiqPayData({
      amount,
      description: desc,
      orderId,
      serverUrl: `${baseUrl}/api/payment/callback`,
      resultUrl: req.headers.origin ? `${req.headers.origin}/fundraisers` : undefined
    });

    console.log(`[Payment] Created — userId=${userId} amount=${amount} orderId=${orderId} callback=${baseUrl}/api/payment/callback`);

    res.json({ data, signature, orderId });
  } catch (error) {
    console.error('Error in /api/payment/create:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/payment/support-project
router.post('/support-project', async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'amount is required' });
    }

    const orderId = `support_${Date.now()}`;
    const desc = description || `Підтримка проекту ImpactPulse`;

    const baseUrl = getBaseUrl(req);
    const { data, signature } = generateLiqPayData({
      amount,
      description: desc,
      orderId,
      serverUrl: `${baseUrl}/api/payment/callback`,
      resultUrl: req.headers.origin ? `${req.headers.origin}/support` : undefined
    });

    res.json({ data, signature, orderId });
  } catch (error) {
    console.error('Error in /api/payment/support-project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payment/status/:orderId
/**
 * Manual status check for LiqPay payments.
 * Useful for local testing or when callback is delayed.
 */
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`[Payment] Checking status for order: ${orderId}`);
    
    const result = await checkLiqPayStatus(orderId);
    const { status, amount, currency, sender_email } = result;

    if (status === 'success' || status === 'sandbox') {
      await processSuccessfulPayment({
        order_id: orderId,
        status,
        amount,
        currency,
        sender_email
      }, req.io);
      
      return res.json({ success: true, status, msg: 'Payment verified and processed.' });
    }

    res.json({ success: false, status, msg: `Current status: ${status}` });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
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
      console.error('[LiqPay] Invalid callback signature');
      return res.status(400).send('Invalid signature');
    }

    const decoded = decodeLiqPayData(data);
    const { status } = decoded;

    console.log(`[LiqPay] Callback received for ${decoded.order_id} status=${status}`);

    if (status === 'success' || status === 'sandbox') {
      await processSuccessfulPayment(decoded, req.io);
    } else {
      console.log(`[LiqPay] Payment ${decoded.order_id} not successful yet: ${status}`);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error in /api/payment/callback:', error);
    // Always return 200 to LiqPay to stop retries if it's a code error, 
    // unless we actually want them to retry.
    return res.status(200).send('OK');
  }
});

export default router;

