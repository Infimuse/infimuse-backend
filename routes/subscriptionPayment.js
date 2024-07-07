const express = require("express");
const router = express.Router();
const hostPaymentPlanTransactions = require("../controllers/hostPaymentPlanTransaction");

router.route("/").post(hostPaymentPlanTransactions.createPlanPayment);

module.exports = router;
