const factory = require("./factory");
const db = require("./../models");
const jwt = require("jsonwebtoken");
const Host = db.hosts;
const HostPlan = db.hostPlans;
const Workshop = db.workshops;
const Experience = db.experiences;
const ClassSessions = db.classSessions;
const PackageClasses = db.packageClasses;
const { Op } = require("sequelize");
const PaymentTransaction = db.paymentTransactions;
const HostPaymentPlanTransaction = db.hostPaymentPlanTransactions;
const asyncWrapper = require("../asyncWrapper");
const paystackApi = require("../paystackApi");
const updatePlan = require("./paystackUpdateApi");
const Email = require("./../utils/email");
const experience = require("../models/experience");
const growth_monthly = process.env.MONTHLY_GROWTHPLAN;
const growth_annually = process.env.ANNUAL_GROWTHPLAN;
const professional_annually = process.env.ANNUAL_PROFESSIONAL_PLAN;
const professional_monthly = process.env.MONTHLY_PROFESSIONAL_PLAN;
const InfimuseAccount = db.InfimuseAccount;
const growthCallbackUrl =
  "http://localhost:8079/api/v1/hostplans/growthPlan/verify";
const proCallbackUrl = "http://localhost:8079/api/v1/hostplans/proPlan/verify";
const Commission = db.commissions;
const MonthlySubsRecord = db.monthlySubsRecord;

class PaystackController {
  getAllHostPlan = factory.getAllDocs(HostPlan);
  getOneHostPlan = factory.getOneDoc(HostPlan);
  deletePlan = async (req, res, next) => {
    try {
      const token =
        req.headers.authorization && req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized,please log in" });
      }
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const hostId = decodedToken.id;

      const plan = await HostPlan.findOne({ where: { hostId: hostId } });
      if (!plan) {
        return res
          .status(404)
          .json({ error: "you're not subscribed to any plan" });
      }
      await plan.destroy();
      next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  initializePayment = asyncWrapper(async (req, res) => {
    const { callbackUrl, subscription } = req.body;
    let amount = 0;

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
      if (err) {
        return res.status(500).json({ error: "Jwt Malformed login again" });
      }
      const newHost = await Host.findOne({ where: { id: host.id } });

      if (!newHost) {
        return res.status(404).json({ msg: "Host not found" });
      }

      const email = newHost.email;

      const checkHostInHostPlan = await HostPlan.findOne({
        where: { hostId: newHost.id },
      });

      if (checkHostInHostPlan) {
        return res.status(403).json({
          msg: "As a host you can only have one sub please change subscription when ready",
        });
      }

      const plan = await HostPlan.create({
        hostId: newHost.id,
        subscription: "freePlan",
        email,
      });

      const nextBillingDate = new Date(plan.createdAt);
      nextBillingDate.setDate(nextBillingDate.getDate() + 31);

      await plan.update({
        expiresAt: nextBillingDate,
        period: "month",
      });
      await MonthlySubsRecord.create({
        hostId: newHost.id,
        plan: "FreePlan",
        amount: 0,
        expiresAt: nextBillingDate,
        vAT: 0,
      });
      const now = new Date();
      const hostId = newHost.id;
      const allWorkshopsByHost = await Workshop.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allexperiencesByHost = await Experience.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allClassesByHost = await ClassSessions.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allPackagesByHost = await PackageClasses.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });

      await Promise.all(
        allWorkshopsByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allPackagesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allexperiencesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allClassesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );

      new Email(
        newHost,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ).freePlanTicket();
      return res.status(201).json({ msg: "Created successfully", plan });
    });
  });

  initializeGrowthPayment = asyncWrapper(async (req, res) => {
    const { period } = req.body;
    let amount = 0;

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
      if (err) {
        return res.status(500).json({ error: "Jwt Malformed login again" });
      }
      const newHost = await Host.findOne({ where: { id: host.id } });

      if (!newHost) {
        return res.status(404).json({ msg: "Host not found" });
      }

      const email = newHost.email;
      const name = newHost.FirstName;

      const checkHostInHostPlan = await HostPlan.findOne({
        where: { hostId: newHost.id },
      });

      if (checkHostInHostPlan) {
        return res.status(403).json({
          msg: "As a host you can only have one sub please change subscription when ready",
        });
      }
      if (period === "month") {
        amount = growth_monthly * 100;
      } else if (period === "annual") {
        amount = growth_annually * 100;
      }
      const paymentDetails = {
        amount,
        email,
        callback_url: growthCallbackUrl,
        metadata: {
          amount,
          email,
          name,
        },
      };
      const data = await paystackApi.initializePayment(paymentDetails);
      return res.status(200).json({
        message: "Payment initialized successfully",
        data,
      });
    });
  });

  initializeProPayment = asyncWrapper(async (req, res) => {
    const { period } = req.body;
    let amount = 0;

    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, host) => {
      if (err) {
        return res.status(500).json({ error: "Jwt Malformed login again" });
      }
      const newHost = await Host.findOne({ where: { id: host.id } });

      if (!newHost) {
        return res.status(404).json({ msg: "Host not found" });
      }

      const email = newHost.email;
      const name = newHost.FirstName;

      const checkHostInHostPlan = await HostPlan.findOne({
        where: { hostId: newHost.id },
      });

      if (checkHostInHostPlan) {
        return res.status(403).json({
          msg: "As a host you can only have one sub please change subscription when ready",
        });
      }
      if (period === "month") {
        amount = professional_monthly * 100;
      } else if (period === "annual") {
        amount = professional_annually * 100;
      }
      const paymentDetails = {
        amount,
        email,
        callback_url: proCallbackUrl,
        metadata: {
          amount,
          email,
          name,
        },
      };
      const data = await paystackApi.initializePayment(paymentDetails);
      return res.status(200).json({
        message: "Payment initialized successfully",
        data,
      });
    });
  });

  verifyGrowthPayment = asyncWrapper(async (req, res) => {
    try {
      let period;
      const reference = req.query.reference;

      if (!reference) {
        throw new Error("Missing transaction reference");
      }

      const {
        data: {
          metadata: { email, amount, name },
          reference: paymentReference,
          status: transactionStatus,
        },
      } = await paystackApi.verifyPayment(reference);

      if (transactionStatus !== "success") {
        throw new Error(`Transaction: ${transactionStatus}`);
      }
      const host = await Host.findOne({ where: { email: email } });
      const hostId = host.id;

      if (amount / 100 === 6999) {
        period = "annual";
      } else if (amount / 100 === 9999) {
        period = "month";
      }
      const actualAmount = amount / 100;
      const vatTobePaid = 0.16 * actualAmount;
      const amountAfterTax = actualAmount - vatTobePaid;
      const [payment, created] = await HostPlan.findOrCreate({
        where: { paymentReference },
        defaults: {
          amount: amountAfterTax,
          email,
          paymentReference,
          hostId,
          subscription: "growth",
          period,
        },
      });
      const subsRecord = await MonthlySubsRecord.create({
        amount: amountAfterTax,
        hostId,
        plan: "growth",
        paymentReference,
        VAT: vatTobePaid,
      });

      const plan = await HostPlan.findOne({
        where: { paymentReference: reference },
      });
      if (!plan) {
        return res.status(404).json({ error: "host plan not found" });
      }
      let date;
      const title = plan.amount;
      const url = plan.period;
      if (url === "month") {
        const nextBillingDate = new Date(host.createdAt);
        nextBillingDate.setDate(nextBillingDate.getDate() + 31);

        date = nextBillingDate.toISOString().split("T")[0];
        await plan.update({ expiresAt: date });
        await subsRecord.update({ expiresAt: date });
      } else if (url === "annual") {
        const nextBillingDate = new Date(host.createdAt);
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);

        date = nextBillingDate.toISOString().split("T")[0];
        await plan.update({ expiresAt: date });
        await subsRecord.update({ expiresAt: date });
      }
      const now = new Date();

      const allWorkshopsByHost = await Workshop.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allexperiencesByHost = await Experience.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allClassesByHost = await ClassSessions.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allPackagesByHost = await PackageClasses.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });

      await Promise.all(
        allWorkshopsByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allPackagesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allexperiencesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allClassesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );

      new Email(
        host,
        url,
        title,
        null,
        date,
        null,
        null,
        null,
        null,
        null,
        null
      ).growthPlanTicket();

      await InfimuseAccount.create({
        amount: amount / 100,
        transactionType: "Subscription",
        reference,
      });
      if (!created) {
        return res.status(402).json({ error: "Couldn't create a ticket" });
      }
      return res.status(200).json({
        message: "Payment verified",
        data: payment,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  verifyProPayment = asyncWrapper(async (req, res) => {
    try {
      let period;
      const reference = req.query.reference;

      if (!reference) {
        throw new Error("Missing transaction reference");
      }

      const {
        data: {
          metadata: { email, amount, name },
          reference: paymentReference,
          status: transactionStatus,
        },
      } = await paystackApi.verifyPayment(reference);

      if (transactionStatus !== "success") {
        throw new Error(`Transaction: ${transactionStatus}`);
      }
      const host = await Host.findOne({ where: { email: email } });
      const hostId = host.id;

      if (amount / 100 === 11999) {
        period = "annual";
      } else if (amount / 100 === 15999) {
        period = "month";
      }
      const actualAmount = amount / 100;
      const vatTobePaid = 0.16 * actualAmount;
      const amountAfterTax = actualAmount - vatTobePaid;
      const [payment, created] = await HostPlan.findOrCreate({
        where: { paymentReference },
        defaults: {
          amount: amountAfterTax,
          email,
          paymentReference,
          hostId,
          subscription: "professional",
          period,
        },
      });
      const subsRecord = await MonthlySubsRecord.create({
        amount: amountAfterTax,
        hostId,
        plan: "professional",
        paymentReference,
        VAT: vatTobePaid,
      });
      const plan = await HostPlan.findOne({
        where: { paymentReference: reference },
      });
      if (!plan) {
        return res.status(404).json({ error: "host plan not found" });
      }
      let date;
      const title = plan.amount;
      const url = plan.period;
      if (url === "month") {
        const nextBillingDate = new Date(host.createdAt);
        nextBillingDate.setDate(nextBillingDate.getDate() + 31);

        date = nextBillingDate.toISOString().split("T")[0];
        await plan.update({ expiresAt: date });
        await subsRecord.update({ expiresAt: date });
      } else if (url === "annual") {
        const nextBillingDate = new Date(host.createdAt);
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);

        date = nextBillingDate.toISOString().split("T")[0];
        await plan.update({ expiresAt: date });
        await subsRecord.update({ expiresAt: date });
      }
      const now = new Date();

      const allWorkshopsByHost = await Workshop.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allexperiencesByHost = await Experience.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allClassesByHost = await ClassSessions.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });
      const allPackagesByHost = await PackageClasses.findAll({
        where: {
          hostId: hostId,
          status: "UPCOMING",
          endDate: { [Op.lt]: now },
        },
      });

      await Promise.all(
        allWorkshopsByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allPackagesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allexperiencesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );
      await Promise.all(
        allClassesByHost.map(async (workshop) => {
          return workshop.update({ status: "PAST" });
        })
      );

      new Email(
        host,
        url,
        title,
        null,
        date,
        null,
        null,
        null,
        null,
        null,
        null
      ).professionalPlanTicket();

      await InfimuseAccount.create({
        amount: amount / 100,
        transactionType: "Subscription",
        reference,
      });
      if (!created) {
        return res.status(402).json({ error: "Couldn't create a ticket" });
      }
      return res.status(200).json({
        message: "Payment verified",
        data: payment,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  });
}

const paystackController = new PaystackController();

module.exports = paystackController;
