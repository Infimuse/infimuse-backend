const jwt = require("jsonwebtoken");
const classBalance = require("./classPayout");
const db = require("../../models");
const Workshop = db.workshops;
const WorkshopTicket = db.workshopTickets;
const PackageClasses = db.packageClasses;
const PackageTicket = db.packageTickets;
const ClassSession = db.classSessions;
const ClassTicket = db.classTickets;
const HostPlan = db.hostPlans;
const Wallet = db.wallets;
const jwtSecret = process.env.JWT_SECRET;

exports.overallPayouts = async (req, res) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Please login " });
  }

  const decodedToken = jwt.verify(token, jwtSecret);
  const hostId = decodedToken.id;

  const workshops = await Workshop.findAll({ where: { hostId } });
  if (!workshops) {
    return res.status(404).json({ error: "No Docs found" });
  }
  const workshopIds = workshops.map((workshop) => workshop.id);
  const workshopTickets = await WorkshopTicket.findAll({
    where: { workshopId: workshopIds, ticketStatus: "ACTIVE" },
  });

  const packages = await PackageClasses.findAll({ where: { hostId } });
  if (!packages) {
    return res.status(404).json({ error: "No Docs found" });
  }
  const packageIds = packages.map((package) => package.id);
  const packageTickets = await PackageTicket.findAll({
    where: { packageClassId: packageIds, ticketStatus: "ACTIVE" },
  });

  const classSessions = await ClassSession.findAll({ where: { hostId } });
  if (!classSessions) {
    return res.status(404).json({ error: "No Docs found" });
  }
  const classIds = packages.map((classes) => classes.id);

  const classTickets = await ClassTicket.findAll({
    where: { sessionClassId: classIds, ticketStatus: "ACTIVE" },
  });

  const workshopPrices = workshops.map((workshop) => workshop.price);
  const packagePrices = packages.map((package) => package.price);
  const classPrices = classSessions.map((classes) => classes.price);

  const totalWorkshopMoney = workshopPrices.reduce(
    (acc, price) => price * workshopTickets.length,
    0
  );
  const totalPackageMoney = packagePrices.reduce(
    (acc, price) => price * packageTickets.length,
    0
  );

  const totalClassMoney = classPrices.reduce(
    (acc, price) => price * classTickets.length,
    0
  );

  const plan = await HostPlan.findOne({ where: { hostId } });

  if (plan.subscription === "FreePlan") {
    const totalAvailableAmount =
      totalClassMoney + totalPackageMoney + totalWorkshopMoney;
    const commisionAmount = (totalAvailableAmount * 8) / 100;
    const totalWalletMoney = totalAvailableAmount - commisionAmount;

    const hostWallet = await Wallet.findOne({
      where: {
        hostId,
      },
    });
    if (!hostWallet) {
      const newWallet = await Wallet.create({
        hostId,
        walletAmount: totalWalletMoney,
      });
      // Optionally, you can return the newly created wallet
      return res.status(200).json({ msg: { wallet: newWallet } });
    } else {
      if (hostWallet.walletMoney === null) {
        await hostWallet.update({ walletAmount: 0 }, { where: { hostId } });
      }
      const newBalance = hostWallet.walletAmount + totalWalletMoney;
      await Wallet.update({ walletAmount: newBalance }, { where: { hostId } });

      await WorkshopTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { workshopId: workshopIds, ticketStatus: "ACTIVE" } }
      );

      await ClassTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { sessionClassId: classIds, ticketStatus: "ACTIVE" } }
      );

      await PackageTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { packageClassId: packageIds, ticketStatus: "ACTIVE" } }
      );
    }

    return res.status(200).json({
      msg: {
        availableBalance: hostWallet.walletAmount,
      },
    });
  } else if (plan.subscription === "Growth") {
    const totalAvailableAmount =
      totalClassMoney + totalPackageMoney + totalWorkshopMoney;
    const commisionAmount = (totalAvailableAmount * 5) / 100;
    const totalWalletMoney = totalAvailableAmount - commisionAmount;
    const hostWallet = await Wallet.findOne({
      where: {
        hostId,
      },
    });
    if (!hostWallet) {
      const newWallet = await Wallet.create({
        hostId,
        walletAmount: totalWalletMoney,
      });
      // Optionally, you can return the newly created wallet
      return res.status(200).json({ msg: { wallet: newWallet } });
    } else {
      if (hostWallet.walletMoney === null) {
        await hostWallet.update({ walletAmount: 0 }, { where: { hostId } });
      }
      const newBalance = hostWallet.walletAmount + totalWalletMoney;
      await Wallet.update({ walletAmount: newBalance }, { where: { hostId } });

      await WorkshopTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { workshopId: workshopIds, ticketStatus: "ACTIVE" } }
      );

      await ClassTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { sessionClassId: classIds, ticketStatus: "ACTIVE" } }
      );

      await PackageTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { packageClassId: packageIds, ticketStatus: "ACTIVE" } }
      );
    }

    return res.status(200).json({
      msg: {
        availableBalance: hostWallet.walletAmount,
      },
    });
  } else if (plan.subscription === "Professional") {
    const totalAvailableAmount =
      totalClassMoney + totalPackageMoney + totalWorkshopMoney;
    const commisionAmount = (totalAvailableAmount * 2.9) / 100;
    const totalWalletMoney = totalAvailableAmount - commisionAmount;
    const hostWallet = await Wallet.findOne({
      where: {
        hostId,
      },
    });
    if (!hostWallet) {
      const newWallet = await Wallet.create({
        hostId,
        walletAmount: totalWalletMoney,
      });
      return res.status(200).json({ msg: { wallet: newWallet } });
    } else {
      if (hostWallet.walletMoney === null) {
        await hostWallet.update({ walletAmount: 0 }, { where: { hostId } });
      }
      const newBalance = hostWallet.walletAmount + totalWalletMoney;
      await Wallet.update({ walletAmount: newBalance }, { where: { hostId } });

      await WorkshopTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { workshopId: workshopIds, ticketStatus: "ACTIVE" } }
      );

      await ClassTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { sessionClassId: classIds, ticketStatus: "ACTIVE" } }
      );

      await PackageTicket.update(
        { ticketStatus: "COMPLETE" },
        { where: { packageClassId: packageIds, ticketStatus: "ACTIVE" } }
      );
    }

    return res.status(200).json({
      msg: {
        availableBalance: hostWallet.walletAmount,
      },
    });
  }
};
