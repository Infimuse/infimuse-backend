const jwt = require("jsonwebtoken");
const db = require("../../models");
const WorkshopTicket = db.workshopTickets;
const PackageTicket = db.packageTickets;
const ExperienceTicket = db.experienceTickets;
const ClassTicket = db.classTickets;
const HostPlan = db.hostPlans;
const Wallet = db.wallets;
const jwtSecret = process.env.JWT_SECRET;
const DSTTax = process.env.DST_TAX;

exports.overallPayouts = async (req, res) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Please login " });
    }
    const decodedToken = jwt.verify(token, jwtSecret);
    const hostId = decodedToken.id;

    // Fetch all active tickets (Workshop, Package, Experience, and Class Tickets)
    const workshopTickets = await WorkshopTicket.findAll({
      where: {
        hostId,
        ticketStatus: "ACTIVE",
      },
    });

    const packageTickets = await PackageTicket.findAll({
      where: {
        hostId,
        ticketStatus: "ACTIVE",
      },
    });

    const experienceTickets = await ExperienceTicket.findAll({
      where: {
        hostId,
        ticketStatus: "ACTIVE",
      },
    });

    const classTickets = await ClassTicket.findAll({
      where: {
        hostId,
        ticketStatus: "ACTIVE",
      },
    });

    // Sum the amount for all tickets
    const totalWorkshopAmount = workshopTickets.reduce(
      (acc, ticket) => acc + ticket.amount,
      0
    );
    const totalPackageAmount = packageTickets.reduce(
      (acc, ticket) => acc + ticket.amount,
      0
    );
    const totalExperienceAmount = experienceTickets.reduce(
      (acc, ticket) => acc + ticket.amount,
      0
    );
    const totalClassAmount = classTickets.reduce(
      (acc, ticket) => acc + ticket.amount,
      0
    );

    const totalAmount =
      totalWorkshopAmount +
      totalPackageAmount +
      totalExperienceAmount +
      totalClassAmount;

    const plan = await HostPlan.findOne({ where: { hostId } });

    // Update or create the host's wallet
    let hostWallet = await Wallet.findOne({ where: { hostId } });
    if (!hostWallet) {
      hostWallet = await Wallet.create({
        hostId,
        walletAmount: totalAmount,
      });
    } else {
      const newBalance = (hostWallet.walletAmount || 0) + totalAmount;
      await hostWallet.update({ walletAmount: newBalance });
    }

    // Update all active tickets to 'COMPLETE'
    const updateTicketStatus = async (tickets) => {
      await Promise.all(
        tickets.map(async (ticket) => {
          await ticket.update({ ticketStatus: "COMPLETE" });
        })
      );
    };

    // Update the ticket status for each type
    await updateTicketStatus(workshopTickets);
    await updateTicketStatus(packageTickets);
    await updateTicketStatus(experienceTickets);
    await updateTicketStatus(classTickets);

    return res.status(200).json({
      msg: {
        availableBalance: hostWallet.walletAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};
