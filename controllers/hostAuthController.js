const jwt = require("jsonwebtoken");
const db = require("./../models");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const Email = require("../utils/email");
const { url } = require("inspector");
const host = require("../models/host");
const { Op } = require("sequelize");
const compare = require("secure-compare");
const moment = require("moment");
const axios = require("axios");
const Host = db.hosts;
const SubAccount = db.subAccounts;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const Customer = db.customers;
const channelLink = process.env.MATTERMOST_OVERALL_LINK;
require("dotenv").config();
const testKey = process.env.PAYSTACK_TEST_KEY;
const liveKey = process.env.PAYSTACK_LIVE_KEY;
const Paystack = require("paystack-sdk").Paystack;
const paystack = new Paystack(liveKey);
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

exports.hostSignup = async (req, res, next) => {
  try {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const bio = req.body.bio;
    const imageUrl1 = req.body.imageUrl1;
    const displayName = req.body.displayName;
    const imageUrl2 = req.body.imageUrl2;
    const imageUrl3 = req.body.imageUrl3;
    const qualifications = req.body.qualifications;
    const verified = req.body.verified;
    const hostTitle = req.body.hostTitle;
    const nationalId = req.body.nationalId;
    const status = req.body.status;
    const phone = req.body.phone;
    const password = req.body.password;
    const role = req.body.role;
    const experienceYears = req.body.experienceYears;
    const resetPassword = req.body.resetPassword;

    const existingHost = await Host.findOne({ where: { email } });

    if (existingHost) {
      return res.status(401).json({ msg: "User with that email exists" });
    }

    const newHost = await Host.create({
      firstName,
      lastName,
      bio,
      imageUrl1,
      imageUrl2,
      imageUrl3,
      qualifications,
      displayName,
      verified,
      hostTitle,
      nationalId,
      status,
      email,
      phone,
      password,
      role,
      experienceYears,
      resetPassword,
    });

    const token = signToken(newHost.id);
    const url = newHost.OTP;
    new Email(
      newHost,
      url,
      null,
      null,
      null,
      null,
      null,
      null,
      channelLink
    ).hostWelcome();
    const adminLoginResponse = await axios.post(
      `${mattermostUrl}/users/login`,
      {
        login_id: adminUsername,
        password: adminPassword,
      }
    );

    const adminToken = adminLoginResponse.headers.token;

    const userCreationResponse = await axios.post(
      `${mattermostUrl}/users`,
      {
        email: email,
        username: `host-${firstName}`,
        password,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    res
      .status(201)
      .json({ message: "Host created successfully", token, newHost });
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ message: "host created but already exists in mattermost" });
  }
  next();
};

exports.hostLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { password } = req.body;
    const { OTP } = req.body;

    if (!email || !password) {
      return next(Error("please provide an email/password"));
    }
    const host = await Host.findOne({ where: { email } });
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    if (host.firstTimeLogin === true) {
      if (!OTP) {
        return res
          .status(403)
          .json({ error: "Otp required for first time login" });
      }
      try {
        await compareOTP(OTP, host.OTP);
        const isPasswordValid = await comparePasswords(password, host.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid password/email" });
        } else {
          await host.update({ firstTimeLogin: false });
          const token = signToken(host.id);
          return res.status(200).json({ msg: "Logged in", token });
        }
      } catch (error) {
        return res.status(401).json({ error: "Invalid Token" });
      }
    } else {
      const isPasswordValid = await comparePasswords(password, host.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Incorrect email/password",
        });
      }

      const token = signToken(host.id);
      return res.status(200).json({
        msg: "Logged in",
        token,
        name: host.firstName,
        email: host.email,
        phone: host.phone,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ Error: error.message });
  }
  next();
};

exports.createHostSubAccount = async (req, res, next) => {
  try {
    const { account_number, bank_code, business_name } = req.body;
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Please login" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hostId = decoded.id;

    const host = await Host.findOne({ where: { id: hostId } });

    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    if (host.haveAccount === true) {
      return res.status(400).json({ error: "Host already has a subaccount" });
    }

    const checkHostInSubAccount = await SubAccount.findOne({
      where: { hostId },
    });
    
    if (checkHostInSubAccount) {
      return res.status(400).json({ error: "Host already has a subaccount" });
    }


    const subAccountInitiation = await paystack.subAccount.create({
      business_name: business_name,
      first_name: host.firstName,
      email: host.email,
      settlement_bank: bank_code,
      account_number: account_number,
      currency: "KES",
      percentage_charge: process.env.PERCENTAGE_CHARGE,
      primary_contact_name: host.firstName,
      primary_contact_email: host.email,
      primary_contact_phone: host.phone,
    });
    if (subAccountInitiation.data.status !== "active") {
      return res.status(400).json({ error: "Subaccount creation failed" });
      
    }
    await SubAccount.create({
      bank_account_number: account_number,
      bank_code,
      business_name: business_name,
      firstName: host.firstName,
      email: host.email,
      hostId,
      paystack_subaccount_code: subAccountInitiation.data.subaccount_code,
      // currency: "KES",
      // percentage_charge: process.env.PERCENTAGE_CHARGE,
      // primary_contact_name: host.firstName,
      // primary_contact_email: host.email,
      // primary_contact_phone: host.phone,
    })


    return res.status(202).json({ 
      msg: "Subaccount creation initiated", 
      status: "pending",
      data: subAccountInitiation
    });

  } catch (error) {
    console.error('Subaccount creation error:', {
      message: error.message,
      response: error.response?.data,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ 
      error: error.message,
      details: error.response?.data
    });
  }
};
exports.hostProtect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(Error("Please login"));
    }

    // verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //check if the user still exists
    const freshUser = await Host.findByPk(decoded.id);

    if (!freshUser) {
      return res.status(401).json({ message: "User doesn't exist" });
    }

    req.user = freshUser;
  } catch (error) {
    console.log(error);
    return res.status(400).json({ Error: "unauthorized" });
  }
  next();
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const host = await Host.findOne({ where: { email } });

  if (!host) {
    return next(Error("Host with that email not foud"));
  }

  try {
    await host.save();
    const url = host.resetPasswordToken;
    await new Email(host, url).resetPassword();
    res
      .status(200)
      .json({ status: "success", msg: "check your email token has been sent" });
  } catch (error) {
    await host.save();
    return res.status(500).json({ msg: "Internal server Error" });
  }
  next();
};

exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Find the user with the given reset password token
    const user = await Host.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      return console.log(Error());
    }

    // Set the new password for the user
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const newToken = signToken(user.id);

    return res
      .status(200)
      .json({ msg: "Password reset successful", token: newToken });
  } catch (error) {
    console.error("Error resetting password:", error);
    return next(Error("There was an error resetting the password"));
  }
};

exports.checkHostEmail = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(401).json({ error: "Please provide an email" });
  }

  const host = await Host.findOne({ where: { email } });
  if (!host) {
    return res.status(404).json({ error: "Host not found" });
  }
  if (host.firstTimeLogin === true) {
    return res.status(401).json({
      error: "Unauthorized please login using an OTP first to be verified",
    });
  }

  return res.status(200).json({ msg: "success" });
};
