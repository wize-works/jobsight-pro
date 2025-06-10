
'use client';

import { useState, useEffect } from 'react';
import { getCurrentSubscription, getSubscriptionPlans, createSubscription, cancelSubscription } from '@/app/actions/subscriptions';
import type { BusinessSubscription, SubscriptionPlan, BillingInterval } from '@/types/subscription';

export const TabSubscription = () => {
  const [currentSubscription, setCurrentSubscription] = useState<BusinessSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subscription, subscriptionPlans] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionPlans()
      ]);
      
      setCurrentSubscription(subscription);
      setPlans(subscriptionPlans);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanChange = async (planId: string) => {
    try {
      setIsUpdating(true);
      const result = await createSubscription(planId, billingInterval);
      
      if (result.success) {
        await loadData(); // Refresh data
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = `
          <div class="alert alert-success">
            <span>Subscription updated successfully!</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } else {
        // Show error message
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = `
          <div class="alert alert-error">
            <span>Error: ${result.error}</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setIsUpdating(true);
      const result = await cancelSubscription();
      
      if (result.success) {
        await loadData(); // Refresh data
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = `
          <div class="alert alert-success">
            <span>Subscription canceled successfully!</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } else {
        // Show error message
        const toast = document.createElement('div');
        toast.className = 'toast toast-top toast-end';
        toast.innerHTML = `
          <div class="alert alert-error">
            <span>Error: ${result.error}</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32 w-full"></div>
        <div className="skeleton h-64 w-full"></div>
      </div>
    );
  }

  const currentPlan = plans.find(plan => plan.id === currentSubscription?.plan_id);

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Current Subscription</h3>
          {currentSubscription && currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">{currentPlan.name}</div>
                  <div className="text-sm text-base-content/60">
                    ${billingInterval === 'monthly' ? currentPlan.monthly_price : currentPlan.annual_price}
                    /{billingInterval === 'monthly' ? 'month' : 'year'}
                  </div>
                </div>
                <div className="badge badge-success">{currentSubscription.status}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm"><strong>Users included:</strong> {currentPlan.included_users}</div>
                <div className="text-sm"><strong>Started:</strong> {currentSubscription.start_date ? new Date(currentSubscription.start_date).toLocaleDateString() : 'N/A'}</div>
              </div>

              <div className="flex gap-2">
                <button 
                  className="btn btn-error btn-sm"
                  onClick={handleCancelSubscription}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-base-content/60">
              No active subscription. Choose a plan below to get started.
            </div>
          )}
        </div>
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex justify-center">
        <div className="join">
          <button 
            className={`btn join-item ${billingInterval === 'monthly' ? 'btn-active' : ''}`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`btn join-item ${billingInterval === 'annual' ? 'btn-active' : ''}`}
            onClick={() => setBillingInterval('annual')}
          >
            Annual
            <span className="badge badge-success ml-2">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billingInterval === 'monthly' ? plan.monthly_price : plan.annual_price;
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const isPopular = plan.id === 'pro';
          
          return (
            <div 
              key={plan.id} 
              className={`card bg-base-100 shadow-sm border-2 ${
                isCurrentPlan ? 'border-primary' : 'border-base-200'
              } ${isPopular ? 'border-accent' : ''}`}
            >
              {isPopular && (
                <div className="badge badge-accent absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </div>
              )}
              
              <div className="card-body">
                <h3 className="card-title justify-between">
                  {plan.name}
                  {isCurrentPlan && <span className="badge badge-primary">Current</span>}
                </h3>
                
                <div className="text-3xl font-bold">
                  ${price}
                  <span className="text-sm font-normal text-base-content/60">
                    /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div className="space-y-2 my-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <i className="fas fa-check text-success text-sm"></i>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="card-actions justify-end mt-auto">
                  {isCurrentPlan ? (
                    <button className="btn btn-outline w-full" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      className={`btn w-full ${
                        plan.id === 'starter' ? 'btn-outline' : 
                        isPopular ? 'btn-accent' : 'btn-primary'
                      }`}
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Processing...' : 
                       currentSubscription ? 'Switch to This Plan' : 'Get Started'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Need More Users?</h3>
          <p className="text-sm text-base-content/60">
            Additional users can be added to Pro and Business plans. Extra users are charged at:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-4">
            <li>Pro: $5/user/month</li>
            <li>Business: $3/user/month</li>
            <li>Enterprise: Unlimited users included</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
