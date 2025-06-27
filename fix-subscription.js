/**
 * Temporary utility to update existing business subscription to Pro plan
 * This can be run in the browser console to fix the subscription plan.
 */

// Run this in the browser console after authenticating:
async function fixSubscriptionPlan() {
    try {
        const response = await fetch('/api/fix-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            console.log('✅ Subscription updated to Pro plan');
            window.location.reload();
        } else {
            console.error('❌ Failed to update subscription');
        }
    } catch (error) {
        console.error('❌ Error updating subscription:', error);
    }
}

// Or manually update via SQL:
/*
UPDATE business_subscriptions 
SET plan_id = 'pro' 
WHERE plan_id = 'personal' 
AND status = 'active';
*/
