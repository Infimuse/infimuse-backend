const jwt = require("jsonwebtoken");
const db = require("../../models");
const payouts = require("./payoutMiddleware");
const TransferRecipient = db.transferRecipient;
const ClassSession = db.classSessions;
const ClassTicket = db.classTickets;
const HostPlan = db.hostPlans;
const secretKey = process.env.JWT_SECRET;
const Recipient = db.Recipient;
const paystackKey = process.env.PAYSTACK_TEST_KEY;
const withdrawableAmount = 0;

exports.classPayout = async (req, res) => {
  const amount = req.body.amount;
  const reference = req.body.reference;
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ msg: "Please login to proceed with the payouts" });
  }

  const verifyToken = jwt.verify(token, secretKey);
  const hostId = verifyToken.id;

  const plan = await HostPlan.findOne({ where: { hostId } });

  const classId = req.params.id;
  const classSession = await ClassSession.findOne({ where: { id: classId } });
  if (!classSession) {
    return res.status(404).json({ msg: "No class with that Id" });
  }

  const tickets = await ClassTicket.findAll({
    where: { sessionClassId: classId, ticketStatus: "ACTIVE" },
  });
  const price = classSession.price;
  const totalTickets = tickets.length;
  const totalAmount = price * totalTickets;
  if (totalAmount < withdrawableAmount) {
    return res.status(403).json({
      msg: `minimum withdrawable amount is ${withdrawableAmount} ksh `,
    });
  }

  const transferList = await TransferRecipient.findOne({ where: { hostId } });
  if (!transferList) {
    return res.status(404).json({
      msg: "Unfortunately you have to be in the transfer recipient list",
    });
  }

  if (plan.subscription === "FreePlan") {
    const packageCommision = (8 / 100) * totalAmount;
    const availableAmount = totalAmount - packageCommision;
    if (amount > availableAmount) {
      return res.status(403).json({ msg: "Insufficient balance" });
    }

    return availableAmount;
  }
};
