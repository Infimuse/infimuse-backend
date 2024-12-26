const db = require("../models");
const crypto = require("crypto");
const https = require("https");
const jwt = require("jsonwebtoken");
const ServerApproval = db.serverApproval;
const TransferRecipient = db.transferRecipient;
const paystackKey = process.env.PAYSTACK_TEST_KEY;
const secretKey = process.env.JWT_SECRET;
const Email = require("../utils/email");
const Host = db.hosts;
const Wallet = db.wallets;
const HostPlan = db.hostPlans;
const reference = crypto.randomBytes(3).toString("hex").toUpperCase();

exports.withdraw = async (req, res) => {
  try {
    const amount = req.body.amount;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Please login" });
    }

    const decodedToken = jwt.verify(token, secretKey);
    const hostId = decodedToken.id;

    const host = await Host.findOne({ where: { id: hostId } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const availableWallet = await Wallet.findOne({ where: { hostId } });
    if (!availableWallet) {
      return res.status(404).json({ error: "Please activate your wallet" });
    }
    let withdrawFee;
    const plan = await HostPlan.findOne({ where: { hostId } });

    if (plan.subscription === "freePlan") {
      withdrawFee = 100;
    } else if (plan.subscription === "growth") {
      withdrawFee = 100;
    } else if (plan.subscription === "professional") {
      withdrawFee = 100;
    }

    const totalAmount = availableWallet.walletAmount - withdrawFee;
    if (amount > totalAmount) {
      return res.status(403).json({
        error: "Insufficient balance",
        availableBalance: availableWallet.walletAmount,
        withdrawFee,
        withdrawableAmount: availableWallet.walletAmount - withdrawFee, // Corrected here to use withdrawFee
      });
    }

    const recipient = await TransferRecipient.findOne({ where: { hostId } });
    if (!recipient) {
      return res
        .status(404)
        .json({ error: "The host is not in the transfer recipient list" });
    }

    const params = JSON.stringify({
      source: "balance",
      amount,
      recipient: recipient.recipient_code,
      reason: "Holiday Flexing",
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transfer",
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
        try {
          const parsedData = JSON.parse(data);
          if (!parsedData.status) {
            console.log(parsedData);

            return res.status(403).json({ error: parsedData.message });
          }

          await ServerApproval.create({
            reference: parsedData.data.reference,
            transfer_code: parsedData.data.transfer_code,
            amount,
          });

          new Email(
            host,
            parsedData.data.reference,
            null,
            null,
            null,
            null
          ).withdraw();

          return res.status(200).json({
            message: "Confirmation code has been sent to your email",
            data: parsedData,
          });
        } catch (error) {
          return res
            .status(500)
            .json({ error: "Internal Server Error", details: error.message });
        }
      });
    });

    request.on("error", (error) => {
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    });

    request.write(params);
    request.end();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};
