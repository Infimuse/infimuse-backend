const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
const QRCode = require("qrcode");
const { BlobServiceClient } = require("@azure/storage-blob");

let blobServiceClient = null;

if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
} else {
  console.warn('Azure Storage connection string is not defined in environment variables');
}

module.exports = class Email {
  constructor(
    user,
    ticketId = null, // Make ticketId optional with default null
    title,
    listingDescription,
    date,
    amount,
    otp,
    channelLink
  ) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.ticketId = ticketId;
    this.amount = amount;
    this.date = date;
    this.title = title;
    this.listingDescription = listingDescription;
    this.otp = otp;
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

  async generateQRCode() {
    // If no ticketId, return null instead of throwing an error
    if (!this.ticketId) {
      return null;
    }

    try {
      // Generate QR code with the ticketId
      const qrCodeDataURL = await QRCode.toDataURL(this.ticketId);

      if (blobServiceClient) {
        const ContainerClient = blobServiceClient.getContainerClient("qrcodes");

        await ContainerClient.createIfNotExists({
          access: "blob",
        });

        const blobName = `qrcode-${this.ticketId}-${Date.now()}.png`;
        const blockBlobClient = ContainerClient.getBlockBlobClient(blobName);

        // Upload to Azure Blob Storage
        const buffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

        await blockBlobClient.upload(buffer, buffer.length, {
          blobHTTPHeaders: {
            blobContentType: "image/png",
            blobContentEncoding: "base64",
          },
        });

        return blockBlobClient.url;
      } else {
        console.warn('Azure Blob Storage is not available, skipping upload.');
        return qrCodeDataURL; // Return the QR code URL as data URI if Azure is not available
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
      return null; // Return null instead of throwing an error
    }
  }

  async send(template, subject) {
    try {
      // Generate QR code only if ticketId exists, otherwise set to null
      const qrCodeURL = this.ticketId ? await this.generateQRCode() : null;

      const html = pug.renderFile(
        `${__dirname}/../views/emails/${template}.pug`,
        {
          firstName: this.firstName,
          ticketId: this.ticketId,
          amount: this.amount,
          date: this.date,
          title: this.title,
          listingDescription: this.listingDescription,
          qrCodeURL, // This will be null if no ticketId
          channelLink: this.channelLink,
          subject,
          otp: this.otp, // Added otp to the template context
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
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
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
