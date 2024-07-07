const db = require("./../models/index");
const axios = require("axios");
const Customer = db.customers;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

exports.mattermostUser = async (req, res) => {
  const email = req.body.email;
  const first_name = req.body.firstName;
  const last_name = req.body.lastName;
  const password = req.body.password;

  if (!email || !first_name || !last_name) {
    return res
      .status(403)
      .json({ error: "please provide the required entities" });
  }
  const userInDb = await Customer.findOne({ where: { email: email } });

  if (userInDb) {
    try {
      const loginResponse = await axios.post(`${mattermostUrl}/users/login`, {
        login_id: email,
        password: password,
      });

      const token = loginResponse.headers.token;
      return res
        .status(200)
        .json({ message: "Login successful", token: token });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Login failed. Please check your credentials." });
    }
  } else {
    try {
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
          username: `${first_name}_${last_name}`,
          password: password,
        },
        {
          //   headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      const newUser = await Customer.create({
        email: email,
        firstName: first_name,
        lastName: last_name,
        password: password,
      });

      return res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: "User creation failed. Please try again." });
    }
  }
};
exports.getMatterMostUsers = async (req, res) => {
  try {
    const loginResponse = await axios.get(`${mattermostUrl}/users`);

    return res.status(200).json({ message: " successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "check failed." });
  }
};
