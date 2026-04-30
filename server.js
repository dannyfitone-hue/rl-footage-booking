const express = require('express');
const Stripe = require('stripe');
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

app.use(express.json());
app.use(express.static(__dirname));

const cents = (v) => Math.round(Number(v) * 100);

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY environment variable.' });
    }

    const { clientName, clientEmail, weddingDate, location, basePackage, addOns = [] } = req.body || {};

    const line_items = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: basePackage?.name || 'RL FOOTAGE Base Wedding Photo + Video Package',
            description: '10 hours premium wedding photography + videography coverage for Mahi Imani.'
          },
          unit_amount: cents(basePackage?.price || 8500)
        },
        quantity: 1
      },
      ...addOns.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: 'RL FOOTAGE wedding add-on service.'
          },
          unit_amount: cents(item.price)
        },
        quantity: 1
      }))
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail || 'mahdounehimani@gmail.com',
      line_items,
      success_url: `${DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/index.html#checkout`,
      metadata: {
        clientName: clientName || 'Mahi Imani',
        clientEmail: clientEmail || 'mahdounehimani@gmail.com',
        weddingDate: weddingDate || 'September 19, 2026',
        location: location || 'Los Angeles',
        bookingType: 'RL FOOTAGE Wedding Booking'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to create Stripe Checkout session.' });
  }
});

app.listen(PORT, () => console.log(`RL FOOTAGE booking page running at http://localhost:${PORT}`));
