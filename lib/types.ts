export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image_url: string | null;
  category_id: string | null;
  category?: Category;
  author: string;
  reading_time_min: number;
  is_premium: boolean;
  is_featured: boolean;
  is_breaking: boolean;
  views: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  is_admin: boolean;
  free_articles_read: number;
  free_articles_reset_at: string;
  preferred_categories: string[];
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  article?: Article;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface ReadingHistoryEntry {
  id: string;
  user_id: string;
  article_id: string;
  article?: Article;
  scroll_depth: number;
  time_spent_sec: number;
  read_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  breaking_news: boolean;
  market_alerts: boolean;
  daily_digest: boolean;
  trending_stories: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const FREE_ARTICLE_LIMIT = 3;
export const PAYWALL_SCROLL_THRESHOLD = 0.3;
export const PAYWALL_TIME_THRESHOLD_SEC = 45;
export const PAYWALL_PREMIUM_COUNT_THRESHOLD = 3;
