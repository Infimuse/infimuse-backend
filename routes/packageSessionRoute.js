const express = require("express");
const router = express.Router();
const packageSessionController = require("./../controllers/packageSessionController");
const hostAuthController = require("./../controllers/hostAuthController");
const packageTicket = require("./../controllers/packageTicketController");

router.post(
  "/:packageSessionId/comments",
  packageSessionController.packageSessionComments
);
router.post("/:packageClassId/scan", packageTicket.ticketScan);

router
  .route("/")
  .get(packageSessionController.getAllPackageSessions)
  .post(
    hostAuthController.hostProtect,
    packageSessionController.createPackageSession
  );

router
  .route("/:id")
  .get(packageSessionController.getOnePackageSession)
  .put(
    hostAuthController.hostProtect,
    packageSessionController.updatePackageSession
  )
  .delete(
    hostAuthController.hostProtect,
    packageSessionController.deletePackageSession
  );

module.exports = router;
