const jwt = require("jsonwebtoken");
const db = require("../models");
const factory = require("./factory");
const bcrypt = require("bcryptjs");
const { Op, where } = require("sequelize");
const Email = require("../utils/email");
const compare = require("secure-compare");
const Staff = db.staffs;
const Host = db.hosts;
const Invites = db.invites;

exports.getAllStaffs = factory.getAllDocs(Staff);
exports.updateStaff = factory.updateDoc(Staff);
exports.deleteStaff = factory.deleteDoc(Staff);

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

const comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    return bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error("password comparison failed");
  }
};

const compareOTP = async (userInputOTP, storedOTP) => {
  if (!compare(userInputOTP, storedOTP)) {
    throw new Error("Invalid OTP");
  }
};

exports.staffSignup = async (req, res, next) => {
  try {
    const email = req.body.email;

    const existingHost = await Staff.findOne({ where: { email } });

    if (existingHost) {
      return res.status(401).json({ msg: "User with that email exists" });
    }
    const newStaff = await Staff.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      imageUrl: req.body.imageUrl,
      bio: req.body.bio,
      numberOfSessions: req.body.numberOfSessions,
      hoursCompleted: req.body.hoursCompleted,
      earnings: req.body.earnings,
      totalAttendees: req.body.totalAttendees,
      uniqueAttendees: req.body.uniqueAttendees,
      workingDays: req.body.workingDays,
      avgSessionRating: req.body.avgSessionRating,
      phone: req.body.phone,
    });

    const token = signToken(newStaff.id);
    const url = newStaff.OTP;
    new Email(newStaff, url).staffWelcome();
    res
      .status(201)
      .json({ msg: "Staff created successfully", token, newStaff });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
  next();
};

exports.staffLogin = async (req, res, next) => {
  try {
    const { email, password, OTP } = req.body;

    if (!email || !password) {
      return res.status(403).json({ error: "Email/password are required" });
    }

    const user = await Staff.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.firstTimeLogin) {
      if (!OTP) {
        return res
          .status(403)
          .json({ error: "OTP required for first-time login" });
      }

      await compareOTP(OTP, user.OTP);

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email/password" });
      }

      await user.update({ firstTimeLogin: false });
      const token = signToken(user.id);

      return res.status(200).json({ msg: "Success", token });
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return res.status(403).json({ error: "Incorrect email/password" });
    }

    const token = signToken(user.id);

    // Fetch invites for the staff
    const invites = await Invites.findAll({
      where: { email: user.email, accepted: true },
      attributes: ["hostId"],
    });

    if (invites.length === 0) {
      return res.status(200).json({ msg: "No host found", token });
    }

    // Extract host IDs from invites
    const hostIds = invites.map((invite) => invite.hostId);

    // Fetch host details
    const hosts = await Host.findAll({
      where: { id: hostIds },
      attributes: ["id", "firstName", "email"],
    });

    return res.status(200).json({ msg: "Success", token, hosts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  const staff = await Staff.findOne({ where: { email } });
  if (!staff) {
    return res.status(404).json({ error: "No user with that email" });
  }
  try {
    await staff.save();
    const url = staff.resetPasswordToken;

    new Email(staff, url).resetPassword();

    return res
      .status(200)
      .json({ message: "Please check your email token sent" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Find the user with the given reset password token
    const user = await Staff.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      return next(Error("User not found or the token is invalid"));
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
    return next(Error("There was an error resetting the password"));
  }
};
