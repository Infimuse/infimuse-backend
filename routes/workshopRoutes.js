const express = require("express");
const authController = require("./../controllers/authController");
const router = express.Router();
const workshopController = require("../controllers/workshopController");
const workshopTicketController = require("../controllers/workshopTicket");
const hostAuthController = require("./../controllers/hostAuthController");
const roleRestrict = require("../utils/midlewares/workshopMiddleware");

router.get("/book/:workshopId", workshopController.initializeBookingPayment);
router.get("/ticket/verify", workshopController.verifyPayment);
router.post("/rating/:workshopId", workshopController.rateClass);
router.post("/:workshopId/comments", workshopController.workshopComments);
router.get("/upcoming", workshopController.getUpcoming);
router.get("/history", workshopController.getHistory);
// router.post("/:id/payouts", workshopPayout.workshopPayout);
router
  .route("/distances/:distance/center/:latlng/unit/:unit")
  .get(workshopController.getWithin);
router
  .route("/")
  .get(workshopController.getAllWorkshop)
  .post(
    hostAuthController.hostProtect,
    roleRestrict,
    workshopController.createWorkshop
  );

router
  .route("/:id")
  .get(workshopController.getWorkshop)
  .put(hostAuthController.hostProtect, workshopController.updateWorkshop)
  .delete(hostAuthController.hostProtect, workshopController.deleteWorkshop);

module.exports = router;
