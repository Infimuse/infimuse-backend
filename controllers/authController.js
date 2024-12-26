const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const db = require("./../models");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const Email = require("./../utils/email");
const compare = require("secure-compare");
const axios = require("axios");
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const Customer = db.customers;
const channelLink = process.env.MATTERMOST_OVERALL_LINK;

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

exports.customerSignup = async (req, res, next) => {
  try {
    const email = req.body.email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const role = req.body.role;
    const password = req.body.password;
    const resetPassword = req.body.resetPassword;
    const phone = req.body.phone;
    const existingHost = await Customer.findOne({ where: { email } });

    if (existingHost) {
      return res.status(401).json({ msg: "User with that email exists" });
    }

    console.log("Creating new user...");
    const newUser = await Customer.create({
      firstName,
      lastName,
      email,
      role,
      password,
      resetPassword,
      phone,
    });
    const url = newUser.OTP;
    await new Email(
      newUser,
      url,
      null,
      null,
      null,
      null,
      null,
      null,
      channelLink
    ).sendWelcome();

    const token = signToken(newUser.id);

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
        username: `${firstName}_${lastName}`,
        password,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    return res.status(201).json({ msg: "User Created", newUser, token });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "user created but already a mattermost user" });
  } finally {
    next();
  }
};

exports.customerLogin = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { email } = req.body;
    const { OTP } = req.body;

    if (!email || !password) {
      return res.status(401).json({ error: "Email and password are required" });
    }
    const user = await Customer.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.firstTimeLogin === true) {
      if (!OTP) {
        return res
          .status(403)
          .json({ error: "OTP required for first time login" });
      }

      try {
        await compareOTP(OTP, user.OTP);
        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid password" });
        }

        await user.update({ firstTimeLogin: false });
        const token = signToken(user.id);
        return res.status(200).json({ msg: "Logged in", token });
      } catch (error) {
        return res.status(403).json({ error: "invalid OTP" });
      }
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return next(Error("Incorrect password/username"));
    }

    const token = signToken(user.id);
    return res.status(200).json({
      msg: "Success",
      token,
      // user,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ Error: "Internal server error" });
  }
  next();
};

exports.customerProtect = async (req, res, next) => {
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
    const freshUser = await Customer.findByPk(decoded.id);

    if (!freshUser) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    req.user = freshUser;
  } catch (error) {
    return res.status(400).json({ Error: "unauthorized", Issue: error });
  }
  next();
};

exports.forgortPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await Customer.findOne({ where: { email } });
  if (!user) {
    return next(Error("User with that email does not exist"));
  }

  try {
    await user.save();
    const url = user.resetPasswordToken;
    await new Email(user, url).resetPassword();
    return res
      .status(200)
      .json({ status: "success", msg: "check your email token has been sent" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    await user.save();
  }
  next();
};

exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Find the user with the given reset password token
    const user = await Customer.findOne({
      where: {
        resetPasswordToken: token,
        passwordResetExpires: { [Op.gt]: new Date() },
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
    return res
      .status(500)
      .json({ Error: "There was an error resetting the password" });
  }
};
