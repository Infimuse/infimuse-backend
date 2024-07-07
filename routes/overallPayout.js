const express = require("express");
const router = express.Router();
const overallPayouts = require("../utils/midlewares/overallPayouts");
const hostAuth = require("../controllers/hostAuthController");
const wallet = require("../controllers/wallet");
router.route("/").get(overallPayouts.overallPayouts);
router.post("/withdraw", wallet.withdraw);

module.exports = router;
