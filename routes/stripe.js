const router = require("express").Router();
const Product = require("../models/Product");

// dotenv.config();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const calculateOrderAmount = async (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client

  // const { _id, ...newitems } = items;

  const productID = items.map((item) => {
    return item._id;
  });
  // console.log(newitems);
  const records = await Product.find(
    { _id: { $in: productID } },
    { _id: 1, price: 1 }
  );

  console.log(records);

  let totalPrice = 0;

  items.map((item) => {
    totalPrice =
      totalPrice +
      records.find((x) => x._id.toString() === item._id).price * item.quantity;
  });

  return totalPrice;
};

//payment using stripe
router.post("/payment", async (req, res) => {
  // console.log(req.body.cart.products);
  // calculateOrderAmount(req.body.cart.products);
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "T-shirt",
          },
          unit_amount: 2000,
        },
        quantity: 2,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/",
  });

  console.log(session);

  // res.redirect(303, session.url);

  res.status(200).json({ url: session.url });

  // const { items } = req.body;
  // console.log(items);
  // // Create a PaymentIntent with the order amount and currency
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: calculateOrderAmount(items),
  //   currency: "cad",
  //   automatic_payment_methods: {
  //     enabled: true,
  //   },
  // });
  // res.send({
  //   clientSecret: paymentIntent.client_secret,
  // });
  //////////////////////////////////////
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
