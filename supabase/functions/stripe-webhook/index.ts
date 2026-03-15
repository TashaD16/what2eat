import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

serve(async (req: Request) => {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

        await supabase.from('user_subscriptions').update({
          plan: 'pro',
          status: 'active',
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const isActive = subscription.status === 'active'
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

        await supabase.from('user_subscriptions').update({
          plan: isActive ? 'pro' : 'free',
          status: subscription.status,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase.from('user_subscriptions').update({
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
