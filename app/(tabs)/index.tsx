import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { Search, User, Lock, Clock, ArrowRight, TrendingUp, Sun, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { Article, Category } from '@/lib/types';
import {
  fetchCategories,
  fetchFeaturedArticle,
  fetchLatestArticles,
  fetchReadArticleIds,
  trackEvent,
} from '@/lib/articles';
import { useRealtimeFeed } from '@/lib/use-realtime-feed';
import { ArticleCard } from '@/components/ArticleCard';
import { BreakingNewsTicker } from '@/components/BreakingNewsTicker';
import { RecommendedSection } from '@/components/RecommendedSection';
import { HeroSkeleton, ArticleCardSkeleton, LoadingSpinner } from '@/components/Skeleton';

export default function HomeScreen() {
  const { colors, isDark, toggle } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [featured, setFeatured] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const articlesRef = useRef<Article[]>([]);

  // Keep ref in sync for realtime callbacks
  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, hero, latest, read] = await Promise.all([
        fetchCategories(),
        fetchFeaturedArticle(),
        fetchLatestArticles(0, 10),
        user ? fetchReadArticleIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setCategories(cats);
      setFeatured(hero);
      setArticles(latest);
      setReadIds(read);
      setPage(1);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Real-time news feed subscription
  const handleNewArticle = useCallback((article: Article) => {
    // Only add if it matches the active category filter (or no filter)
    if (activeCategory && article.category_id !== activeCategory) return;
    // Avoid duplicates
    if (articlesRef.current.some((a) => a.id === article.id)) return;
    setNewArticlesCount((c) => c + 1);
  }, [activeCategory]);

  const handleArticleUpdate = useCallback((article: Article) => {
    setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, ...article } : a)));
    setFeatured((prev) => (prev?.id === article.id ? { ...prev, ...article } : prev));
  }, []);

  const handleArticleDelete = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setFeatured((prev) => (prev?.id === id ? null : prev));
  }, []);

  const handleFeaturedChange = useCallback(async () => {
    const hero = await fetchFeaturedArticle();
    setFeatured(hero);
  }, []);

  useRealtimeFeed({
    onArticleInsert: handleNewArticle,
    onArticleUpdate: handleArticleUpdate,
    onArticleDelete: handleArticleDelete,
    onFeaturedChange: handleFeaturedChange,
    enabled: true,
  });

  // Mark as live after initial load
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsLive(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await fetchLatestArticles(page, 10, activeCategory ?? undefined);
      if (more.length > 0) {
        setArticles((prev) => [...prev, ...more]);
        setPage((p) => p + 1);
      }
    } catch (e) {
      console.error('Load more error:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, activeCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [hero, latest, read] = await Promise.all([
        fetchFeaturedArticle(),
        fetchLatestArticles(0, 10, activeCategory ?? undefined),
        user ? fetchReadArticleIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setFeatured(hero);
      setArticles(latest);
      setReadIds(read);
      setPage(1);
      setNewArticlesCount(0);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [activeCategory, user]);

  const loadNewArticles = useCallback(async () => {
    try {
      const latest = await fetchLatestArticles(0, 10, activeCategory ?? undefined);
      setArticles(latest);
      setPage(1);
      setNewArticlesCount(0);
    } catch (e) {
      console.error('Load new articles error:', e);
    }
  }, [activeCategory]);

  const selectCategory = useCallback(async (catId: string | null) => {
    setActiveCategory(catId);
    setLoading(true);
    setNewArticlesCount(0);
    try {
      const latest = await fetchLatestArticles(0, 10, catId ?? undefined);
      setArticles(latest);
      setPage(1);
    } catch (e) {
      console.error('Category filter error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleHeroPress = () => {
    if (featured) {
      trackEvent('hero_click', { article_id: featured.id }, user?.id);
      router.push(`/article/${featured.slug}`);
    }
  };

  const renderHeader = () => (
    <>
      {/* Top Navigation */}
      <View style={[s.topNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[s.logo, { color: colors.textPrimary }]}>
          Feed{' '}
          <Text style={{ color: colors.gold }}>Stream</Text>
        </Text>
        <View style={s.navActions}>
          {/* Live indicator */}
          {isLive && (
            <View style={s.liveBadge}>
              <View style={[s.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[s.liveText, { color: colors.success }]}>LIVE</Text>
            </View>
          )}
          {/* Light/Dark toggle */}
          <Pressable onPress={toggle} hitSlop={8}>
            {isDark ? (
              <Sun size={22} color={colors.textPrimary} strokeWidth={2} />
            ) : (
              <Moon size={22} color={colors.textPrimary} strokeWidth={2} />
            )}
          </Pressable>
          <Pressable onPress={() => router.push('/search')} hitSlop={8}>
            <Search size={22} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={() => router.push(user ? '/(tabs)/profile' : '/auth/login')}
            hitSlop={8}
          >
            <User size={22} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* New articles banner */}
      {newArticlesCount > 0 && (
        <Pressable
          onPress={loadNewArticles}
          style={({ pressed }) => [
            s.newArticlesBanner,
            { backgroundColor: colors.gold },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={s.newArticlesText}>
            {newArticlesCount} new {newArticlesCount === 1 ? 'article' : 'articles'} — tap to load
          </Text>
        </Pressable>
      )}

      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Category Tabs */}
      <View style={[s.categoryBar, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryScroll}>
          <Pressable
            onPress={() => selectCategory(null)}
            style={[
              s.categoryTab,
              activeCategory === null && { backgroundColor: colors.textPrimary },
            ]}
          >
            <Text
              style={[
                s.categoryTabText,
                { color: activeCategory === null ? colors.surface : colors.textSecondary },
              ]}
            >
              All
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => selectCategory(cat.id)}
              style={[
                s.categoryTab,
                activeCategory === cat.id && { backgroundColor: colors.textPrimary },
              ]}
            >
              <Text
                style={[
                  s.categoryTabText,
                  { color: activeCategory === cat.id ? colors.surface : colors.textSecondary },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Hero Story */}
      {loading ? (
        <View style={s.heroContainer}>
          <HeroSkeleton />
        </View>
      ) : featured ? (
        <Pressable
          onPress={handleHeroPress}
          style={({ pressed }) => [s.heroContainer, pressed && { opacity: 0.95 }]}
        >
          <View style={s.heroImageWrap}>
            {featured.image_url && (
              <Image source={{ uri: featured.image_url }} style={s.heroImage} />
            )}
            {featured.is_breaking && (
              <View style={[s.breakingBadge, { backgroundColor: colors.gold }]}>
                <TrendingUp size={11} color={colors.black} strokeWidth={2.5} />
                <Text style={s.breakingText}>BREAKING</Text>
              </View>
            )}
            {featured.is_premium && (
              <View style={s.heroLock}>
                <Lock size={14} color={colors.surface} strokeWidth={2.5} />
              </View>
            )}
          </View>
          <View style={s.heroBody}>
            {featured.category && (
              <Text style={[s.heroCategory, { color: colors.gold }]}>
                {featured.category.name.toUpperCase()}
              </Text>
            )}
            <Text style={[s.heroTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {featured.title}
            </Text>
            <Text style={[s.heroSummary, { color: colors.textSecondary }]} numberOfLines={3}>
              {featured.summary}
            </Text>
            <View style={s.heroFooter}>
              <View style={s.heroMeta}>
                <Text style={[s.heroAuthor, { color: colors.textSecondary }]}>
                  {featured.author}
                </Text>
                <View style={[s.heroMetaDot, { backgroundColor: colors.textTertiary }]} />
                <Clock size={12} color={colors.textTertiary} strokeWidth={2} />
                <Text style={[s.heroMetaText, { color: colors.textTertiary }]}>
                  {featured.reading_time_min} min read
                </Text>
              </View>
              <View style={[s.readMoreBtn, { backgroundColor: colors.textPrimary }]}>
                <Text style={[s.readMoreText, { color: colors.surface }]}>Read More</Text>
                <ArrowRight size={14} color={colors.surface} strokeWidth={2} />
              </View>
            </View>
          </View>
        </Pressable>
      ) : null}

      {/* Recommended For You */}
      {!activeCategory && <RecommendedSection />}

      {/* Latest News Header */}
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Latest News</Text>
      </View>
    </>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <LoadingSpinner size="small" />
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCard article={item} isRead={readIds.has(item.id)} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: 20 }}>
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </View>
          ) : (
            <View style={s.empty}>
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                No articles found
              </Text>
            </View>
          )
        }
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  navActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  newArticlesBanner: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  newArticlesText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#000',
  },
  categoryBar: {
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  categoryTabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  heroContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroImageWrap: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  breakingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  breakingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#000',
    letterSpacing: 0.5,
  },
  heroLock: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBody: {
    paddingBottom: 8,
  },
  heroCategory: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 10,
  },
  heroSummary: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroAuthor: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  heroMetaText: {
    fontFamily: 'Inter',
    fontSize: 12,
    marginLeft: 3,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  readMoreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 15,
  },
});
