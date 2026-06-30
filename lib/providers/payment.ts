export interface Plan {
  id: string;
  name: string;
  price_minor: number;
  currency: string;
}

export interface PaymentSession {
  checkout_url: string;
  session_id: string;
}

export interface PaymentProvider {
  checkout(plan: Plan, market: string): Promise<PaymentSession>;
}

class StripePaymentProvider implements PaymentProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkout(_plan: Plan, _market: string): Promise<PaymentSession> {
    throw new Error('Stripe provider not yet configured');
  }
}

class RazorpayPaymentProvider implements PaymentProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkout(_plan: Plan, _market: string): Promise<PaymentSession> {
    throw new Error('Razorpay provider not yet configured');
  }
}

export function getPaymentProvider(marketCode: string): PaymentProvider {
  if (marketCode === 'IN') return new RazorpayPaymentProvider();
  return new StripePaymentProvider();
}
