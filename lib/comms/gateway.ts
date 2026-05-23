import "server-only";

// Stubbed SMS/email gateway. Real providers (e.g. an SMS aggregator, an email
// service) plug in behind this interface later — confirm formats first. For now
// it logs so the comms flow is exercisable end-to-end without a provider.

export type DispatchResult = { ok: boolean; provider: string };

export interface MessageGateway {
  sendEmail(to: string, subject: string, body: string): Promise<DispatchResult>;
  sendSms(to: string, body: string): Promise<DispatchResult>;
}

export const stubGateway: MessageGateway = {
  async sendEmail(to, subject) {
    console.info(`[stub-email] to=${to} subject=${subject}`);
    return { ok: true, provider: "stub" };
  },
  async sendSms(to, body) {
    console.info(`[stub-sms] to=${to} chars=${body.length}`);
    return { ok: true, provider: "stub" };
  },
};

// Swap this for a real implementation behind the same interface when a provider
// and message formats are confirmed.
export function getGateway(): MessageGateway {
  return stubGateway;
}
