const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
const QRCode = require("qrcode");
const { BlobServiceClient } = require("@azure/storage-blob");

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

module.exports = class Email {
  constructor(
    user,
    url,
    title,
    listingDescription,
    date,
    amount,
    otp,
    qrCodeURL,
    channelLink
  ) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.amount = amount;
    this.date = date;
    this.title = title;
    this.listingDescription = listingDescription;
    this.otp = otp;
    this.qrCodeURL = qrCodeURL;
    this.channelLink = channelLink;
    this.from = `Infimuse <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_API,
      },
    });
  }

  async generateQRCode(text) {
    if (typeof text !== "string") {
      throw new Error("QR code text must be a string");
    }

    try {
      const qrCodeDataURL = await QRCode.toDataURL(text);
      const buffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

      const containerClient = blobServiceClient.getContainerClient("qrcodes");
      await containerClient.createIfNotExists({
        access: "blob"
      });

      const blobName = `${Date.now()}.png`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: "image/png",
          blobContentEncoding: "base64"
        }
      });

      const qrCodeURL = blockBlobClient.url;
      return qrCodeURL;
    } catch (err) {
      console.error("Error generating QR code:", err);
      return null;
    }
  }

  async send(template, subject) {
    let qrCodeURL = null;
    if (this.url) {
      qrCodeURL = await this.generateQRCode(this.url);
    }

    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        amount: this.amount,
        date: this.date,
        title: this.title,
        listingDescription: this.listingDescription,
        qrCodeURL,
        channelLink: this.channelLink,
        subject,
      }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async classTicket() {
    await this.send("classTicket", "Your Class Ticket");
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Infimuse");
  }

  async resetPassword() {
    await this.send("passwordReset", "Reset your password");
  }

  async hostWelcome() {
    await this.send("welcomeHost", "Welcome to Infimuse");
  }

  async staffWelcome() {
    await this.send("welcomeStaff", "Welcome to Infimuse");
  }

  async guestWelcome() {
    await this.send("welcomeGuest", "Welcome to Infimuse");
  }

  async inviteStaff() {
    await this.send("inviteStaff", "Become a staff");
  }

  async classTicket() {
    await this.send("classTicket", "Class Ticket Purchase");
  }

  async packageTicket() {
    await this.send("packageTicket", "Package Ticket Purchase");
  }

  async workshopTicket() {
    await this.send("workshopTicket", "Workshop Ticket Purchase");
  }

  async canceledTicket() {
    await this.send("ticketCancelled", "Ticket Cancelled");
  }

  async experienceTicket() {
    await this.send("experienceTicket", "Experience Ticket Purchase");
  }
  async withdraw() {
    await this.send("withdraw", "Your infimuse withdraw code");
  }
  async freePlanTicket() {
    await this.send("payAsYouGoPlan", "Subscription Confirmed!");
  }
  async growthPlanTicket() {
    await this.send("growthPlan", "Subscription Confirmed!");
  }
  async professionalPlanTicket() {
    await this.send("professionalPlan", "Subscription Confirmed!");
  }
  async assignedListing() {
    await this.send("assignedTemplate", "New Template assigned");
  }
  async adminToken() {
    await this.send("adminToken", "Admin login Token");
  }

  async groupTicket() {
    await this.send("groupTicket", "Group Ticket Purchase");
  }
};
