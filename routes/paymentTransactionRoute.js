const express = require("express");
const router = express.Router();
const authController = require("./../controllers/authController");
const hostAuthController = require("./../controllers/hostAuthController");
const paymentTransactionController = require("../controllers/paymentTransactionController");
const paystackController = require("../controllers/paystack");
router
  .route("/")
  .get(
    hostAuthController.hostProtect,
    paymentTransactionController.getAllPaymentTransactions
  );

router.get("/verify", paystackController.verifyPayment);
router.post(
  "/initialize",
  authController.customerProtect,
  paystackController.initializePayment
);
router
  .route("/:id")
  .put(paymentTransactionController.updatePaymentTransaction)
  .get(paymentTransactionController.getPaymentTransaction)
  .delete(
    hostAuthController.hostProtect,
    paymentTransactionController.deletePaymentTransaction
  );
module.exports = router;
