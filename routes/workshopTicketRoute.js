const express = require("express");
const router = express.Router();
const workshopTicketController = require("../controllers/workshopTicket");
const hostAuthController = require("./../controllers/hostAuthController");
const authController = require("./../controllers/authController");

router.post("/cancelticket/:ticketId", workshopTicketController.cancelTicket);
router.get("/verify", workshopTicketController.verifyPayment);
router.post("/scan", workshopTicketController.ticketScan);

router
  .route("/")
  .get(
    hostAuthController.hostProtect,
    workshopTicketController.getAllWorkshopTickets
  )
  .post(
    authController.customerProtect,
    workshopTicketController.initializeBookingPayment
  );

router
  .route("/:id")
  .put(
    hostAuthController.hostProtect,
    workshopTicketController.updateWorkshopTicket
  )
  .get(workshopTicketController.getWorkshopTicket)
  .delete(
    hostAuthController.hostProtect,
    workshopTicketController.deleteWorkshopTicket
  );
module.exports = router;
