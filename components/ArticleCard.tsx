import { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Lock, Clock, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { Article } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { isBookmarked, addBookmark, removeBookmark, trackEvent } from '@/lib/articles';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact';
  isRead?: boolean;
}

function ArticleCardBase({ article, variant = 'default', isRead = false }: ArticleCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);

  useEffect(() => {
    if (!user) return;
    isBookmarked(user.id, article.id).then(setBookmarked).catch(() => {});
  }, [user, article.id]);

  const handlePress = () => {
    router.push(`/article/${article.slug}`);
  };

  const handleBookmark = async (e: any) => {
    e?.stopPropagation?.();
    if (!user) {
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

  const titleOpacity = isRead ? 0.7 : 1;

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        onHoverIn={() => setShowBookmark(true)}
        onHoverOut={() => setShowBookmark(false)}
        style={({ pressed }) => [s.compact, pressed && { opacity: 0.7 }]}
      >
        {article.image_url && (
          <Image source={{ uri: article.image_url }} style={s.compactImage} />
        )}
        <View style={s.compactBody}>
          {article.category && (
            <Text style={[s.compactCategory, { color: colors.gold }]} numberOfLines={1}>
              {article.category.name.toUpperCase()}
            </Text>
          )}
          <Text
            style={[s.compactTitle, { color: colors.textPrimary, opacity: titleOpacity }]}
            numberOfLines={3}
          >
            {article.title}
          </Text>
          <View style={s.compactMeta}>
            <Clock size={11} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[s.compactMetaText, { color: colors.textTertiary }]}>
              {article.reading_time_min} min read
            </Text>
            {article.is_premium && (
              <Lock size={11} color={colors.gold} strokeWidth={2.5} />
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => setShowBookmark(true)}
      onHoverOut={() => setShowBookmark(false)}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      {article.image_url && (
        <Image source={{ uri: article.image_url }} style={s.thumbnail} />
      )}
      <View style={s.body}>
        {article.category && (
          <Text style={[s.category, { color: colors.gold }]} numberOfLines={1}>
            {article.category.name.toUpperCase()}
          </Text>
        )}
        <Text
          style={[s.title, { color: colors.textPrimary, opacity: titleOpacity }]}
          numberOfLines={3}
        >
          {article.title}
        </Text>
        <View style={s.metaRow}>
          <Clock size={12} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[s.metaText, { color: colors.textTertiary }]}>
            {article.reading_time_min} min read
          </Text>
          {article.is_premium && (
            <View style={[s.lockBadge, { backgroundColor: colors.gold + '20' }]}>
              <Lock size={10} color={colors.gold} strokeWidth={2.5} />
              <Text style={[s.lockText, { color: colors.gold }]}>PREMIUM</Text>
            </View>
          )}
          {(showBookmark || bookmarked) && (
            <Pressable onPress={handleBookmark} hitSlop={8} style={s.bookmarkBtn}>
              {bookmarked ? (
                <BookmarkCheck size={16} color={colors.gold} strokeWidth={2} />
              ) : (
                <Bookmark size={16} color={colors.textTertiary} strokeWidth={2} />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const ArticleCard = memo(ArticleCardBase);

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 14,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  category: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter',
    fontSize: 11,
    marginLeft: 3,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  lockText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  compact: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  compactImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  compactBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactCategory: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 3,
  },
  compactTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  compactMetaText: {
    fontFamily: 'Inter',
    fontSize: 10,
    marginLeft: 2,
  },
});
