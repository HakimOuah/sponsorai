import nodemailer from "nodemailer";

const globalForMailer = globalThis as unknown as {
  mailer: nodemailer.Transporter | undefined;
};

export const mailer =
  globalForMailer.mailer ??
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

if (process.env.NODE_ENV !== "production") globalForMailer.mailer = mailer;
