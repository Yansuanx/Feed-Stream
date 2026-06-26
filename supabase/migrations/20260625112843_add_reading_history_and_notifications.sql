-- Reading history for personalization
CREATE TABLE reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  scroll_depth float NOT NULL DEFAULT 0,
  time_spent_sec int NOT NULL DEFAULT 0,
  read_at timestamptz DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_article ON reading_history(article_id);

-- Notification preferences
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  breaking_news boolean NOT NULL DEFAULT true,
  market_alerts boolean NOT NULL DEFAULT true,
  daily_digest boolean NOT NULL DEFAULT true,
  trending_stories boolean NOT NULL DEFAULT false,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '07:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Reading history: user owns own
CREATE POLICY "select_own_history" ON reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_history" ON reading_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_history" ON reading_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_history" ON reading_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notification preferences: user owns own
CREATE POLICY "select_own_notif" ON notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_notif" ON notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_notif" ON notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_notif" ON notification_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to upsert reading history
CREATE OR REPLACE FUNCTION upsert_reading_history(
  p_user_id uuid,
  p_article_id uuid,
  p_scroll_depth float,
  p_time_spent int
)
RETURNS void AS $$
BEGIN
  INSERT INTO reading_history (user_id, article_id, scroll_depth, time_spent)
  VALUES (p_user_id, p_article_id, p_scroll_depth, p_time_spent)
  ON CONFLICT (user_id, article_id)
  DO UPDATE SET
    scroll_depth = GREATEST(reading_history.scroll_depth, p_scroll_depth),
    time_spent = reading_history.time_spent + p_time_spent,
    read_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
