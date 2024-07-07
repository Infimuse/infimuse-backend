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

// host authentication
router.post("/signup", hostAuth.hostSignup);
router.post("/login", hostAuth.hostLogin);
router.post("/forgotPassword", hostAuth.forgotPassword);
router.put("/resetPassword/:token", hostAuth.resetPassword);
router.post("/google-email", hostAuth.checkHostEmail);

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

// host inviting a staff
router.route("/invite-staff").post(hostDashboard.inviteStaff);
router.route("/my-staff").get(hostDashboard.getAllMyStaff);

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
module.exports = router;
