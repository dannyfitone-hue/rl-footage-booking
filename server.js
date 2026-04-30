const express = require('express');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN_URL = process.env.DOMAIN_URL || 'https://rl-footage-booking.vercel.app';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });
    }

    const { clientEmail, basePackage, addOns = [] } = req.body || {};

    const line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: basePackage?.name || 'RL FOOTAGE Wedding Photo + Video Package'
          },
          unit_amount: Math.round((basePackage?.price || 8500) * 100)
        },
        quantity: 1
      },
      ...addOns.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name || 'Wedding Add-On'
          },
          unit_amount: Math.round((item.price || 0) * 100)
        },
        quantity: 1
      }))
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail || 'mahdounehimani@gmail.com',
      line_items,
      success_url: `${DOMAIN_URL}/success.html`,
      cancel_url: `${DOMAIN_URL}/#checkout`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`RL FOOTAGE booking server running on port ${PORT}`);
});
