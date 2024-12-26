const express = require("express");
const router = express.Router();

const HostPlan = require("../controllers/hostPlanController");
const updatePaystack = require("../controllers/paystackUpdateApi");

router.get("/growthPlan/verify", HostPlan.verifyGrowthPayment);
router.get("/proPlan/verify", HostPlan.verifyProPayment);
router.get("/updatePayment", updatePaystack.verifyPayment);
router.route("/").get(HostPlan.getAllHostPlan);
router.route("/growthPlan").post(HostPlan.initializeGrowthPayment);
router.route("/freePlan").post(HostPlan.initializePayment);
router.route("/professionalPlan").post(HostPlan.initializeProPayment);
router.route("/deactivate-plan").delete(HostPlan.deletePlan);
router.route("/:hostPlanId").get(HostPlan.getOneHostPlan);
router
  .route("/growth/update")
  .post(HostPlan.deletePlan, HostPlan.initializeGrowthPayment);
router
  .route("/pro/update")
  .post(HostPlan.deletePlan, HostPlan.initializeProPayment);
router.route("/:hostPlanId").get(HostPlan.getOneHostPlan);
// .put(HostPlan.updateHostPlan);
module.exports = router;
