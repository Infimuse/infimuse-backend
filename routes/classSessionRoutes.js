const express = require("express");
const router = express.Router();
const hostAuthController = require("./../controllers/hostAuthController");
const roleRestrict = require("./../utils/midlewares/classSessionMiddleware");
const classSession = require("../controllers/classSessionController");
// const classPayout = require("./../utils/midlewares/classPayout");
// router.post("/:id/payouts", classPayout.classPayout);

router.post("/rating/:classId", classSession.rateClass);
router.get("/book/:classId", classSession.initializeBookingPayment);
router.get("/ticket/verify", classSession.verifyPayment);
router.get("/chat-room/:classId", classSession.verifyChatRoom);
router.get("/upcoming", classSession.getUpcoming);
router.get("/history", classSession.getHistory);
router.post("/:classSession/comments", classSession.classSessionComments);
// router.post("/cancelticket/:ticketId", classSession.cancelTicket);
router.get("/enriching", classSession.getEnriching);
router.get("/learning", classSession.getLearning);
router.get("/sipping", classSession.getSipping);
router.get("/kids", classSession.getKids);

router
  .route("/distances/:distance/center/:latlng/unit/:unit")
  .get(classSession.getWithin);
router
  .route("/")
  .post(
    roleRestrict,
    hostAuthController.hostProtect,

    classSession.createClassSession
  )
  .get(classSession.getAllClassSession);
router
  .route("/:id")
  .get(classSession.getOneClassSession)
  .put(hostAuthController.hostProtect, classSession.updateClassSession)
  .delete(hostAuthController.hostProtect, classSession.deleteClassSession);
module.exports = router;
