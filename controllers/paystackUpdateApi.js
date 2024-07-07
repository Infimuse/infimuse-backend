const db = require("./../models");
const jwt = require("jsonwebtoken");
const Host = db.hosts;
const HostPlan = db.hostPlans;
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");

class PaystackController {
  initializePayment = asyncWrapper(async (req, res) => {
    const { callbackUrl, subscription } = req.body;
    let amount = 0;

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
      if (err) {
        return res.status(500).json({ error: "Jwt Malformed login again" });
      }

      const newHost = await Host.findOne({ where: { id: host.id } });

      if (!newHost) {
        return res.status(404).json({ msg: "Host not found" });
      }

      const email = newHost.email;
      const name = newHost.FirstName;

      if (subscription === "Dabbler") {
        const plan = await HostPlan.create({
          hostId: newHost.id,
          subscription: "Dabbler",
          email: newHost.email,
        });
        return res.status(201).json({ msg: "Created successfully", plan });
      } else if (subscription === "Dipper") {
        amount = 9999 * 100;
      } else if (subscription === "Diver") {
        amount = 16999 * 100;
      }

      const paymentDetails = {
        amount,
        email,
        callback_url: callbackUrl,
        metadata: {
          amount,
          email,
          name,
        },
      };
      const data = await paystackApi.initializePayment(paymentDetails);
      return res.status(200).json({
        message: "Payment initialized successfully",
        data,
      });
    });
  });

  verifyPayment = asyncWrapper(async (req, res) => {
    let hostId;
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
        const hostId = host.id;

        const reference = req.query.reference;
        let subscription;

        if (!reference) {
          throw new Error("Missing transaction reference");
        }

        const {
          data: {
            metadata: { email, amount, name },
            reference: paymentReference,
            status: transactionStatus,
          },
        } = await paystackApi.verifyPayment(reference);

        if (transactionStatus !== "success") {
          throw new Error(`Transaction: ${transactionStatus}`);
        }

        const [payment] = await HostPlan.findOrCreate({
          where: { paymentReference },
          defaults: {
            amount,
            email,
            name,
            paymentReference,
            hostId,
          },
        });

        const updatedPayment = await payment.update({ amount: amount / 100 });
        if (updatedPayment.amount === 9999) {
          subscription = "Dipper";
        } else if (updatedPayment.amount === 16999) {
          subscription = "Diver";
        }
        console.log(subscription);
        await updatedPayment.update({ subscription });

        return res.status(200).json({
          message: "Payment verified",
          data: payment,
        });
      });
    } else if (!token) {
      const reference = req.query.reference;
      let subscription;

      if (!reference) {
        throw new Error("Missing transaction reference");
      }

      const {
        data: {
          metadata: { email, amount, name },
          reference: paymentReference,
          status: transactionStatus,
        },
      } = await paystackApi.verifyPayment(reference);

      if (transactionStatus !== "success") {
        throw new Error(`Transaction: ${transactionStatus}`);
      }

      const [payment] = await HostPlan.findOrCreate({
        where: { paymentReference },
        defaults: {
          amount,
          email,
          paymentReference,
        },
      });

      const updatedPayment = await payment.update({ amount: amount / 100 });
      if (updatedPayment.amount === 9999) {
        subscription = "Dipper";
      } else if (updatedPayment.amount === 16999) {
        subscription = "Diver";
      }
      await updatedPayment.update({ subscription, hostId: 1 });

      return res.status(200).json({
        message: "Payment verified",
        data: payment,
      });
    }
  });
}

const paystackController = new PaystackController();

module.exports = paystackController;
