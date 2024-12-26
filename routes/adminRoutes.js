const express = require("express");
const router = express.Router();
const adminController = require("./../controllers/admin");
const roleRestrict = require("../controllers/admin").verifyAdmin;
const customer = require("../controllers/customerController");
const hosts = require("../controllers/hostController");

router.route("/").post(adminController.adminSignup);
router.route("/login").post(adminController.adminLogin);
router.route("/hosts").get(roleRestrict, hosts.getAllHost);
router.route("/customers").get(roleRestrict, customer.getAllCustomers);
router.route("/users").get(roleRestrict, adminController.searchSpecifcUser);
router
  .route("/subscriptions")
  .get(roleRestrict, adminController.getMonthlySubs);

router
  .route("/getMonthlySubsDetails")
  .get(roleRestrict, adminController.getMonthlySubsDetails);

router
  .route("/getWorkshopMonthlyTickets")
  .get(roleRestrict, adminController.workshopsMonthlyTickets);

router
  .route("/monthlyTicketsReport")
  .get(roleRestrict, adminController.getDetailedMonthlyReport);

router
  .route("/subscriptionsVAT")
  .get(roleRestrict, adminController.calculateSubsVat);
router
  .route("/infimuse-account")
  .get(roleRestrict, adminController.overallMonthlyRevenue);

router.route("/monthlyDst").get(roleRestrict, adminController.monthlyDst);
module.exports = router;
