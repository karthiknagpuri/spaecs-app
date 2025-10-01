import Razorpay from 'razorpay';

// Server-side Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

// Client-side config
export const razorpayConfig = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  currency: 'INR',
  name: 'Spaecs',
  description: 'Support your favorite creators',
  image: '/logo.png',
  theme: {
    color: '#6366F1' // Indigo color matching the theme
  }
};