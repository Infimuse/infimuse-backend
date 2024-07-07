const db = require("../models");
const PaymentTransaction = db.paymentTransactions;
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");

class PaystackController {
  initializePayment = asyncWrapper(async (req, res) => {
    const { amount, email, callbackUrl, name } = req.body;

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

  verifyPayment = asyncWrapper(async (req, res) => {
    const reference = req.query.reference;

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

    const [payment] = await PaymentTransaction.findOrCreate({
      where: { paymentReference },
      defaults: { amount, email, name, paymentReference },
    });

    return res.status(200).json({
      message: "Payment verified",
      data: payment,
    });
  });
}

const paystackController = new PaystackController();

module.exports = paystackController;
