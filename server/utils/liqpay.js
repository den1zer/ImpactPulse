import crypto from 'crypto';

export const generateLiqPayData = ({ amount, currency = 'UAH', description, orderId }) => {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('LiqPay keys are not configured in environment variables');
  }

  const params = {
    public_key: publicKey,
    version: 3,
    action: 'pay',
    amount,
    currency,
    description,
    order_id: orderId,
    // server_url is where LiqPay will send POST request
    server_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payment/callback`,
    result_url: `http://localhost:3000/fundraisers` // redirect back to frontend after payment
  };

  const jsonString = JSON.stringify(params);
  const data = Buffer.from(jsonString).toString('base64');
  
  const signature = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');

  return { data, signature };
};

export const verifyLiqPaySignature = (data, signature) => {
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  const expectedSignature = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');
    
  return expectedSignature === signature;
};

export const decodeLiqPayData = (data) => {
  const jsonString = Buffer.from(data, 'base64').toString('utf-8');
  return JSON.parse(jsonString);
};
