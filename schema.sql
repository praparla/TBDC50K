-- ══════════════════════════════════════════════════════════════
-- Taco Bell DC 50K — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ══════════════════════════════════════════════════════════════

-- ── Profiles ──
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'runner' CHECK (role IN ('runner', 'cheerer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── Food Logs ──
CREATE TABLE food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stop_number INT NOT NULL CHECK (stop_number BETWEEN 0 AND 7),
  menu_items JSONB NOT NULL DEFAULT '[]',
  hot_take TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_food_logs_user ON food_logs(user_id);
CREATE INDEX idx_food_logs_stop ON food_logs(stop_number);
CREATE INDEX idx_food_logs_created ON food_logs(created_at DESC);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_logs_select_all" ON food_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "food_logs_insert_own" ON food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_logs_update_own" ON food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_logs_delete_own" ON food_logs FOR DELETE USING (auth.uid() = user_id);

-- ── Food Log Flags (moderation) ──
CREATE TABLE food_log_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_log_id UUID NOT NULL REFERENCES food_logs(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(food_log_id, flagged_by)
);

ALTER TABLE food_log_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags_select_auth" ON food_log_flags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "flags_insert_own" ON food_log_flags FOR INSERT WITH CHECK (auth.uid() = flagged_by);

-- ── Parties ──
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  mile_marker DOUBLE PRECISION,
  amenities JSONB DEFAULT '[]',
  runner_note TEXT DEFAULT '',
  crew_note TEXT DEFAULT '',
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_parties_host ON parties(host_id);
CREATE INDEX idx_parties_live ON parties(is_live);

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties_select_all" ON parties FOR SELECT USING (true);
CREATE POLICY "parties_insert_auth" ON parties FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "parties_update_own" ON parties FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "parties_delete_own" ON parties FOR DELETE USING (auth.uid() = host_id);

-- ── Party Subscribers ──
CREATE TABLE party_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(party_id, user_id)
);

ALTER TABLE party_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select_involved" ON party_subscribers FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT host_id FROM parties WHERE id = party_id));
CREATE POLICY "subs_insert_own" ON party_subscribers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subs_delete_own" ON party_subscribers FOR DELETE USING (auth.uid() = user_id);

-- ── Bets ──
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_runner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('finish_time', 'food_items', 'bathroom_stops', 'dnf')),
  prediction JSONB NOT NULL,
  actual_result JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bets_creator ON bets(creator_id);
CREATE INDEX idx_bets_target ON bets(target_runner_id);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bets_select_auth" ON bets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "bets_insert_auth" ON bets FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "bets_update_involved" ON bets FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = target_runner_id);

-- ── Social Feed View (denormalized for fast reads) ──
CREATE OR REPLACE VIEW social_feed_view AS
SELECT
  fl.id,
  fl.user_id,
  p.display_name,
  p.avatar_url,
  fl.stop_number,
  fl.menu_items,
  fl.hot_take,
  fl.created_at,
  COALESCE(fc.cnt, 0) AS flag_count
FROM food_logs fl
JOIN profiles p ON fl.user_id = p.id
LEFT JOIN (
  SELECT food_log_id, COUNT(*) AS cnt
  FROM food_log_flags
  GROUP BY food_log_id
) fc ON fc.food_log_id = fl.id
ORDER BY fl.created_at DESC;

-- ══════════════════════════════════════════════════════════════
-- Migration: Account Settings & Preferences Sync (2026-03-15)
-- ══════════════════════════════════════════════════════════════

-- Add preferences JSONB for cloud sync of localStorage data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add emoji avatar (no file storage needed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '';

-- Function to delete own account (cascades to all child records)
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM profiles WHERE id = auth.uid();
END;
$$;

-- ── Enable Realtime on key tables ──
-- Run these in the Supabase dashboard under Database > Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE food_logs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE parties;
