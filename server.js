const express = require('express');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN_URL || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { clientEmail, basePackage, addOns = [] } = req.body || {};

    const line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: basePackage?.name || 'Wedding Package' },
          unit_amount: Math.round((basePackage?.price || 8500) * 100)
        },
        quantity: 1
      },
      ...addOns.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: 1
      }))
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail || 'mahdounehimani@gmail.com',
      line_items,
      success_url: `${DOMAIN}/success.html`,
      cancel_url: `${DOMAIN}/`
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
