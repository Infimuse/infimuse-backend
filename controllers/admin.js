const jwt = require("jsonwebtoken");
const db = require("./../models");
const bcrypt = require("bcryptjs");
const Admin = db.admins;
const { fn, col } = require("sequelize");
const { promisify } = require("util");
const sequelize = require("sequelize");
const Email = require("../utils/email");
const admin = require("../models/admin");
const compare = require("secure-compare");
const crypto = require("crypto");
const Customer = db.customers;
const Host = db.hosts;
const Staff = db.staffs;
const DST = db.DST;
const Withdrawal = db.withdrawals;
const InfimuseAccount = db.InfimuseAccount;
const WorkshopTicket = db.workshopTickets;
const ClassTicket = db.classTickets;
const PackageTicket = db.packageTickets;
const ExperienceTicket = db.experienceTickets;
const PackageClass = db.packageClasses;
const ClassSession = db.classSessions;
const Experience = db.experiences;
const Workshop = db.workshops;
const HostPlan = db.hostPlans;
const { Op } = require("sequelize");
const MonthlySubsRecord = db.monthlySubsRecord;
const moment = require("moment");
const withdrawal = require("../models/withdrawal");
const Commission = db.commissions;
const Wallet = db.wallets;
const MonthlyRevenue = db.monthlyRevenue;
const residentRate = process.env.CORPORATE_RESIDENT_RATE;
const nonResidentRate = process.env.CORPORATE_NUNRESIDENT_RATE;
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

const comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    return bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};
const compareOTP = async (userInputOTP, storedOTP) => {
  if (!compare(userInputOTP, storedOTP)) {
    throw new Error("Incorrect OTP");
  }
};

exports.adminSignup = async (req, res, next) => {
  try {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(403)
        .json({ error: "please provide the email/password" });
    }
    const existingadmin = await Admin.findOne({ where: { email } });

    if (existingadmin) {
      return res.status(401).json({ msg: "Admin exists" });
    }

    const newadmin = await Admin.create({
      firstName,
      email,
      password,
    });

    const token = signToken(newadmin.id);
    const url = newadmin.OTP;

    res
      .status(201)
      .json({ message: "admin created successfully", token, newadmin });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
  next();
};

exports.adminLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const OTP = req.body.OTP;

    if (!email || !password) {
      return next(Error("please provide an email/password"));
    }
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const newAdmin = {
      firstName: admin.firstName,
      email: admin.email,
    };
    const url = admin.OTP;
    const isPasswordValid = await comparePasswords(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password/email" });
    }

    new Email(newAdmin, url).adminToken();

    if (!OTP) {
      return res.status(403).json({ error: "Otp required for admin login" });
    }
    await compareOTP(OTP, admin.OTP);
    const token = signToken(admin.id);
    const newOtp = crypto.randomBytes(3).toString("hex").toUpperCase();
    await admin.update({
      OTP: newOtp,
    });
    return res.status(200).json({ msg: "success", token });
  } catch (error) {
    return res.status(500).json({ Error: error.message });
  }
  next();
};

exports.verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ error: "You are not logged in as an admin" });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const admin = await Admin.findOne({ where: { id: decoded.id } });
    if (!admin) {
      return res.status(401).json({ error: "The user no longer exists" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.searchSpecifcUser = async (req, res) => {
  try {
    const email = req.body.email;

    const customer = await Customer.findOne({ where: { email } });
    const host = await Host.findOne({ where: { email } });
    const staff = await Staff.findOne({ where: { email } });

    let roles = [];
    if (customer) {
      const userCustomer = await Customer.findOne({ where: { email } });
      const customerId = userCustomer.id;

      const workshopBookings = await WorkshopTicket.findAll({
        where: { customerId },
      });
      const experienceBookings = await ExperienceTicket.findAll({
        where: { customerId },
      });
      const classBookings = await ClassTicket.findAll({
        where: { customerId },
      });
      const packageClassBookings = await PackageTicket.findAll({
        where: { customerId },
      });

      roles.push({
        role: "Customer",
        firstName: customer.firstName,
        email: customer.email,
        phone: customer.phone,
        workshopTicketsBought: workshopBookings.length,
        experienceTicketsBought: experienceBookings.length,
        classTicketsBought: classBookings.length,
        packageClassTicketsBought: packageClassBookings.length,
      });
    }
    if (host) {
      const userHost = await Host.findOne({ where: { email } });
      const hostId = userHost.id;
      const workshopCreated = await Workshop.findAll({
        where: { hostId },
      });
      const experienceCreated = await Experience.findAll({
        where: { hostId },
      });
      const classCreated = await ClassSession.findAll({
        where: { hostId },
      });
      const packageClassCreated = await PackageClass.findAll({
        where: { hostId },
      });
      roles.push({
        role: "Host",
        firstName: host.firstName,
        email: host.email,
        phone: host.phone,
        rating: host.rating,
        workshopCreated: workshopCreated.length,
        experienceCreated: experienceCreated.length,
        classCreated: classCreated.length,
        packageClassCreated: packageClassCreated.length,
      });
    }
    if (staff) {
      roles.push({
        role: "Staff",
        firstName: staff.firstName,
        email: staff.email,
        phone: staff.phone,
      });
    }

    if (roles.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ success: "User found", roles });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMonthlySubs = async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let monthlySubscriptions = {};

    for (let month = 0; month <= currentMonth; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 1);

      const subs = await MonthlySubsRecord.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },
      });

      let freePlanCount = 0;
      let growthPlanCount = 0;
      let professionalPlanCount = 0;
      let overallSubs = 0;
      let freePlanRevenue = 0;
      let growthPlanRevenue = 0;
      let professionalPlanRevenue = 0;
      let overallRevenue = 0;

      subs.forEach((sub) => {
        overallSubs++;
        switch (sub.plan) {
          case "free":
            freePlanCount++;
            freePlanRevenue += sub.amount;
            break;
          case "growth":
            growthPlanCount++;
            growthPlanRevenue += sub.amount;
            break;
          case "professional":
            professionalPlanCount++;
            professionalPlanRevenue += sub.amount;
            break;
        }
        overallRevenue += sub.amount;
      });

      monthlySubscriptions[
        startDate.toLocaleString("default", { month: "long" })
      ] = {
        freePlan: freePlanCount,
        growthPlan: growthPlanCount,
        professionalPlan: professionalPlanCount,
        overallSubs: overallSubs,
        freePlanRevenue: freePlanRevenue,
        growthPlanRevenue: growthPlanRevenue,
        professionalPlanRevenue: professionalPlanRevenue,
        overallRevenue: overallRevenue,
      };
    }

    return res.status(200).json({ success: true, data: monthlySubscriptions });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getMonthlySubsDetails = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: "Please provide both 'month' and 'year' as query parameters.",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // End of the selected month

    const subs = await MonthlySubsRecord.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
    });

    let freePlanCount = 0;
    let growthPlanCount = 0;
    let professionalPlanCount = 0;
    let overallSubs = 0;
    let freePlanRevenue = 0;
    let growthPlanRevenue = 0;
    let professionalPlanRevenue = 0;
    let overallRevenue = 0;

    const details = subs.map((sub) => {
      overallSubs++;
      let planRevenue = 0;

      switch (sub.plan) {
        case "free":
          freePlanCount++;
          planRevenue = sub.amount;
          freePlanRevenue += planRevenue;
          break;
        case "growth":
          growthPlanCount++;
          planRevenue = sub.amount;
          growthPlanRevenue += planRevenue;
          break;
        case "professional":
          professionalPlanCount++;
          planRevenue = sub.amount;
          professionalPlanRevenue += planRevenue;
          break;
      }
      overallRevenue += planRevenue;

      return {
        id: sub.id,
        plan: sub.plan,
        amount: sub.amount,
        paymentReference: sub.paymentReference,
        expiresAt: sub.expiresAt,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        hostId: sub.hostId,
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        freePlanCount,
        growthPlanCount,
        professionalPlanCount,
        overallSubs,
        freePlanRevenue,
        growthPlanRevenue,
        professionalPlanRevenue,
        overallRevenue,
      },
      details: details,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.calculateSubsVat = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const monthlyDstTotals = [];

    for (let month = 0; month < new Date().getMonth() + 1; month++) {
      const startDate = moment([currentYear, month]).startOf("month").toDate();
      const endDate = moment([currentYear, month]).endOf("month").toDate();

      const totalMonthlyVat = await MonthlySubsRecord.sum("amount", {
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      const vatRate = 0.16;
      const totalToBePaid = vatRate * totalMonthlyVat;

      monthlyDstTotals.push({
        month: moment([currentYear, month]).format("MMMM"),
        totalSubsWorth: totalMonthlyVat,
        totalVAT: totalToBePaid || 0,
      });
    }

    return res.status(200).json({
      status: "success",
      year: currentYear,
      monthlyDstTotals,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.workshopsMonthlyTickets = async (req, res) => {
  try {
    const currentDate = new Date(Date.now());
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const report = {};
    monthNames.forEach((month) => {
      report[month] = {
        totalRevenue: 0,
        workshopRevenue: 0,
        experienceRevenue: 0,
        packageClassRevenue: 0,
        classSessionRevenue: 0,
      };
    });

    for (let monthIndex = 0; monthIndex <= currentMonth; monthIndex++) {
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);

      // Calculate workshop revenue
      const workshops = await Workshop.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: ["listingWorth"],
      });
      let monthTotalWorkshopRevenue = workshops.reduce(
        (total, workshop) => total + (workshop.listingWorth || 0),
        0
      );

      // Calculate experience revenue
      const experiences = await Experience.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: ["listingWorth"],
      });
      let monthTotalExperienceRevenue = experiences.reduce(
        (total, experience) => total + (experience.listingWorth || 0),
        0
      );

      // Calculate package class revenue
      const packageClasses = await PackageClass.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: ["listingWorth"],
      });
      let monthTotalPackageClassRevenue = packageClasses.reduce(
        (total, packageClass) => total + (packageClass.listingWorth || 0),
        0
      );

      // Calculate class session revenue
      const classSessions = await ClassSession.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
        attributes: ["listingWorth"],
      });
      let monthTotalClassSessionRevenue = classSessions.reduce(
        (total, classSession) => total + (classSession.listingWorth || 0),
        0
      );

      report[monthNames[monthIndex]].workshopRevenue =
        monthTotalWorkshopRevenue;
      report[monthNames[monthIndex]].experienceRevenue =
        monthTotalExperienceRevenue;
      report[monthNames[monthIndex]].packageClassRevenue =
        monthTotalPackageClassRevenue;
      report[monthNames[monthIndex]].classSessionRevenue =
        monthTotalClassSessionRevenue;

      report[monthNames[monthIndex]].totalRevenue =
        monthTotalWorkshopRevenue +
        monthTotalExperienceRevenue +
        monthTotalPackageClassRevenue +
        monthTotalClassSessionRevenue;
    }

    return res.status(200).json({
      year: currentYear,
      report,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getDetailedMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required." });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const detailedReport = {
      month: monthNames[month - 1],
      year: year,
      totalRevenue: 0,
      workshops: [],
      experiences: [],
      packageClasses: [],
      classSessions: [],
    };

    // Fetch and detail workshops
    const workshops = await Workshop.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "id",
        "title",
        "price",
        "boughtTickets",
        "listingWorth",
        "hostId",
      ],
    });

    let totalWorkshopRevenue = 0;
    workshops.forEach((workshop) => {
      totalWorkshopRevenue += workshop.listingWorth || 0;
      detailedReport.workshops.push({
        id: workshop.id,
        title: workshop.title,
        price: workshop.price,
        boughtTickets: workshop.boughtTickets,
        revenue: workshop.listingWorth || 0,
        hostId: workshop.hostId,
      });
    });

    // Fetch and detail experiences
    const experiences = await Experience.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "id",
        "title",
        "price",
        "boughtTickets",
        "listingWorth",
        "hostId",
      ],
    });

    let totalExperienceRevenue = 0;
    experiences.forEach((experience) => {
      totalExperienceRevenue += experience.listingWorth || 0;
      detailedReport.experiences.push({
        id: experience.id,
        title: experience.title,
        price: experience.price,
        boughtTickets: experience.boughtTickets,
        revenue: experience.listingWorth || 0,
        hostId: experience.hostId,
      });
    });

    // Fetch and detail package classes
    const packageClasses = await PackageClass.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "id",
        "title",
        "price",
        "boughtTickets",
        "listingWorth",
        "hostId",
      ],
    });

    let totalPackageClassRevenue = 0;
    packageClasses.forEach((packageClass) => {
      totalPackageClassRevenue += packageClass.listingWorth || 0;
      detailedReport.packageClasses.push({
        id: packageClass.id,
        title: packageClass.title,
        price: packageClass.price,
        boughtTickets: packageClass.boughtTickets,
        revenue: packageClass.listingWorth || 0,
        hostId: packageClass.hostId,
      });
    });

    // Fetch and detail class sessions
    const classSessions = await ClassSession.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "id",
        "title",
        "price",
        "boughtTickets",
        "listingWorth",
        "hostId",
      ],
    });

    let totalClassSessionRevenue = 0;
    classSessions.forEach((classSession) => {
      totalClassSessionRevenue += classSession.listingWorth || 0;
      detailedReport.classSessions.push({
        id: classSession.id,
        title: classSession.title,
        price: classSession.price,
        boughtTickets: classSession.boughtTickets,
        revenue: classSession.listingWorth || 0,
        hostId: classSession.hostId,
      });
    });

    // Calculate total revenue
    detailedReport.totalRevenue =
      totalWorkshopRevenue +
      totalExperienceRevenue +
      totalPackageClassRevenue +
      totalClassSessionRevenue;

    return res.status(200).json(detailedReport);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.monthlyDst = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const monthlyDstTotals = [];

    for (let month = 0; month < new Date().getMonth() + 1; month++) {
      const startDate = moment([currentYear, month]).startOf("month").toDate();
      const endDate = moment([currentYear, month]).endOf("month").toDate();

      const totalDstForMonth = await DST.sum("amount", {
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      });

      monthlyDstTotals.push({
        month: moment([currentYear, month]).format("MMMM"),
        totalDst: totalDstForMonth || 0,
      });
    }

    return res.status(200).json({
      status: "success",
      year: currentYear,
      monthlyDstTotals,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const formatDateForMySQL = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

exports.overallMonthlyRevenue = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Ensure month is in two-digit format
    const monthString = String(currentMonth).padStart(2, "0");

    // Construct startDate as the first day of the current month
    const formattedStartDate = `${currentYear}-${monthString}-01`;

    // Construct endDate as the last day of the current month
    const endDate = new Date(currentYear, currentMonth, 0); // Last day of the month
    const formattedEndDate = endDate.toISOString().split("T")[0];

    // Sum subscription total
    const subscriptionTotal = await InfimuseAccount.sum("amount", {
      where: {
        transactionType: "Subscription",
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const bookingTotal = await InfimuseAccount.sum("amount", {
      where: {
        transactionType: "Booking",
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const revenue = (subscriptionTotal || 0) + (bookingTotal || 0);

    // Sum other totals
    const totalDstForMonth = await DST.sum("amount", {
      where: {
        date: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });
    const subsVat = await MonthlySubsRecord.sum("VAT", {
      where: {
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const commissionsVat = await Commission.sum("VAT", {
      where: {
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const totalVatForMonth = subsVat + commissionsVat;

    const totalWalletForMonth = await Wallet.sum("walletAmount", {
      where: {
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const totalActiveClassTicketsAmount = await ClassTicket.sum("amount", {
      where: {
        ticketStatus: "ACTIVE",
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const totalActiveWorkshopTicketsAmount = await WorkshopTicket.sum(
      "amount",
      {
        where: {
          ticketStatus: "ACTIVE",
          createdAt: {
            [Op.between]: [formattedStartDate, formattedEndDate],
          },
        },
      }
    );

    const totalActiveExperienceTicketsAmount = await ExperienceTicket.sum(
      "amount",
      {
        where: {
          ticketStatus: "ACTIVE",
          createdAt: {
            [Op.between]: [formattedStartDate, formattedEndDate],
          },
        },
      }
    );

    const totalActivePackageTicketsAmount = await PackageTicket.sum("amount", {
      where: {
        ticketStatus: "ACTIVE",
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const payouts = await Withdrawal.sum("amount", {
      where: {
        createdAt: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    const totalRevenue = revenue - (payouts || 0); // Adjust revenue by subtracting payouts

    const totalUnclaimedMoney =
      (totalActiveClassTicketsAmount || 0) +
      (totalActiveExperienceTicketsAmount || 0) +
      (totalActivePackageTicketsAmount || 0) +
      (totalActiveWorkshopTicketsAmount || 0);

    const pendingHostPayouts =
      (totalWalletForMonth || 0) + (totalUnclaimedMoney || 0);

    const allDeductions =
      (totalDstForMonth || 0) +
      (totalVatForMonth || 0) +
      (pendingHostPayouts || 0); // Removed payouts from here to prevent double-counting

    const infimuseEarning = totalRevenue - allDeductions; // Final net profit

    // Check if an entry exists for this month
    const monthlyRevenue = await MonthlyRevenue.findOne({
      where: {
        date: {
          [Op.between]: [formattedStartDate, formattedEndDate],
        },
      },
    });

    if (monthlyRevenue) {
      // If it exists, update it
      await monthlyRevenue.update({
        totalRevenue: revenue || 0,
        accBalance: (revenue || 0) - (payouts || 0),
        netProfit: infimuseEarning || 0,
        subscriptionTotal: subscriptionTotal || 0,
        bookingTotal: bookingTotal || 0,
        totalDst: totalDstForMonth || 0,
        totalVat: totalVatForMonth || 0,
        pendingHostPayouts: pendingHostPayouts || 0,
        totalHostPayouts: payouts || 0,
        withdrawnAmount: payouts || 0,
      });
    } else {
      // If it doesn't exist, create a new entry
      await MonthlyRevenue.create({
        date: new Date(), // Store current date
        totalRevenue: revenue || 0,
        accBalance: (revenue || 0) - (payouts || 0),
        netProfit: infimuseEarning || 0,
        subscriptionTotal: subscriptionTotal || 0,
        bookingTotal: bookingTotal || 0,
        totalDst: totalDstForMonth || 0,
        totalVat: totalVatForMonth || 0,
        pendingHostPayouts: pendingHostPayouts || 0,
        totalHostPayouts: payouts || 0,
        withdrawnAmount: payouts || 0,
      });
    }

    // Return the current month's revenue details
    return res.status(200).json({
      month: monthString,
      accBalance: (revenue || 0) - (payouts || 0),
      totalRevenue: monthlyRevenue?.totalRevenue || totalRevenue,
      netProfit: monthlyRevenue?.netProfit || infimuseEarning,
      subscriptionTotal: monthlyRevenue?.subscriptionTotal || subscriptionTotal,
      bookingTotal: monthlyRevenue?.bookingTotal || bookingTotal,
      totalDst: monthlyRevenue?.totalDst || totalDstForMonth,
      totalVat: monthlyRevenue?.totalVat || totalVatForMonth,
      pendingHostPayouts:
        monthlyRevenue?.pendingHostPayouts || pendingHostPayouts,
      totalHostPayouts: monthlyRevenue?.totalHostPayouts || payouts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
