const express = require("express");
const router = express.Router();

const RefundTicket = require("../controllers/refundTicketController");

router
  .route("/")
  .post(RefundTicket.createRefundTicket)
  .get(RefundTicket.getAllRefundTicket);
router
  .route("/:id")
  .get(RefundTicket.getOneRefundTicket)
  .put(RefundTicket.updateRefundTicket)
  .delete(RefundTicket.deleteRefundTicket);
module.exports = router;
