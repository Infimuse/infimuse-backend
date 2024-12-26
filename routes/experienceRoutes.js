const express = require("express");
const router = express.Router();
const hostAuthController = require("./../controllers/hostAuthController");
const experience = require("../controllers/experienceController");
const experienceTicketController = require("../controllers/experienceTicket");

const roleRestrict = require("./../utils/midlewares/experienceMiddleware");
const experienceTicket = require("../models/experienceTicket");
router.post("/rating/:experienceId", experience.rateClass);
router.get("/book/:experienceId", experience.initializeBookingPayment);
router.get("/ticket/verify", experience.verifyPayment);
router.post("/:experienceId/scan", experienceTicketController.ticketScan);
router.post("/:experience/comments", experience.ExperienceComments);
// router.post("/cancelticket/:ticketId", experience.cancelTicket);
router.get("/upcoming", experience.getUpcoming);
router.get("/history", experience.getHistory);

router
  .route("/distances/:distance/center/:latlng/unit/:unit")
  .get(experience.getWithin);
router
  .route("/")
  .post(
    hostAuthController.hostProtect,
    roleRestrict,
    experience.createExperience
  )
  .get(experience.getAllExperience);
router
  .route("/:id")
  .get(experience.getOneExperience)
  .put(hostAuthController.hostProtect, experience.updateExperience)
  .delete(hostAuthController.hostProtect, experience.deleteExperience);
module.exports = router;
