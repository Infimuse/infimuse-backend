const express = require("express");
const router = express.Router();
const packageclassController = require("../controllers/packageClassController");
const hostAuthController = require("./../controllers/hostAuthController");
const roleRestrict = require("./../utils/midlewares/packageClassMiddleware");
// const payout = require("./../utils/midlewares/packagePayout");

router.get(
  "/book/:packageClassId",
  packageclassController.initializeBookingPayment
);
router.post("/rating/:packageClassId", packageclassController.rateClass);
router.get("/ticket/verify", packageclassController.verifyPayment);
router.post(
  "/:packageClassId/comments",
  packageclassController.packageClassComments
);
router.get("/upcoming", packageclassController.getUpcoming);
router.get("/history", packageclassController.getHistory);
// router.post("/:id/payouts", payout.packagePayout);

router
  .route("/distances/:distance/center/:latlng/unit/:unit")
  .get(packageclassController.getWithin);

router
  .route("/")
  .get(packageclassController.getAllPackageClass)
  .post(
    hostAuthController.hostProtect,
    roleRestrict,
    packageclassController.createPackageClass
  );

router
  .route("/:id")
  .get(packageclassController.getPackageClass)
  .put(
    hostAuthController.hostProtect,
    packageclassController.updatePackageClass
  )
  .delete(
    hostAuthController.hostProtect,
    packageclassController.deletePackageClass
  );

module.exports = router;
