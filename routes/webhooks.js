const router = require("express").Router();
const Order = require("../models/Order");

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
      console.log(checkout);

      //get line items that get send to stripe, also expand the product data to get data regarding products
      //to get products that was ordered
      const line_items = await stripe.checkout.sessions.listLineItems(
        checkout.id,
        {
          expand: ["data.price.product"],
        }
      );

      // const data = await stripe.checkout.sessions.listLineItems(checkout.id);
      // const { line_items } = await stripe.checkout.sessions.retrieve(
      //   checkout.id,
      //   {
      //     expand: ["line_items"],
      //   }
      // );

      let products = [];

      line_items.data.map((item) => {
        products.push({
          productId: item.price.product.metadata.productID,
          quantity: item.quantity,
        });
      });

      const orderDetail = {
        email: checkout.customer_details.email,
        products: products,
        amount: checkout.amount_total / 100,
        address: checkout.customer_details.address,
        name: checkout.customer_details.name,
      };

      //save to order db
      const newOrder = new Order(orderDetail);

      try {
        const savedOrder = await newOrder.save();
      } catch (error) {
        console.log(error);
      }

      console.log(products);

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
