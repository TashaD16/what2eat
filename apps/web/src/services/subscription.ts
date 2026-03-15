import { supabase } from './supabase'

export interface Subscription {
  plan: 'free' | 'pro'
  status: string
  current_period_end: string | null
}

export async function getSubscription(userId: string): Promise<Subscription> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .single()

  if (!data) return { plan: 'free', status: 'inactive', current_period_end: null }
  return data as Subscription
}

export function isPro(sub: Subscription | null): boolean {
  return sub?.plan === 'pro' && sub?.status === 'active'
}

export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, successUrl, cancelUrl },
  })
  if (error) throw error
  if (!data?.url) throw new Error('No checkout URL returned')
  return data.url
}
