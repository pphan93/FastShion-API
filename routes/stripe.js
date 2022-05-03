const router = require("express").Router();
// dotenv.config();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

//payment using stripe
router.post("/payment", (req, res) => {
  stripe.charges.create(
    {
      source: req.body.tokenId.id,
      amount: req.body.amount,
      currency: "cad",
    },
    (stripeError, stripeRes) => {
      if (stripeError) {
        res.status(500).json(stripeError);
      } else {
        res.status(200).json(stripeRes);
      }
    }
  );
});

module.exports = router;
