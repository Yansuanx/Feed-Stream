import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  Share,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Lock,
  Clock,
  Calendar,
  Check,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/lib/subscription-context';
import { Article, PAYWALL_SCROLL_THRESHOLD, PAYWALL_TIME_THRESHOLD_SEC, PAYWALL_PREMIUM_COUNT_THRESHOLD } from '@/lib/types';
import {
  fetchArticleBySlug,
  incrementArticleViews,
  trackEvent,
  isBookmarked,
  addBookmark,
  removeBookmark,
  upsertReadingHistory,
} from '@/lib/articles';
import { LoadingSpinner } from '@/components/Skeleton';

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, profile, incrementFreeArticleRead } = useAuth();
  const { isPremium } = useSubscription();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);

  const contentHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const paywallTriggeredRef = useRef(false);
  const historySavedRef = useRef(false);

  // Load article
  useEffect(() => {
    if (!slug) return;
    startTimeRef.current = Date.now();
    (async () => {
      setLoading(true);
      try {
        const data = await fetchArticleBySlug(slug);
        if (!data) {
          setError('Article not found');
          return;
        }
        setArticle(data);
        incrementArticleViews(data.id);
        trackEvent('article_view', { article_id: data.id, slug: data.slug }, user?.id);

        if (user) {
          const isBm = await isBookmarked(user.id, data.id);
          setBookmarked(isBm);
        }

        if (data.is_premium && !isPremium) {
          setPremiumCount((c) => c + 1);
          if (user) {
            const { limitReached } = await incrementFreeArticleRead();
            if (limitReached) {
              setShowPaywall(true);
              paywallTriggeredRef.current = true;
            }
          } else {
            setShowPaywall(true);
            paywallTriggeredRef.current = true;
          }
        }
      } catch (e) {
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Time-based paywall trigger
  useEffect(() => {
    if (!article || isPremium || paywallTriggeredRef.current) return;
    if (!article.is_premium) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(elapsed);
      if (elapsed >= PAYWALL_TIME_THRESHOLD_SEC && !paywallTriggeredRef.current) {
        setShowPaywall(true);
        paywallTriggeredRef.current = true;
        trackEvent('paywall_trigger', { trigger: 'time', article_id: article.id }, user?.id);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [article, isPremium, user]);

  // Save reading history on unmount
  useEffect(() => {
    return () => {
      if (article && user && !historySavedRef.current) {
        historySavedRef.current = true;
        const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        upsertReadingHistory(user.id, article.id, scrollDepth, totalTime);
      }
    };
  }, [article, user, scrollDepth]);

  const contentParagraphs = useMemo(() => {
    if (!article) return [];
    return article.content.split('\n\n').filter((p) => p.trim().length > 0);
  }, [article]);

  const visibleParagraphs = useMemo(() => {
    if (isPremium || !showPaywall) return contentParagraphs;
    const cutoff = Math.ceil(contentParagraphs.length * PAYWALL_SCROLL_THRESHOLD);
    return contentParagraphs.slice(0, cutoff);
  }, [contentParagraphs, isPremium, showPaywall]);

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    scrollYRef.current = contentOffset.y;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      const depth = Math.min(contentOffset.y / maxScroll, 1);
      setScrollDepth(depth);

      // Scroll-based paywall trigger
      if (
        article?.is_premium &&
        !isPremium &&
        !paywallTriggeredRef.current &&
        depth >= PAYWALL_SCROLL_THRESHOLD
      ) {
        setShowPaywall(true);
        paywallTriggeredRef.current = true;
        trackEvent('paywall_trigger', { trigger: 'scroll', article_id: article.id, depth }, user?.id);
      }
    }
  }, [article, isPremium, user]);

  // Premium count-based trigger
  useEffect(() => {
    if (
      article?.is_premium &&
      !isPremium &&
      !paywallTriggeredRef.current &&
      premiumCount >= PAYWALL_PREMIUM_COUNT_THRESHOLD
    ) {
      setShowPaywall(true);
      paywallTriggeredRef.current = true;
      trackEvent('paywall_trigger', { trigger: 'premium_count', count: premiumCount }, user?.id);
    }
  }, [premiumCount, article, isPremium]);

  const handleBookmark = async () => {
    if (!user || !article) {
      router.push('/auth/login');
      return;
    }
    try {
      if (bookmarked) {
        await removeBookmark(user.id, article.id);
        setBookmarked(false);
      } else {
        await addBookmark(user.id, article.id);
        setBookmarked(true);
        trackEvent('bookmark_add', { article_id: article.id }, user.id);
      }
    } catch (e) {
      console.error('Bookmark error:', e);
    }
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({ message: article.title });
    } catch (e) {
      // share cancelled
    }
  };

  if (loading) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[s.errorText, { color: colors.textSecondary }]}>{error ?? 'Unknown error'}</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backBtnText, { color: colors.gold }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.topActions}>
          <Pressable onPress={handleShare} hitSlop={8}>
            <Share2 size={20} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={handleBookmark} hitSlop={8}>
            {bookmarked ? (
              <BookmarkCheck size={22} color={colors.gold} strokeWidth={2} />
            ) : (
              <Bookmark size={22} color={colors.textPrimary} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={!showPaywall || isPremium || !article.is_premium}
      >
        {/* Hero Image with gradient overlay */}
        {article.image_url && (
          <View style={s.heroImageWrap}>
            <Image source={{ uri: article.image_url }} style={s.heroImage} />
            <View style={s.heroGradient} />
          </View>
        )}

        {/* Article Header */}
        <View style={s.header}>
          {article.category && (
            <Text style={[s.category, { color: colors.gold }]}>
              {article.category.name.toUpperCase()}
            </Text>
          )}
          <Text style={[s.title, { color: colors.textPrimary }]}>
            {article.title}
          </Text>
          <View style={s.metaRow}>
            <Text style={[s.author, { color: colors.textSecondary }]}>
              By {article.author}
            </Text>
            <View style={[s.metaDivider, { backgroundColor: colors.textTertiary }]} />
            <View style={s.metaItem}>
              <Calendar size={12} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[s.metaText, { color: colors.textTertiary }]}>
                {formatDate(article.published_at)}
              </Text>
            </View>
            <View style={s.metaItem}>
              <Clock size={12} color={colors.textTertiary} strokeWidth={2} />
              <Text style={[s.metaText, { color: colors.textTertiary }]}>
                {article.reading_time_min} min
              </Text>
            </View>
          </View>
        </View>

        {/* Article Content */}
        <View style={s.content}>
          <Text style={[s.summary, { color: colors.textSecondary }]}>
            {article.summary}
          </Text>
          {visibleParagraphs.map((para, i) => (
            <Text
              key={i}
              style={[s.paragraph, { color: colors.textPrimary }]}
            >
              {para}
            </Text>
          ))}

          {/* Blurred content preview when paywall is active */}
          {article.is_premium && !isPremium && showPaywall && contentParagraphs.length > visibleParagraphs.length && (
            <View style={s.blurSection}>
              {contentParagraphs.slice(visibleParagraphs.length).map((para, i) => (
                <Text key={i} style={[s.paragraph, s.blurredText, { color: colors.textPrimary }]}>
                  {para}
                </Text>
              ))}
              <View style={[s.blurOverlay, { backgroundColor: colors.background }]} />
            </View>
          )}

          {/* Premium Paywall Overlay */}
          {article.is_premium && !isPremium && (
            <View style={s.paywallSection}>
              <View style={[s.paywallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.paywallIcon, { backgroundColor: colors.gold + '20' }]}>
                  <Lock size={24} color={colors.gold} strokeWidth={2} />
                </View>
                <Text style={[s.paywallTitle, { color: colors.textPrimary }]}>
                  Continue Reading with Premium
                </Text>
                <Text style={[s.paywallSub, { color: colors.textSecondary }]}>
                  Unlock this article and all premium content
                </Text>
                <View style={s.benefitsList}>
                  {[
                    'Unlimited articles',
                    'Exclusive analysis',
                    'Daily market insights',
                    'Offline reading',
                    'Ad-free experience',
                  ].map((benefit) => (
                    <View key={benefit} style={s.benefitRow}>
                      <View style={[s.benefitCheck, { backgroundColor: colors.gold }]}>
                        <Check size={10} color={colors.surface} strokeWidth={3} />
                      </View>
                      <Text style={[s.benefitText, { color: colors.textPrimary }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  onPress={() => router.push('/paywall')}
                  style={({ pressed }) => [
                    s.unlockBtn,
                    { backgroundColor: colors.gold },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={s.unlockBtnText}>Unlock Premium</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.back()}
                  style={s.continueLimitedBtn}
                  hitSlop={8}
                >
                  <Text style={[s.continueLimitedText, { color: colors.textSecondary }]}>
                    Continue with Limited Access
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topActions: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  heroImageWrap: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  category: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    lineHeight: 34,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    marginBottom: 24,
  },
  author: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  metaDivider: {
    width: 1,
    height: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter',
    fontSize: 12,
    marginLeft: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  summary: {
    fontFamily: 'Inter-Medium',
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  paragraph: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 18,
  },
  blurSection: {
    position: 'relative',
    overflow: 'hidden',
    height: 120,
  },
  blurredText: {
    opacity: 0.15,
    filter: 'blur(8px)',
  },
  blurOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  paywallSection: {
    marginTop: 20,
  },
  paywallCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  paywallIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  paywallTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  paywallSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 28,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  unlockBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  unlockBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#000',
  },
  continueLimitedBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  continueLimitedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
