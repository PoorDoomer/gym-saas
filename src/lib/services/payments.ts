import { createClient } from '@/lib/supabase/client'
import { Payment, Subscription } from '@/lib/types'

const supabase = createClient()

export interface PaymentStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingPayments: number
  activeSubscriptions: number
  revenueGrowth: number
}

// Get all payments with member information
export async function getPayments(): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:members(
          id,
          first_name,
          last_name,
          email,
          phone,
          is_active,
          created_at,
          updated_at
        )
      `)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      throw new Error('Failed to fetch payments')
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return []
  }
}

// Get all subscriptions with member and plan information
export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        member:members(
          id,
          first_name,
          last_name,
          email,
          phone,
          is_active,
          created_at,
          updated_at
        ),
        plan:membership_plans(
          id,
          name,
          description,
          price,
          duration_months,
          features,
          is_active,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      throw new Error('Failed to fetch subscriptions')
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return []
  }
}

// Get payment statistics
export async function getPaymentStats(): Promise<PaymentStats> {
  try {
    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')

    if (paymentsError) {
      console.error('Error fetching payment stats:', paymentsError)
      throw paymentsError
    }

    // Get active subscriptions
    const { count: activeSubscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'active')

    if (subscriptionsError) {
      console.error('Error fetching subscription stats:', subscriptionsError)
      throw subscriptionsError
    }

    // Calculate statistics
    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const pendingPayments = payments?.filter(p => p.payment_status === 'pending').length || 0

    // Calculate monthly revenue (current month)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const monthlyRevenue = payments?.filter(p => 
      new Date(p.payment_date) >= currentMonth
    ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Calculate previous month revenue for growth
    const previousMonth = new Date(currentMonth)
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    
    const previousMonthRevenue = payments?.filter(p => {
      const paymentDate = new Date(p.payment_date)
      return paymentDate >= previousMonth && paymentDate < currentMonth
    }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    const revenueGrowth = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      pendingPayments,
      activeSubscriptions: activeSubscriptions || 0,
      revenueGrowth: Math.round(revenueGrowth)
    }
  } catch (error) {
    console.error('Failed to fetch payment stats:', error)
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingPayments: 0,
      activeSubscriptions: 0,
      revenueGrowth: 0
    }
  }
}

// Create a new payment
export async function createPayment(paymentData: Partial<Payment>): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        member_id: paymentData.member_id,
        subscription_id: paymentData.subscription_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        payment_method: paymentData.payment_method,
        payment_status: paymentData.payment_status || 'pending',
        payment_date: paymentData.payment_date || new Date().toISOString(),
        description: paymentData.description,
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating payment:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create payment:', error)
    return null
  }
}

// Update payment status
export async function updatePaymentStatus(paymentId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('payments')
      .update({ 
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    if (error) {
      console.error('Error updating payment status:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to update payment status:', error)
    return false
  }
} 