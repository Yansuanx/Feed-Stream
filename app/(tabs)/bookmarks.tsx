import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, RefreshControl } from 'react-native';
import { Bookmark as BookmarkIcon, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { Bookmark } from '@/lib/types';
import { fetchBookmarks } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleCardSkeleton, LoadingSpinner } from '@/components/Skeleton';

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookmarks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchBookmarks(user.id);
      setBookmarks(data);
    } catch (e) {
      console.error('Bookmarks load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  }, [loadBookmarks]);

  if (!user) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Saved</Text>
        </View>
        <View style={s.emptyState}>
          <BookmarkIcon size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            Sign in to save articles
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Bookmark articles to read them later
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={({ pressed }) => [
              s.signInBtn,
              { backgroundColor: colors.textPrimary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[s.signInBtnText, { color: colors.surface }]}>Sign In</Text>
            <ArrowRight size={16} color={colors.surface} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Saved</Text>
        <Text style={[s.count, { color: colors.textSecondary }]}>
          {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'}
        </Text>
      </View>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.article ? <ArticleCard article={item.article} /> : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingHorizontal: 20 }}>
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </View>
          ) : (
            <View style={s.emptyState}>
              <BookmarkIcon size={48} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
                No saved articles yet
              </Text>
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                Tap the bookmark icon on any article to save it here
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)')}
                style={({ pressed }) => [
                  s.signInBtn,
                  { backgroundColor: colors.textPrimary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[s.signInBtnText, { color: colors.surface }]}>Browse Articles</Text>
                <ArrowRight size={16} color={colors.surface} strokeWidth={2} />
              </Pressable>
            </View>
          )
        }
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
  },
  count: {
    fontFamily: 'Inter',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  signInBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
