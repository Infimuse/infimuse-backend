const express = require("express");
const router = express.Router();
const hostAuthController = require("./../controllers/hostAuthController");
const roleRestrict = require("./../utils/midlewares/experienceMiddleware");
const freeLimitCheck = require("./../utils/midlewares/restrictFreeSessions");
const freeClassSession = require("../controllers/freeExperience");
const classSessionTicket = require("../controllers/classTicketController");

router
  .route("/")
  .post(
    roleRestrict,
    hostAuthController.hostProtect,
    freeLimitCheck.checkListedFreeSessions,
    freeClassSession.createClassSession
  );

module.exports = router;
