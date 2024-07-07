const jwt = require("jsonwebtoken");
const db = require("../../models");
const payouts = require("./payoutMiddleware");
const TransferRecipient = db.transferRecipient;
const Workshop = db.workshops;
const WorkshopTicket = db.workshopTickets;
const HostPlan = db.hostPlans;
const secretKey = process.env.JWT_SECRET;
const Recipient = db.Recipient;
const withdrawableAmount = 0;
const paystackKey = process.env.PAYSTACK_TEST_KEY;

exports.workshopPayout = async (req, res) => {
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

  const workshopId = req.params.id;
  const workshop = await Workshop.findOne({ where: { id: workshopId } });
  if (!workshop) {
    return res.status(404).json({ msg: "No workshop with that Id" });
  }

  const tickets = await WorkshopTicket.findAll({
    where: { workshopId, ticketStatus: "ACTIVE" },
  });
  const price = workshop.price;
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
    const workshopComission = (8 / 100) * totalAmount;
    const availableAmount = totalAmount - workshopComission;
    if (amount > availableAmount) {
      return res.status(403).json({ msg: "Insufficient balance" });
    }

    await payouts
      .createPayout(req, res, Recipient, paystackKey, reference)
      .then((response) => console.log(response))
      .catch((err) => console.log(err));
    // return res.status(200).json({
    //   success: {
    //     plan: plan.subscription,
    //     totalTickets: totalTickets,
    //     totalAmount: totalAmount,
    //     comissions: 8,
    //     withdrawableAmount: availableAmount,
    //   },
    // });
  }
};
