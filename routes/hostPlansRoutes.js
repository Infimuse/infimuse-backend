const express = require("express");
const router = express.Router();

const HostPlan = require("../controllers/hostPlanController");
const updatePaystack = require("../controllers/paystackUpdateApi");

router.get("/verify", HostPlan.verifyPayment);
router.get("/updatePayment", updatePaystack.verifyPayment);
router.route("/").post(HostPlan.initializePayment).get(HostPlan.getAllHostPlan);
router
  .route("/:hostPlanId")
  .get(HostPlan.getOneHostPlan)
  .put(HostPlan.updateHostPlan);
module.exports = router;
