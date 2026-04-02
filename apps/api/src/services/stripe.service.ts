import Stripe from 'stripe';
import { serviceUsageService } from './service-usage.service';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is required');
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

export class StripeService {
  async createPaymentIntent(params: {
    amountCents: number;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const startTime = Date.now();

    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.create({
        amount: params.amountCents,
        currency: params.currency ?? 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: params.metadata ?? {},
      });
      if (!pi.client_secret) throw new Error('Stripe did not return a client_secret');

      await serviceUsageService.recordSuccess({
        service: 'payments',
        provider: 'stripe',
        operation: 'create_payment_intent',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: {
          amountCents: params.amountCents,
          currency: params.currency ?? 'usd',
          paymentIntentId: pi.id,
        },
      });

      return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'payments',
        provider: 'stripe',
        operation: 'create_payment_intent',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: {
          amountCents: params.amountCents,
          currency: params.currency ?? 'usd',
        },
      });
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const startTime = Date.now();

    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      await serviceUsageService.recordSuccess({
        service: 'payments',
        provider: 'stripe',
        operation: 'retrieve_payment_intent',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        metadata: {
          paymentIntentId,
          status: paymentIntent.status,
        },
      });
      return paymentIntent;
    } catch (error) {
      await serviceUsageService.recordFailure({
        service: 'payments',
        provider: 'stripe',
        operation: 'retrieve_payment_intent',
        usageCount: 1,
        durationMs: Date.now() - startTime,
        errorMessage: (error as Error).message,
        metadata: { paymentIntentId },
      });
      throw error;
    }
  }

  constructWebhookEvent(payload: string, signature: string, secret: string): Stripe.Event {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
