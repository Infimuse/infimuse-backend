const QRCode = require('qrcode'); // Add this at the top
const pug = require('pug'); // Add this at the top
const htmlToText = require('html-to-text'); // Add this at the top

module.exports = class Email {
  // ... constructor remains the same ...

  async generateQRCode() {
    // ... code remains the same ...
  }

  // Keep only one send method - I recommend the first version since it handles null QR codes better
  async send(template, subject) {
    try {
      // Generate QR code only if ticketId exists
      const qrCodeUrl = this.ticketId ? await this.generateQRCode() : null;

      // Render HTML based on a pug template
      const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
        firstName: this.firstName,
        ticketId: this.ticketId,
        amount: this.amount,
        date: this.date,
        title: this.title,
        listingDescription: this.listingDescription,
        subject: subject,
        otp: this.otp,
        channelLink: this.channelLink,
        qrCodeUrl: qrCodeUrl
      });

      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.convert(html),
      };

      await this.newTransport().sendMail(mailOptions);
    } catch (error) {
      console.error("Email sending error:", error);
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
