import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Check,
  Star,
  Shield,
  TrendingUp,
  FileText,
  BarChart3,
  Bell,
  Download,
  EyeOff,
  Clock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useSubscription } from '@/lib/subscription-context';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/articles';
import { LoadingSpinner } from '@/components/Skeleton';

type PlanType = 'monthly' | 'yearly';

interface Feature {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
}

const FEATURES: Feature[] = [
  { icon: TrendingUp, label: 'Real-time Market Insights' },
  { icon: FileText, label: 'Unlimited Articles' },
  { icon: BarChart3, label: 'Expert Editorial Analysis' },
  { icon: Bell, label: 'Breaking News Alerts' },
  { icon: Download, label: 'Offline Reading Mode' },
  { icon: EyeOff, label: 'Ad-Free Experience' },
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { startTrial, restorePurchases, paywallVariant } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [loading, setLoading] = useState(false);
  const [showUrgency, setShowUrgency] = useState(false);
  const [showDiscountEmphasis, setShowDiscountEmphasis] = useState(false);
  const mountTimeRef = useRef(Date.now());
  const visitCountRef = useRef(0);

  // A/B testing: variant determines layout and messaging
  useEffect(() => {
    if (paywallVariant === 'B') setSelectedPlan('monthly');
    else setSelectedPlan('yearly');

    // Track visit count for discount emphasis
    const count = parseInt(localStorage?.getItem('paywall_visits') ?? '0', 10) || 0;
    visitCountRef.current = count + 1;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('paywall_visits', String(visitCountRef.current));
    }
    if (visitCountRef.current >= 3) {
      setShowDiscountEmphasis(true);
    }
  }, [paywallVariant]);

  // Urgency message after 8 seconds of hesitation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowUrgency(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartTrial = async () => {
    setLoading(true);
    trackEvent('trial_start', { plan: selectedPlan, variant: paywallVariant }, user?.id);
    try {
      const { error } = await startTrial(selectedPlan);
      if (error) {
        Alert.alert('Error', error);
      } else {
        trackEvent('trial_started', { plan: selectedPlan, variant: paywallVariant }, user?.id);
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const { error } = await restorePurchases();
      if (error) Alert.alert('Error', error);
      else router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLimited = () => {
    trackEvent('paywall_dismiss', { variant: paywallVariant }, user?.id);
    router.back();
  };

  // Variant C: trial-focused messaging
  const isTrialFocused = paywallVariant === 'C';
  const headline = isTrialFocused
    ? 'Your 7-Day Free Trial Awaits'
    : "The world's financial\nintelligence, unlocked.";
  const subheadline = isTrialFocused
    ? 'Start your free trial today. No payment required upfront.'
    : 'Join professionals who read deeper, act faster, and stay ahead.';

  // Order plans based on variant
  const annualFirst = paywallVariant !== 'B';

  const renderAnnualCard = () => (
    <Pressable
      onPress={() => setSelectedPlan('yearly')}
      style={[
        s.planCard,
        {
          backgroundColor: colors.surface,
          borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border,
          borderWidth: selectedPlan === 'yearly' ? 2 : 1,
        },
        selectedPlan === 'yearly' && s.planCardSelected,
      ]}
    >
      {selectedPlan === 'yearly' && (
        <View style={[s.selectedIndicator, { backgroundColor: colors.gold }]}>
          <Check size={10} color={colors.surface} strokeWidth={3} />
        </View>
      )}
      <View style={[s.bestValueBadge, { backgroundColor: colors.gold }]}>
        <Text style={s.bestValueText}>BEST VALUE</Text>
      </View>
      <Text style={[s.planName, { color: colors.textPrimary }]}>Annual</Text>
      <Text style={[s.planPrice, { color: colors.textPrimary }]}>
        $59.99<Text style={[s.planPricePer, { color: colors.textSecondary }]}>/year</Text>
      </Text>
      <View style={[s.saveBadge, { backgroundColor: colors.gold + '20' }]}>
        <Text style={[s.saveText, { color: colors.gold }]}>Save 60%</Text>
      </View>
      <Text style={[s.trialText, { color: colors.textSecondary }]}>
        7-Day Free Trial
      </Text>
    </Pressable>
  );

  const renderMonthlyCard = () => (
    <Pressable
      onPress={() => setSelectedPlan('monthly')}
      style={[
        s.planCard,
        {
          backgroundColor: colors.surface,
          borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border,
          borderWidth: selectedPlan === 'monthly' ? 2 : 1,
        },
      ]}
    >
      {selectedPlan === 'monthly' && (
        <View style={[s.selectedIndicator, { backgroundColor: colors.gold }]}>
          <Check size={10} color={colors.surface} strokeWidth={3} />
        </View>
      )}
      <Text style={[s.planName, { color: colors.textPrimary }]}>Monthly</Text>
      <Text style={[s.planPrice, { color: colors.textPrimary }]}>
        $9.99<Text style={[s.planPricePer, { color: colors.textSecondary }]}>/month</Text>
      </Text>
      <Text style={[s.trialText, { color: colors.textSecondary }]}>
        Billed monthly
      </Text>
    </Pressable>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Section 1: Value Proposition Header */}
        <View style={s.heroSection}>
          <Text style={[s.logo, { color: colors.textPrimary }]}>
            Feed{' '}
            <Text style={{ color: colors.gold }}>Stream</Text>
          </Text>
          <Text style={[s.headline, { color: colors.textPrimary }]}>
            {headline}
          </Text>
          <Text style={[s.subheadline, { color: colors.textSecondary }]}>
            {subheadline}
          </Text>
        </View>

        {/* Section 2: Feature Grid (3x2) */}
        <View style={s.featureGrid}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <View
                key={feature.label}
                style={[s.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[s.featureIcon, { backgroundColor: colors.gold + '15' }]}>
                  <Icon size={18} color={colors.gold} strokeWidth={2} />
                </View>
                <Text style={[s.featureLabel, { color: colors.textPrimary }]}>
                  {feature.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Discount emphasis for returning users */}
        {showDiscountEmphasis && (
          <View style={[s.discountBanner, { backgroundColor: colors.gold + '15' }]}>
            <Text style={[s.discountText, { color: colors.gold }]}>
              Special offer: Save 60% on annual — back by popular demand
            </Text>
          </View>
        )}

        {/* Section 3: Pricing Cards */}
        <View style={s.pricingSection}>
          {annualFirst ? (
            <>
              {renderAnnualCard()}
              {renderMonthlyCard()}
            </>
          ) : (
            <>
              {renderMonthlyCard()}
              {renderAnnualCard()}
            </>
          )}
        </View>

        {/* Section 4: Trust Layer */}
        <View style={[s.socialProof, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.socialProofText, { color: colors.textSecondary }]}>
            Trusted by 500,000+ readers
          </Text>
          <View style={s.ratingRow}>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={16} color={colors.gold} fill={colors.gold} strokeWidth={0} />
              ))}
            </View>
            <Text style={[s.ratingText, { color: colors.textPrimary }]}>
              4.8/5
            </Text>
          </View>
        </View>

        {/* Urgency message */}
        {showUrgency && (
          <View style={[s.urgencyBanner, { backgroundColor: colors.gold + '15' }]}>
            <Clock size={14} color={colors.gold} strokeWidth={2} />
            <Text style={[s.urgencyText, { color: colors.gold }]}>
              Your trial starts instantly — cancel anytime
            </Text>
          </View>
        )}

        {/* Section 5: CTA Block */}
        <View style={s.ctaSection}>
          <Pressable
            onPress={handleStartTrial}
            disabled={loading}
            style={({ pressed }) => [
              s.ctaButton,
              { backgroundColor: colors.gold },
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={s.ctaButtonText}>Start Free Trial</Text>
            )}
          </Pressable>

          {/* Footer */}
          <View style={s.footerSection}>
            <Pressable onPress={handleRestore} hitSlop={8}>
              <Text style={[s.footerLink, { color: colors.textSecondary }]}>
                Restore Purchase
              </Text>
            </Pressable>
            <View style={s.footerLinksRow}>
              <Pressable hitSlop={8}>
                <Text style={[s.footerLink, { color: colors.textTertiary }]}>
                  Terms
                </Text>
              </Pressable>
              <Text style={[s.footerDot, { color: colors.textTertiary }]}>·</Text>
              <Pressable hitSlop={8}>
                <Text style={[s.footerLink, { color: colors.textTertiary }]}>
                  Privacy
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={handleContinueLimited} hitSlop={8} style={s.continueBtn}>
              <Text style={[s.continueText, { color: colors.textSecondary }]}>
                Continue with Limited Access
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Security note */}
        <View style={s.securityRow}>
          <Shield size={12} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[s.securityText, { color: colors.textTertiary }]}>
            Cancel anytime. Secure billing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
  },
  logo: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginBottom: 20,
  },
  headline: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  subheadline: {
    fontFamily: 'Inter',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    flex: 1,
    flexWrap: 'wrap',
  },
  discountBanner: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  discountText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  pricingSection: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  planCardSelected: {
    shadowColor: '#C9A227',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bestValueText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#000',
    letterSpacing: 0.5,
  },
  planName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 6,
  },
  planPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  planPricePer: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  saveBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  saveText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  trialText: {
    fontFamily: 'Inter',
    fontSize: 13,
  },
  socialProof: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  socialProofText: {
    fontFamily: 'Inter',
    fontSize: 13,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  urgencyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  ctaSection: {
    gap: 16,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: '#000',
  },
  footerSection: {
    alignItems: 'center',
    gap: 12,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLink: {
    fontFamily: 'Inter',
    fontSize: 13,
  },
  footerDot: {
    fontSize: 13,
  },
  continueBtn: {
    paddingVertical: 4,
  },
  continueText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
});
