const express = require("express");
const router = express.Router();
const experienceTicketController = require("../controllers/experienceTicket");
const authController = require("./../controllers/authController");
const hostAuthController = require("./../controllers/hostAuthController");

router.post("/cancelticket/:ticketId", experienceTicketController.cancelTicket);
router.get("/verify", experienceTicketController.verifyPayment);
router.post("/scan", experienceTicketController.ticketScan);
router
  .route("/")
  .get(
    authController.customerProtect,
    experienceTicketController.getAllExperienceTickets
  )
  .post(
    authController.customerProtect,
    experienceTicketController.initializeBookingPayment
  );

router
  .route("/:id")
  .put(
    hostAuthController.hostProtect,
    experienceTicketController.updateExperienceTicket
  )
  .get(experienceTicketController.getExperienceTicket)
  .delete(
    hostAuthController.hostProtect,
    experienceTicketController.deleteExperienceTicket
  );
module.exports = router;
