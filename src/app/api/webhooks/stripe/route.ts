
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';
import type { StripeSubscriptionInsert, StripeInvoiceInsert, StripePaymentEventInsert } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const businessId = session.metadata?.business_id;
        const planId = session.metadata?.plan_id;

        if (!businessId || !planId) {
          console.error('Missing business_id or plan_id in session metadata');
          break;
        }

        // Get the subscription from the session
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Save stripe subscription
        await supabase.from('stripe_subscriptions').insert({
          id: crypto.randomUUID(),
          business_id: businessId,
          stripe_subscription_id: subscription.id,
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          created_at: new Date().toISOString(),
        } as StripeSubscriptionInsert);

        // Check if business subscription already exists
        const { data: existingBusinessSub } = await supabase
          .from('business_subscriptions')
          .select('id')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .single();

        if (existingBusinessSub) {
          // Update existing subscription
          await supabase
            .from('business_subscriptions')
            .update({
              plan_id: planId,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingBusinessSub.id);
        } else {
          // Create new subscription
          await supabase
            .from('business_subscriptions')
            .insert({
              id: crypto.randomUUID(),
              business_id: businessId,
              plan_id: planId,
              start_date: new Date().toISOString(),
              status: 'active',
              stripe_subscription_id: subscription.id,
              created_at: new Date().toISOString(),
            });
        }

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const businessId = subscription.metadata?.business_id;

        if (!businessId) {
          console.error('Missing business_id in subscription metadata');
          break;
        }

        // Update stripe subscription
        await supabase
          .from('stripe_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .eq('business_id', businessId);

        // Update business subscription status
        const newStatus = subscription.status === 'active' ? 'active' : 'canceled';
        await supabase
          .from('business_subscriptions')
          .update({
            status: newStatus,
            end_date: subscription.status === 'canceled' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .eq('business_id', businessId);

        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        
        // Check if invoice has a subscription
        if (!invoice.subscription) {
          console.log('Invoice has no subscription, skipping');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const businessId = subscription.metadata?.business_id;

        if (!businessId) {
          console.error('Missing business_id in subscription metadata');
          break;
        }

        // Save invoice
        await supabase.from('stripe_invoices').upsert({
          id: crypto.randomUUID(),
          business_id: businessId,
          stripe_invoice_id: invoice.id,
          amount_due: invoice.amount_due,
          amount_paid: invoice.amount_paid,
          status: invoice.status,
          due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
          paid_at: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : null,
          created_at: new Date().toISOString(),
        } as StripeInvoiceInsert);

        break;
      }
    }

    // Log all events
    await supabase.from('stripe_payment_events').insert({
      id: crypto.randomUUID(),
      business_id: event.data.object.metadata?.business_id || 'unknown',
      event_id: event.id,
      event_type: event.type,
      data: event.data.object,
      created_at: new Date().toISOString(),
    } as StripePaymentEventInsert);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
