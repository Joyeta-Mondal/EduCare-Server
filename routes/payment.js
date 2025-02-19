const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = (db) => {
  const paymentCollection = db.collection("paymentCollection");

  //payment intent
  router.post("/create-payment-intent", verifyToken, async (req, res) => {
    const { price } = req.body;
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: "usd",
      // In the latest version of the API, specifying the automatic_payment_methods parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });

  //   router.post("/create-payment-intent", verifyToken, async (req, res) => {
  //     try {
  //       const paymentIntent = await stripe.paymentIntents.create({
  //         amount: req.body.amount,
  //         currency: "usd",
  //       });
  //       res.send(paymentIntent);
  //     } catch (error) {
  //       console.error("Error creating payment intent:", error);
  //       res.status(500).send({ error: "Failed to create payment intent" });
  //     }
  //   });

  return router;
};
