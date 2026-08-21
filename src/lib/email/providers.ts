import type { SentMessageInfo } from "nodemailer";
import { getMailFrom, mailer } from "@/lib/mailer";

export interface OutboundMessage {
  from?: string;
  replyTo?: string;
  to: string;
  subject: string;
  text: string;
}

export interface SendResult {
  provider: string;
  messageId: string | null;
  accepted: boolean;
}

export interface SendingProvider {
  readonly id: string;
  send(message: OutboundMessage): Promise<SendResult>;
}

class SmtpSendingProvider implements SendingProvider {
  readonly id = "smtp";

  async send(message: OutboundMessage): Promise<SendResult> {
    const info: SentMessageInfo = await mailer.sendMail({
      from: message.from || getMailFrom(),
      replyTo: message.replyTo,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });

    return {
      provider: this.id,
      messageId: info.messageId || null,
      accepted: Array.isArray(info.accepted) ? info.accepted.length > 0 : true,
    };
  }
}

export function getSendingProvider(provider: string): SendingProvider {
  if (provider === "smtp") return new SmtpSendingProvider();
  throw new Error(`Sending provider not configured: ${provider}`);
}

export interface MailboxSyncResult {
  provider: string;
  imported: number;
  cursor?: string;
}

export interface MailboxProvider {
  readonly id: string;
  sync(identityId: string, cursor?: string): Promise<MailboxSyncResult>;
}

export function getMailboxProvider(provider: string): MailboxProvider {
  return {
    id: provider,
    async sync() {
      throw new Error(
        `Mailbox sync for ${provider} is not configured. SMTP sending remains available.`
      );
    },
  };
}
