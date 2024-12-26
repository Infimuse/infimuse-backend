const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff");
const staffPermission = require("../controllers/staffPermissions");
const staffDashboard = require("../controllers/staffDashboard");

router.post("/login", staffController.staffLogin);
router.post("/signup", staffController.staffSignup);
router.post("/forgotPassword", staffController.forgotPassword);
router.put("/resetPassword/:token", staffController.resetPassword);
router.route("/").get(staffController.getAllStaffs);

router.route("/staffListings").get(staffPermission.checkStaffListings);
// get all asigned listings
router.route("/dashboard/:hostId").get(staffDashboard.getAllListingsAssigned);
router.route("/my-hosts").get(staffDashboard.getAllMyHosts);
router.route("/workshops/:workshopId").get(staffDashboard.getOneWorkshop);
router.route("/experiences/:experienceId").get(staffDashboard.getOneExperience);
router
  .route("/classSessions/:classSessionId")
  .get(staffDashboard.getOneClassSession);
router
  .route("/packageClasses/:packageClassId")
  .get(staffDashboard.getOnePackage);

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
  .route("/experiences/:experienceId")
  .post(staffPermission.checkStaffPermissionAndCreateExperience);
router
  .route("/:id")
  .delete(staffController.deleteStaff)
  .put(staffController.updateStaff);

module.exports = router;
