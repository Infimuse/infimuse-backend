const express = require("express");
const router = express.Router();
const packageSessionController = require("./../controllers/packageSessionController");
const hostAuthController = require("./../controllers/hostAuthController");
// const roleRestrict = require("./../utils/midlewares/packageSessionMiddleware");

router.post(
  "/:packageSessionId/comments",
  packageSessionController.packageSessionComments
);

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
