const express = require("express");
const router = express.Router();
const packageTicketController = require("../controllers/packageTicketController");
const hostAuthController = require("./../controllers/hostAuthController");
const authController = require("./../controllers/authController");

router.post("/cancelticket/:ticketId", packageTicketController.cancelTicket);
router.get("/verify", packageTicketController.verifyPayment);
router.post("/scan", packageTicketController.ticketScan);
router.post("/free", packageTicketController.createFreePackageTickets);

router
  .route("/")
  .get(packageTicketController.getAllPackageTickets)
  .post(
    authController.customerProtect,
    packageTicketController.initializeBookingPayment
  );

router
  .route("/:id")
  .put(packageTicketController.updatePackageTicket)
  .get(packageTicketController.getPackageTicket)
  .delete(
    hostAuthController.hostProtect,
    packageTicketController.deletePackageTicket
  );
module.exports = router;
