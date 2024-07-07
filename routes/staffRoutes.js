const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff");
const staffPermission = require("../controllers/staffPermissions");

router.post("/login", staffController.staffLogin);
router.post("/signup", staffController.staffSignup);
router.post("/forgotPassword", staffController.forgotPassword);
router.put("/resetPassword/:token", staffController.resetPassword);
router.route("/").get(staffController.getAllStaffs);

router.route("/staffListings").get(staffPermission.checkStaffListings);

// staff managing the assigned listing
router
  .route("/workshops/:workshopId")
  .post(staffPermission.checkStaffPermissionAndCreateWorkshop);
router
  .route("/packages/:packageClassId")
  .post(staffPermission.checkStaffPermissionAndCreatePackage);

router
  .route("/classes/:classSessionId")
  .post(staffPermission.checkStaffPermissionAndCreateClassSession);
router
  .route("/:id")
  .delete(staffController.deleteStaff)
  .put(staffController.updateStaff);

module.exports = router;
