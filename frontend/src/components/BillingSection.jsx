import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subscriptionAPI } from '@/services/api';
import { Check, Loader2, Crown, Zap, Building2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const planIcons = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
  enterprise: Building2,
};

const PlanCard = ({ plan, planId, currentPlan, onSelect, loading }) => {
  const isCurrentPlan = currentPlan === planId;
  const Icon = planIcons[planId] || Sparkles;
  
  return (
    <Card 
      className={`relative transition-all ${
        isCurrentPlan 
          ? 'border-blue-500 border-2 bg-blue-50/50' 
          : 'hover:border-blue-300 hover:shadow-md'
      }`}
      data-testid={`plan-card-${planId}`}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600">Current Plan</Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-2">
        <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-[Manrope]">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
          {plan.price > 0 && <span className="text-slate-500">/month</span>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>{plan.users === -1 ? 'Unlimited' : plan.users} team member{plan.users !== 1 ? 's' : ''}</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>{plan.tasks === -1 ? 'Unlimited' : plan.tasks} tasks{plan.tasks === -1 ? '' : '/month'}</span>
          </li>
          {plan.features.includes('inventory') && (
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Inventory management</span>
            </li>
          )}
          {plan.features.includes('maps') && (
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>GPS & Map tracking</span>
            </li>
          )}
          {plan.features.includes('analytics') && (
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Advanced analytics</span>
            </li>
          )}
          {plan.features.includes('sms') && (
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>SMS notifications</span>
            </li>
          )}
          {plan.features.includes('email') && (
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Email alerts</span>
            </li>
          )}
          {plan.features.includes('priority_support') && (
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Priority support</span>
            </li>
          )}
        </ul>
        
        <Button
          className={`w-full ${isCurrentPlan ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          disabled={isCurrentPlan || loading || plan.price === 0}
          onClick={() => onSelect(planId)}
          data-testid={`select-plan-${planId}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : plan.price === 0 ? (
            'Free'
          ) : (
            'Upgrade'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export const BillingSection = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Check for payment callback
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    
    if (sessionId && success === 'true') {
      pollPaymentStatus(sessionId);
    }
    
    const cancelled = searchParams.get('cancelled');
    if (cancelled === 'true') {
      toast.error('Payment was cancelled');
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getSubscription(),
      ]);
      setPlans(plansRes.data.plans);
      setSubscription(subRes.data);
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      toast.error('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const response = await subscriptionAPI.getCheckoutStatus(sessionId);
      
      if (response.data.payment_status === 'paid') {
        toast.success('Payment successful! Your subscription is now active.');
        fetchData(); // Refresh subscription data
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
      
      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const handleSelectPlan = async (planId) => {
    setProcessingPlan(planId);
    
    try {
      const response = await subscriptionAPI.createCheckout(planId);
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="billing-section">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Manrope]">Current Subscription</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                {React.createElement(planIcons[subscription?.plan_id] || Sparkles, { 
                  className: "h-6 w-6 text-blue-600" 
                })}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{subscription?.plan_name || 'Free'} Plan</p>
                <p className="text-sm text-slate-500">
                  {subscription?.max_users === -1 ? 'Unlimited' : subscription?.max_users} users • 
                  {subscription?.max_tasks === -1 ? ' Unlimited' : ` ${subscription?.max_tasks}`} tasks
                </p>
              </div>
            </div>
            <Badge className={subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
              {subscription?.status || 'active'}
            </Badge>
          </div>
          
          {subscription?.expires_at && (
            <p className="text-sm text-slate-500 mt-3">
              Renews on {new Date(subscription.expires_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 font-[Manrope]">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(plans).map(([planId, plan]) => (
            <PlanCard
              key={planId}
              planId={planId}
              plan={plan}
              currentPlan={subscription?.plan_id}
              onSelect={handleSelectPlan}
              loading={processingPlan === planId}
            />
          ))}
        </div>
      </div>

      {/* Payment Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Payments are processed securely via Stripe. You can cancel anytime.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSection;
