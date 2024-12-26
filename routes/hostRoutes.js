const express = require("express");
const router = express.Router();

const hostController = require("../controllers/hostController");
const hostAuth = require("../controllers/hostAuthController");
const hostDashboard = require("./../controllers/hostDashboard");
const workshopTemplate = require("../controllers/workshopTemplate");
const packageTemplate = require("../controllers/packageTemplate");
const classSessionTemplate = require("../controllers/classSessionTemplate");
const hostFactory = require("../controllers/hostFactory");
const createTemplate = require("../controllers/createTemplates");
const assignListing = require("../controllers/assignListing");
const ratingController = require("../controllers/rating");
const freeClassSession = require("../controllers/freeClassSession");

// host authentication
router.post("/signup", hostAuth.hostSignup);
router.post("/login", hostAuth.hostLogin);
router.post("/forgotPassword", hostAuth.forgotPassword);
router.put("/resetPassword/:token", hostAuth.resetPassword);
router.post("/google-email", hostAuth.checkHostEmail);

// assign templates
router.route("/workshops").post(assignListing.inviteStaffToWorkshop);
router.route("/classSessions").post(assignListing.inviteStaffToClassSession);
router.route("/experiences").post(assignListing.inviteStaffToExperience);
router.route("/packageClasses").post(assignListing.inviteStaffToPackages);
// create templates
router
  .route("/workshops/:workshopId")
  .post(createTemplate.CreateWorkshopTemplate);
router.route("/packages/:packageClassId").post(createTemplate.createPackage);
router
  .route("/classes/:classSessionId")
  .post(createTemplate.createClassSession);
// host Dashboard
router.route("/dashboard").get(hostDashboard.fetchHostDashboard);
router.route("/upcoming").get(hostDashboard.getMyUpcoming);
router.route("/history").get(hostDashboard.getMyHistory);

// host inviting a staff
router.route("/invite-staff").post(hostDashboard.inviteStaff);
router.route("/my-staff").get(hostDashboard.getAllMyStaff);
router.route("/accept-invite/:inviteId").get(hostDashboard.acceptInvite);

// host listings only for get
router.route("/workshops").get(hostFactory.getHostWorkshops);
router.route("/packages").get(hostFactory.getHostPackageClasses);
router.route("/classes").get(hostFactory.getHostClassSession);

// using the templates to create a Listing
router.route("/workshopTemplate/:id").get(workshopTemplate.createTemplates);
router.route("/packageTemplate/:id").get(packageTemplate.createTemplates);
router
  .route("/classSessionTemplate/:id")
  .get(classSessionTemplate.createTemplates);
router.route("/").get(hostController.getAllHost);

router
  .route("/:id")
  .put(hostController.updateHost)
  .get(hostController.getHost)
  .delete(hostController.deleteHost);

router.post("/:hostId/rate", ratingController.createRating);

// Free classes

module.exports = router;
