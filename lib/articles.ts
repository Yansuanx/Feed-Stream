import { supabase } from './supabase';
import { Article, Category, Bookmark, ReadingHistoryEntry, NotificationPreferences } from './types';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as Category[];
}

export async function fetchFeaturedArticle(): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, category:categories(*)')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Article | null;
}

export async function fetchBreakingNews(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, category:categories(*)')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data as Article[]) ?? [];
}

export async function fetchLatestArticles(
  page: number = 0,
  pageSize: number = 10,
  categoryId?: string | null
): Promise<Article[]> {
  let query = supabase
    .from('articles')
    .select('*, category:categories(*)')
    .order('published_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Article[]) ?? [];
}

export async function fetchRecommendedArticles(userId: string, limit: number = 5): Promise<Article[]> {
  // Rule-based personalization: find categories the user reads most, then fetch
  // recent articles from those categories that the user hasn't read yet.
  const { data: history } = await supabase
    .from('reading_history')
    .select('article:articles(category_id)')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(50);

  const categoryCounts: Record<string, number> = {};
  (history ?? []).forEach((h: any) => {
    const catId = h.article?.category_id;
    if (catId) categoryCounts[catId] = (categoryCounts[catId] ?? 0) + 1;
  });

  const readArticleIds = (history ?? []).map((h: any) => h.article?.id).filter(Boolean);

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  let query = supabase
    .from('articles')
    .select('*, category:categories(*)')
    .order('published_at', { ascending: false })
    .limit(limit * 2);

  if (topCategories.length > 0) {
    query = query.in('category_id', topCategories);
  }

  if (readArticleIds.length > 0) {
    query = query.not('id', 'in', `(${readArticleIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) {
    // Fallback to latest articles
    return fetchLatestArticles(0, limit);
  }
  return (data as Article[]).slice(0, limit);
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as Article | null;
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, category:categories(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Article | null;
}

export async function searchArticles(
  query: string,
  categoryId?: string | null,
  author?: string | null
): Promise<Article[]> {
  let q = supabase
    .from('articles')
    .select('*, category:categories(*)')
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,author.ilike.%${query}%`)
    .order('published_at', { ascending: false })
    .limit(30);

  if (categoryId) {
    q = q.eq('category_id', categoryId);
  }
  if (author) {
    q = q.ilike('author', `%${author}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data as Article[]) ?? [];
}

export async function fetchAuthors(): Promise<string[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('author')
    .order('author');
  if (error) return [];
  const unique = [...new Set((data ?? []).map((d: any) => d.author))];
  return unique;
}

export async function incrementArticleViews(articleId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_article_views', { article_id: articleId });
  if (error) console.warn('Failed to increment views:', error.message);
}

export async function fetchBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*, article:articles(*, category:categories(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Bookmark[]) ?? [];
}

export async function isBookmarked(userId: string, articleId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function addBookmark(userId: string, articleId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, article_id: articleId });
  if (error) throw error;
}

export async function removeBookmark(userId: string, articleId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('article_id', articleId);
  if (error) throw error;
}

export async function trackEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
  userId?: string
): Promise<void> {
  const { error } = await supabase
    .from('analytics_events')
    .insert({ event_type: eventType, event_data: eventData, user_id: userId ?? null });
  if (error) console.warn('Analytics track failed:', error.message);
}

// Reading history
export async function upsertReadingHistory(
  userId: string,
  articleId: string,
  scrollDepth: number,
  timeSpentSec: number
): Promise<void> {
  const { error } = await supabase.rpc('upsert_reading_history', {
    p_user_id: userId,
    p_article_id: articleId,
    p_scroll_depth: scrollDepth,
    p_time_spent: timeSpentSec,
  });
  if (error) console.warn('Reading history upsert failed:', error.message);
}

export async function fetchReadArticleIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('reading_history')
    .select('article_id')
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data ?? []).map((d: any) => d.article_id));
}

export async function fetchReadingHistory(userId: string): Promise<ReadingHistoryEntry[]> {
  const { data, error } = await supabase
    .from('reading_history')
    .select('*, article:articles(*, category:categories(*))')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as ReadingHistoryEntry[]) ?? [];
}

// Notification preferences
export async function fetchNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data as NotificationPreferences | null;
}

export async function upsertNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...prefs });
  if (error) throw error;
}
