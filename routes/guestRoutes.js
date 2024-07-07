const express = require("express");
const router = express.Router();

const guestController = require("../controllers/guestController");
const verifyPay = require("../controllers/guestVerifyTickets");
const hostAuth = require("../controllers/hostAuthController");

router.post("/book/class-ticket", guestController.guestClassTicket);
router.post("/book/workshop-ticket", guestController.guestWorkshopTicket);
router.post("/book/package-ticket", guestController.guestPackageTicket);
router.post("/book/experience-ticket", guestController.guestExperienceTicket);
router.get("/class-tickets/verify", verifyPay.verifyClassPayment);
router.get("/workshop-tickets/verify", verifyPay.verifyWorkshopPayment);
router.get("/package-tickets/verify", verifyPay.verifyPackagePayment);
router.get("/experience-tickets/verify", verifyPay.verifyExperiencePayment);
router.route("/").get(hostAuth.hostProtect, guestController.getAllGuests);

router
  .route("/:id")
  .put(guestController.updateGuest)
  .get(guestController.getGuest)
  .delete(guestController.deleteGuest);
module.exports = router;
