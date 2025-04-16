const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/adoption", async (req, res) => {
  const { fullName, email, phone, address, experience, reason, selectedDog } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
  });

  const message = `
    New Adoption Application:

    Name: ${fullName}
    Email: ${email}
    Phone: ${phone}
    Address: ${address}
    Dog Interested: ${selectedDog}
    Experience: ${experience}
    Reason: ${reason}
  `;

  try {
    await transporter.sendMail({
      from: `"${fullName}" <${email}>`,
      envelope: {
        from: "underdogp40@gmail.com",
        to: "underdogp40@gmail.com"
      },
      to: "underdogp40@gmail.com",
      subject: `Adoption Application from ${fullName}`,
      text: message
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ error: "Email sending failed" });
  }
});

module.exports = router;