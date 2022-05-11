const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const productRoute = require("./routes/product");
const cartRoute = require("./routes/cart");
const orderRoute = require("./routes/order");
const stripeRoute = require("./routes/stripe");
const webhookRoute = require("./routes/webhooks");

const cors = require("cors");

const app = express();

dotenv.config();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => {
    console.log(err);
  });

// app.get("/api/test", () => {
//   console.log("Test is success");
// });
app.use(cors());

//stripe webhook, to send status regarding the payment (success, fail, etc), will use this to update order db
app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookRoute
);

app.use(express.json());
app.use("/api/user", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/product", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/checkout", stripeRoute);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running: 5000");
});
