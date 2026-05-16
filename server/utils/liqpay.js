import crypto from 'crypto';

export const generateLiqPayData = ({ amount, currency = 'UAH', description, orderId, serverUrl, resultUrl }) => {
  const publicKey  = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('LiqPay keys are not configured in environment variables');
  }

  // Detect if using sandbox keys
  const isSandbox = publicKey.startsWith('sandbox_');

  const params = {
    public_key:  publicKey,
    version:     3,
    action:      isSandbox ? 'pay' : 'pay',
    amount:      String(amount),
    currency,
    description,
    order_id:    orderId,
    language:    'uk',
    server_url:  serverUrl || `${process.env.BASE_URL || 'https://impactpulse-backend.onrender.com'}/api/payment/callback`,
    result_url:  resultUrl || `${process.env.FRONTEND_URL || 'https://impact-pulse.vercel.app'}/fundraisers`,
  };

  // In sandbox mode, set sandbox action explicitly
  if (isSandbox) {
    params.sandbox = 1;
  }

  const jsonString = JSON.stringify(params);
  const data       = Buffer.from(jsonString).toString('base64');

  const signature  = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');

  console.log('[LiqPay] Generated payment data:', {
    orderId,
    amount,
    isSandbox,
    server_url: params.server_url,
    result_url: params.result_url,
  });

  return { data, signature };
};

export const verifyLiqPaySignature = (data, signature) => {
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  const expected   = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');
  return expected === signature;
};

export const decodeLiqPayData = (data) => {
  const jsonString = Buffer.from(data, 'base64').toString('utf-8');
  return JSON.parse(jsonString);
};

export const checkLiqPayStatus = async (orderId) => {
  const publicKey  = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('LiqPay keys are not configured');
  }

  const params = {
    action: 'status',
    version: 3,
    public_key: publicKey,
    order_id: orderId
  };

  const jsonString = JSON.stringify(params);
  const data       = Buffer.from(jsonString).toString('base64');
  const signature  = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');

  const body = new URLSearchParams({ data, signature }).toString();

  try {
    // using native fetch
    const response = await fetch('https://www.liqpay.ua/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error checking LiqPay status:', err);
    throw err;
  }
};
