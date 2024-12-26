const express = require("express");
const router = express.Router();
const classTicketController = require("../controllers/classTicketController");
const authController = require("./../controllers/authController");
const hostAuthController = require("./../controllers/hostAuthController");

router.post("/cancelticket/:ticketId", classTicketController.cancelTicket);
router.post("/scan", classTicketController.ticketScan);
router.post("/grouptickets", classTicketController.createGroupTicket);

router
  .route("/")
  .get(authController.customerProtect, classTicketController.getAllClassTickets)
  .post(
    authController.customerProtect,
    classTicketController.initializeBookingPayment
  );
router.get("/verify", classTicketController.verifyPayment);
router.post("/free", classTicketController.createFreeClassTickets);

router
  .route("/:id")
  .put(hostAuthController.hostProtect, classTicketController.updateClassTicket)
  .get(classTicketController.getClassTicket)
  .delete(
    hostAuthController.hostProtect,
    classTicketController.deleteClassTicket
  );
module.exports = router;
