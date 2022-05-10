const router = require("express").Router();
const Product = require("../models/Product");

// dotenv.config();
const dotenv = require("dotenv");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_KEY);

const calculateOrderAmount = async (items) => {
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client

  const productID = items.map((item) => {
    return item._id;
  });

  //get the actual price from data to prevent tampering
  const records = await Product.find(
    { _id: { $in: productID } },
    { _id: 1, price: 1 }
  );

  //generate array of items for stripe
  const productItems = items.map((item) => {
    // console.log(item);
    return {
      price_data: {
        currency: "cad",
        product_data: {
          name: item.title,
          images: [item.img],
        },
        unit_amount:
          records.find((x) => x._id.toString() === item._id).price * 100,
      },
      quantity: item.quantity,
    };
  });

  // console.log(productItems[1]);

  return productItems;
};

//payment using stripe
router.post("/payment", async (req, res) => {
  //generate line_items for stripe
  const line_items = await calculateOrderAmount(req.body.cart.products);

  const session = await stripe.checkout.sessions.create({
    shipping_address_collection: {
      allowed_countries: ["US", "CA"],
    },
    //shipping
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "cad",
          },
          display_name: "Free shipping",
          // Delivers between 5-7 business days
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "cad",
          },
          display_name: "Next day air",
          // Delivers in exactly 1 business day
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    line_items: [...line_items],
    mode: "payment",
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/",
  });

  //doesnt seem to work if using fetch instead of <form action="" method="POST">
  // res.redirect(303, session.url);

  //send the url back to frontend, then from there redirect to stripe
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
