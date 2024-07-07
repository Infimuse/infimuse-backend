const jwt = require("jsonwebtoken");
const db = require("../models");
const factory = require("./factory");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const Email = require("../utils/email");
const Staff = db.staffs;
const compare = require("secure-compare");

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
      hostIdentifier: req.body.hostIdentifier,
    });

    const token = signToken(newStaff.id);
    const url = newStaff.OTP;
    new Email(newStaff, url).staffWelcome();
    res
      .status(201)
      .json({ msg: "Staff created successfully", token, newStaff });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
  next();
};

exports.staffLogin = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { email } = req.body;
    const { OTP } = req.body;

    if (!email || !password) {
      return next(Error("Email and password are required"));
    }
    const user = await Staff.findOne({ where: { email } });
    if (!user) {
      return next(Error("User not found"));
    }

    if (user.firstTimeLogin === true) {
      if (!OTP) {
        return next(Error("OTP required for firstTime login"));
      }

      await compareOTP(OTP, user.OTP);

      const isPasswordValid = await comparePasswords(password, user.password);

      if (!isPasswordValid) {
        return next(Error("Invalid password/Email"));
      }

      await user.update({ firstTimeLogin: false });
      const token = signToken(user.id);

      res.status(200).json({ msg: "success", token });
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return next(Error("Incorrect password/username"));
    }

    const token = signToken(user.id);
    res.status(200).json({ msg: "Success", token });
  } catch (error) {
    res.status(500).json({ errror: "inter server error" });
  }
  next();
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  const staff = await Staff.findOne({ where: { email } });
  if (!staff) {
    return next(Error("No user with that email"));
  }
  try {
    await staff.save();
    const url = staff.resetPasswordToken;

    new Email(staff, url).resetPassword();

    res.status(200).json({ message: "Please check your email token sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
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

    res.status(200).json({ msg: "Password reset successful", token: newToken });
  } catch (error) {
    console.error("Error resetting password:", error);
    return next(Error("There was an error resetting the password"));
  }
};
