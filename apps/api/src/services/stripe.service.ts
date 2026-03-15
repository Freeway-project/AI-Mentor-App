import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export class StripeService {
  async createPaymentIntent(params: {
    amountCents: number;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: params.currency ?? 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: params.metadata ?? {},
    });
    if (!pi.client_secret) throw new Error('Stripe did not return a client_secret');
    return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = getStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  constructWebhookEvent(payload: string, signature: string, secret: string): Stripe.Event {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
