const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const url = "/api/v1";
const jwt = require("jsonwebtoken");
const https = require("https");
const db = require("./models");

const Withdrawal = db.withdrawals;

dotenv.config();

const secretKey = process.env.JWT_SECRET;
const hostRoutes = require("./routes/hostRoutes");
const classSessionRoutes = require("./routes/classSessionRoutes");
const packageSessionRoutes = require("./routes/packageSessionRoute");
const workshopClassRoutes = require("./routes/workshopClassRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const packageClassRoutes = require("./routes/packageClassRoutes");
const guestRoutes = require("./routes/guestRoutes");
const customerRoutes = require("./routes/customerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewCommentRoutes = require("./routes/reviewCommentRoutes");
const classTicketRoutes = require("./routes/classTicketRoutes");
const locationRoutes = require("./routes/locationRoutes");
const packageTicketRoutes = require("./routes/packageTicketRoutes");
const paymentTransactionRoute = require("./routes/paymentTransactionRoute");
const payoutRoutes = require("./routes/payoutRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");
const hostReviewRoutes = require("./routes/hostReviewRoutes");
const workshopTicketRoutes = require("./routes/workshopTicketRoute");
const categoriesRoutes = require("./routes/categoryRoutes");
const wishlistsRoutes = require("./routes/wishlistRoutes");
const subCategoryRoutes = require("./routes/subCategoriesRoutes");
const refundTicketRoutes = require("./routes/refundTicketRoutes");
const hostTotalReviewRoutes = require("./routes/hostTotalReviewsRoutes");
const hostPlansRoutes = require("./routes/hostPlansRoutes");
const documentRoutes = require("./routes/documentRoutes");
const cartRoutes = require("./routes/cartRoutes");
const commentRoutes = require("./routes/commentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const acceptInvites = require("./routes/acceptInviteRoutes");
const subscriptionPaymentRoutes = require("./routes/subscriptionPayment");
const payment = require("./controllers/paymentTransactionController");
const cancelledTicketRoutes = require("./routes/canceledTicketRoutes");
const experienceRoutes = require("./routes/experienceRoutes");
const experienceTicket = require("./routes/experienceTicketRoutes");
const venue = require("./routes/venueRoutes");
const overallPayouts = require("./routes/overallPayout");
const mattermost = require("./routes/mattermost");
const community = require("./routes/communitiesRoute");
const admin = require("./routes/adminRoutes");
const freeClassRoutes = require("./routes/freeClassesRoutes");
const freeWorkshopRoutes = require("./routes/freeWorkshopRoutes");
const freePackageRoutes = require("./routes/freePackageRoutes");
const freeExperienceRoutes = require("./routes/freeExperienceRoutes");
const sessionVenueRoutes = require("./routes/sessionVenueRoutes");
const sessionBookingRoutes = require("./routes/sessionBookingRoutes");
const Host = db.hosts;
const axios = require("axios");
const TransferRecipient = db.transferRecipient;
const ServerApproval = db.serverApproval;
const Message = db.messages;
const paystackKey = process.env.PAYSTACK_TEST_KEY;
const Wallet = db.wallets;
const HostPlan = db.hostPlans;
const Commission = db.commissions;
const app = express();

const paystackPayout = require("./controllers/paystackPayout");

const corsOption = {
  origin: "*",
};

app.use(bodyParser.json());
app.use(express.json());
app.use(cors(corsOption));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));
// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
const port = process.env.PORT || 80;

function validateTransferRequest(body) {
  const reference = body.reference;
  if (!reference) {
    return false;
  }
  return true;
}

app.post(`${url}/approval`, async (req, res) => {
  const { body } = req;
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "Please login" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const hostId = decodedToken.id;
  const host = await Host.findOne({ where: { id: hostId } });

  const isValidTransferRequest = validateTransferRequest(body);
  if (!isValidTransferRequest) {
    return res
      .status(403)
      .json({ error: "please provide the code sent to your email" });
  }

  const referenceCheck = await ServerApproval.findOne({
    where: { reference: body.reference },
  });
  if (!referenceCheck) {
    return res.status(400).json({ error: "Invalid reference" });
  }

  const availableBalance = await Wallet.findOne({ where: { hostId } });
  if (!availableBalance) {
    return res.status(404).json({ error: "Balance not found" });
  }

  const currentBalance = availableBalance.walletAmount;
  const withdrawnAmount = referenceCheck.amount;

  let withdrawFee;
  let withdrawTax;
  const plan = await HostPlan.findOne({ where: { hostId } });

  if (plan.subscription === "freePlan") {
    withdrawFee = 100;
    withdrawTax = withdrawFee * 0.16;
  } else if (plan.subscription === "growth") {
    withdrawFee = 0;
    withdrawTax = 0;
  } else if (plan.subscription === "professional") {
    withdrawFee = 0;
    withdrawTax = 0;
  }

  const transferRecipient = await TransferRecipient.findOne({
    where: { hostId },
  });
  const recipient_code = transferRecipient.recipient_code;

  const transferData = {
    source: "balance",
    amount: withdrawnAmount * 100,
    recipient: recipient_code,
    reason: "Withdrawal from wallet",
  };

  try {
    const response = await axios.post(
      "https://api.paystack.co/transfer",
      transferData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    await Commission.create({
      amount: withdrawFee - withdrawTax,
      reference: response.data.data.reference,
      comissionType: "withdrawalFee",
      customerId: null,
      hostId,
      VAT: withdrawTax,
    });

    const totalWithdrawn = withdrawnAmount + withdrawFee;
    const newBalance = currentBalance - totalWithdrawn;
    await availableBalance.update({ walletAmount: newBalance });

    await Withdrawal.create({
      name: host.firstName,
      accountNumber: host.phone,
      email: host.email,
      reference_code: response.data.data.reference,
      amount: withdrawnAmount,
      hostId,
    });
    return res.status(200).json({
      message: "Approval successful",
      transferResponse: response.data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Transfer failed",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.post(
  `${url}/api/paystack`,
  paystackPayout.paystackMiddleware,
  async (req, res) => {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(403).json({ error: "Please login" });
    }

    const decodedToken = jwt.verify(token, secretKey);
    const hostId = decodedToken.id;
    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "The host is not found" });
    }

    // Update phone format
    let account_number = host.phone;
    if (account_number.startsWith("254")) {
      account_number = "0" + account_number.slice(3);
    }

    const name = host.firstName;

    const params = {
      type: "mobile_money",
      name,
      account_number,
      bank_code: "MPESA",
      currency: "KES",
    };

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transferrecipient",
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
    };

    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", async () => {
        const responseData = JSON.parse(data);

        if (!responseData.data) {
          return res.status(400).json({ error: responseData.message });
        }
        const recipient_code = responseData.data.recipient_code;
        const existingCode = await TransferRecipient.findOne({
          where: { recipient_code },
        });

        if (existingCode) {
          return res.status(403).json({
            msg: "User with that recipient code exists no need to create a new one",
            recipient_code: recipient_code,
          });
        }

        res.json(responseData);
        await TransferRecipient.create({
          name: responseData.data.name,
          bank_name: responseData.data.details.bank_name,
          account_number: responseData.data.details.account_number,
          recipient_code,
          type: responseData.data.type,
          hostId,
        });
      });
    });

    request.on("error", (error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" }); // Handle error
    });

    request.write(JSON.stringify(params)); // Send the params as request body
    request.end();
  }
);

const http = require("http");
const wallet = require("./models/wallet");
const host = require("./models/host");
const freeWorkshop = require("./models/freeWorkshop");
require("dotenv").config();

const server = http.createServer(app);

// mattermost/communities
app.use(`${url}/infimuse-communities`, mattermost);
app.use(`${url}/communities`, community);

// classSessions,Packages and workshops
app.use(`${url}/class-sessions`, classSessionRoutes);
app.use(`${url}/package-sessions`, packageSessionRoutes);
app.use(`${url}/workshop-classes`, workshopClassRoutes);
app.use(`${url}/package-classes`, packageClassRoutes);
app.use(`${url}/workshops`, workshopRoutes);
app.use(`${url}/experiences`, experienceRoutes);

// sessionBookings
app.use(`${url}/session-booking`, sessionBookingRoutes);
// free classes
app.use(`${url}/verify/free-classSessions`, freeClassRoutes);
app.use(`${url}/verify/free-workshops`, freeWorkshopRoutes);
app.use(`${url}/verify/free-experiences`, freeExperienceRoutes);
app.use(`${url}/verify/free-packages`, freePackageRoutes);

// users
app.use(`${url}/hosts`, hostRoutes);
app.use(`${url}/customers`, customerRoutes);
app.use(`${url}/guests`, guestRoutes);
app.use(`${url}/staffs`, staffRoutes);
app.use(`${url}/admin`, admin);

// tickets
app.use(`${url}/class-tickets`, classTicketRoutes);
app.use(`${url}/package-tickets`, packageTicketRoutes);
app.use(`${url}/workshop-tickets`, workshopTicketRoutes);
app.use(`${url}/refund-tickets`, refundTicketRoutes);
app.use(`${url}/experience-tickets`, experienceTicket);

// canceled tickets

app.use(`${url}/canceled-tickets`, cancelledTicketRoutes);

// payments
app.use(`${url}/payouts`, payoutRoutes);
app.use(`${url}/transactions`, paymentTransactionRoute);
app.use(`${url}/my-wallet`, overallPayouts);

// notifications and comments
app.use(`${url}/notifications`, notificationRoutes);
app.use(`${url}/review-comments`, reviewCommentRoutes);
app.use(`${url}/host-reviews`, hostTotalReviewRoutes);
app.use(`${url}/comments`, commentRoutes);

// cart
app.use(`${url}/carts`, cartRoutes);

// categories
app.use(`${url}/categories`, categoriesRoutes);
app.use(`${url}/sub-categories`, subCategoryRoutes);

// lists
app.use(`${url}/waitlists`, waitlistRoutes);
app.use(`${url}/wishlists`, wishlistsRoutes);

// locations
app.use(`${url}/session-venues`, sessionVenueRoutes);

app.use(`${url}/locations`, locationRoutes);
app.use(`${url}/venues`, venue);

// others
app.use(`${url}/host-reviews`, hostReviewRoutes);
app.use(`${url}/hostplans`, hostPlansRoutes);
app.use(`${url}/documents`, documentRoutes);

// subscriptions
app.use(`${url}/pay-subscriptions`, subscriptionPaymentRoutes);

// accepting invites from hosts
app.use(`${url}/accept-invites`, acceptInvites);

app.listen(port, () => {
  console.log(`Server listening to port ${port}`);
});
