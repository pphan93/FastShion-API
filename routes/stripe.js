const router = require("express").Router();
// dotenv.config();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

//payment using stripe
router.post("/payment", (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "cad",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });

  // stripe.charges.create(
  //   {
  //     source: req.body.tokenId.id,
  //     amount: req.body.amount,
  //     currency: "cad",
  //   },
  //   (stripeError, stripeRes) => {
  //     if (stripeError) {
  //       res.status(500).json(stripeError);
  //     } else {
  //       res.status(200).json(stripeRes);
  //     }
  //   }
  // );
});

module.exports = router;
