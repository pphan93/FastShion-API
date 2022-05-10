const router = require("express").Router();

const stripe = require("stripe")(process.env.STRIPE_KEY);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent status: ${paymentIntent.status}`);
      console.log(event.data);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      console.log(
        `❌ Payment failed: ${paymentIntent.last_payment_error?.message}`
      );
      break;
    }
    case "charge.succeeded": {
      const charge = event.data.object;
      console.log(`Charge id: ${charge.id}`);
      break;
    }
    case "checkout.session.completed": {
      const checkout = event.data.object;
      const { line_items } = await stripe.checkout.sessions.retrieve(
        checkout.id,
        {
          expand: ["line_items"],
        }
      );
      console.log(line_items);
      break;
    }
    default: {
      console.warn(`Unhandled event type: ${event.type}`);
      break;
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

module.exports = router;
