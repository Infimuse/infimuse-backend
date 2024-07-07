const express = require("express");
const router = express.Router();
const workshopClassController = require("../controllers/workshopClassController");
const hostAuthController = require("./../controllers/hostAuthController");
// const roleRestrict = require("./../utils/midlewares/workshopClassMiddleware");

router.post(
  "/:workshopClassId/comments",
  workshopClassController.workshopClassComents
);

router
  .route("/")
  .get(workshopClassController.getAllWorkshopClass)
  .post(
    hostAuthController.hostProtect,
    workshopClassController.createWorkshopClass
  );

router
  .route("/:id")
  .get(workshopClassController.getOneWorkshopClass)
  .put(
    hostAuthController.hostProtect,
    workshopClassController.updateWorkshopClass
  )
  .delete(
    hostAuthController.hostProtect,
    workshopClassController.deleteWorkshopClass
  );

module.exports = router;
