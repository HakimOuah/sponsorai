import nodemailer from "nodemailer";

const globalForMailer = globalThis as unknown as {
  mailer: nodemailer.Transporter | undefined;
};

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465;

export const mailer =
  globalForMailer.mailer ??
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ionos.fr",
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export function getMailFrom() {
  const email = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = process.env.MAIL_FROM_NAME;

  if (!email) return undefined;
  if (!name) return email;

  return `"${name.replace(/"/g, "")}" <${email}>`;
}

if (process.env.NODE_ENV !== "production") globalForMailer.mailer = mailer;
