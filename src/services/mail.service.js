import nodemailer from "nodemailer";
import config from "../config/index.js";

const transporter = config.email.user
  ? nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    })
  : null;

export const sendVerificationEmail = async (email, code) => {
  if (!transporter) {
    console.log("Servicio de email no configurado - Codigo:", code);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.email.user,
      to: email,
      subject: "BildyApp - Codigo de verificacion",
      text: "Tu codigo de verificacion es: " + code,
      html: "<p>Tu codigo de verificacion es: <strong>" + code + "</strong></p>",
    });
  } catch (error) {
    console.error("Error enviando email:", error.message);
  }
};

export default { sendVerificationEmail };
