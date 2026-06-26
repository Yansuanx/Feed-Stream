import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';

type PlanType = 'monthly' | 'yearly';
type PaywallVariant = 'A' | 'B' | 'C';

interface SubscriptionContextType {
  isPremium: boolean;
  plan: PlanType | null;
  trialActive: boolean;
  trialDaysLeft: number;
  paywallVariant: PaywallVariant;
  startTrial: (plan: PlanType) => Promise<{ error: string | null }>;
  restorePurchases: () => Promise<{ error: string | null }>;
  setPaywallVariant: (v: PaywallVariant) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [paywallVariant, setPaywallVariant] = useState<PaywallVariant>('A');
  const [trialActive, setTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);

  const isPremium = profile?.is_premium ?? false;
  const plan: PlanType | null = isPremium ? 'yearly' : null;

  const startTrial = useCallback(async (selectedPlan: PlanType) => {
    // RevenueCat integration point:
    // In a native build, this would call Purchases.purchasePackage()
    // and then update the Supabase profile via an edge function.
    // For now, we simulate a successful trial start.
    setTrialActive(true);
    setTrialDaysLeft(7);

    // Update profile to premium (simulated)
    if (profile) {
      const { supabase } = await import('./supabase');
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', profile.id);
      await refreshProfile();
    }

    return { error: null };
  }, [profile, refreshProfile]);

  const restorePurchases = useCallback(async () => {
    // RevenueCat: Purchases.restorePurchases()
    return { error: null };
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        plan,
        trialActive,
        trialDaysLeft,
        paywallVariant,
        startTrial,
        restorePurchases,
        setPaywallVariant,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
