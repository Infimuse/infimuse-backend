const db = require("./../models/index");
const axios = require("axios");
const Customer = db.customers;
const mattermostUrl = process.env.MATTERMOST_URL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const team_id = process.env.TEAM_ID;

const getAuthToken = async () => {
  try {
    const response = await axios.post(`${mattermostUrl}/users/login`, {
      login_id: adminUsername,
      password: adminPassword,
    });
    return response.headers.token;
  } catch (error) {
    throw new Error("Failed to authenticate with Mattermost: " + error.message);
  }
};

exports.createMattermostChannel = async (req, res) => {
  try {
    const token = await getAuthToken();
    console.log(token);
    const createMattermostGroup = await axios.post(
      `${mattermostUrl}/channels`,
      {
        name: req.body.name,
        display_name: req.body.display_name,
        team_id,
        display_name: req.body.display_name,
        header: req.body.header,
        type: "O",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.status(200).json({ message: "Group creation successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Group creation failed." });
  }
};
