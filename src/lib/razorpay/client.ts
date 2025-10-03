import Razorpay from 'razorpay';

// Server-side Razorpay instance (lazy-loaded)
let razorpayInstance: Razorpay | null = null;

export const getRazorpay = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayInstance;
};

// Client-side config
export const razorpayConfig = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  currency: 'INR',
  name: 'Spaecs',
  description: 'Support your favorite creators',
  image: '/logo.png',
  theme: {
    color: '#6366F1' // Indigo color matching the theme
  }
};