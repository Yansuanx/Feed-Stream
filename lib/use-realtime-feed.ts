import { useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import { Article } from './types';
import { fetchLatestArticles, fetchFeaturedArticle, fetchBreakingNews } from './articles';

interface UseRealtimeFeedOptions {
  onArticleInsert?: (article: Article) => void;
  onArticleUpdate?: (article: Article) => void;
  onArticleDelete?: (id: string) => void;
  onBreakingChange?: () => void;
  onFeaturedChange?: () => void;
  enabled?: boolean;
}

/**
 * Subscribes to Supabase realtime changes on the articles table.
 * Calls callbacks when articles are inserted, updated, or deleted,
 * and when breaking news or featured articles change.
 */
export function useRealtimeFeed({
  onArticleInsert,
  onArticleUpdate,
  onArticleDelete,
  onBreakingChange,
  onFeaturedChange,
  enabled = true,
}: UseRealtimeFeedOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleInsert = useCallback((payload: any) => {
    if (onArticleInsert && payload.new) {
      onArticleInsert(payload.new as Article);
      if (payload.new.is_breaking && onBreakingChange) onBreakingChange();
      if (payload.new.is_featured && onFeaturedChange) onFeaturedChange();
    }
  }, [onArticleInsert, onBreakingChange, onFeaturedChange]);

  const handleUpdate = useCallback((payload: any) => {
    if (onArticleUpdate && payload.new) {
      onArticleUpdate(payload.new as Article);
      const oldRec = payload.old ?? {};
      const newRec = payload.new as Article;
      if (newRec.is_breaking !== oldRec.is_breaking && onBreakingChange) onBreakingChange();
      if (newRec.is_featured !== oldRec.is_featured && onFeaturedChange) onFeaturedChange();
    }
  }, [onArticleUpdate, onBreakingChange, onFeaturedChange]);

  const handleDelete = useCallback((payload: any) => {
    if (onArticleDelete && payload.old?.id) {
      onArticleDelete(payload.old.id as string);
    }
  }, [onArticleDelete]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('realtime-articles')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        handleInsert
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'articles' },
        handleUpdate
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'articles' },
        handleDelete
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [enabled, handleInsert, handleUpdate, handleDelete]);

  return { channel: channelRef.current };
}

/**
 * Convenience hook that manages a live article feed with realtime updates.
 * Returns the current articles, featured article, breaking news, and a
 * "new articles available" indicator.
 */
export function useLiveFeed(categoryId: string | null = null) {
  const articlesRef = useRef<Article[]>([]);
  const featuredRef = useRef<Article | null>(null);
  const breakingRef = useRef<Article[]>([]);
  const newCountRef = useRef(0);

  const refreshAll = useCallback(async () => {
    const [latest, hero, breaking] = await Promise.all([
      fetchLatestArticles(0, 10, categoryId ?? undefined),
      fetchFeaturedArticle(),
      fetchBreakingNews(),
    ]);
    articlesRef.current = latest;
    featuredRef.current = hero;
    breakingRef.current = breaking;
    newCountRef.current = 0;
    return { latest, hero, breaking };
  }, [categoryId]);

  return {
    articlesRef,
    featuredRef,
    breakingRef,
    newCountRef,
    refreshAll,
  };
}
