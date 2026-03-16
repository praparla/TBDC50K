// ── Taco Bell DC 50K — Data Access Layer ──
// All Supabase CRUD operations and realtime subscriptions.
// Exposes TB_DB global. All functions return { data, error } Promises.

const TB_DB = (function () {
  function sb() {
    return TB_AUTH.getSupabase();
  }

  function userId() {
    return TB_AUTH.user ? TB_AUTH.user.id : null;
  }

  function notAuth() {
    return { data: null, error: 'Not authenticated' };
  }

  // ═══════════════════════════════════════
  // FOOD LOGS
  // ═══════════════════════════════════════

  async function insertFoodLog({ stop_number, menu_items, hot_take, lat, lng }) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('food_logs')
        .insert({
          user_id: userId(),
          stop_number,
          menu_items: menu_items || [],
          hot_take: hot_take || '',
          lat: lat || null,
          lng: lng || null,
        })
        .select()
        .single();
      if (error) {
        console.error('insertFoodLog error:', error);
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (err) {
      console.error('insertFoodLog network error:', err);
      return { data: null, error: 'Network error. Please try again.' };
    }
  }

  async function fetchMyFoodLogs() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('food_logs')
        .select('*')
        .eq('user_id', userId())
        .order('stop_number', { ascending: true });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchAllFoodLogs({ limit = 50, offset = 0, stop_number = null } = {}) {
    if (!sb() || !userId()) return notAuth();
    try {
      let query = sb()
        .from('food_logs')
        .select('*, profiles!inner(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (stop_number !== null) {
        query = query.eq('stop_number', stop_number);
      }

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchFoodLogFlagCounts(logIds) {
    if (!sb() || !userId() || !logIds || logIds.length === 0) return { data: {}, error: null };
    try {
      const { data, error } = await sb()
        .from('food_log_flags')
        .select('food_log_id')
        .in('food_log_id', logIds);
      if (error) return { data: {}, error: error.message };

      const counts = {};
      (data || []).forEach(f => {
        counts[f.food_log_id] = (counts[f.food_log_id] || 0) + 1;
      });
      return { data: counts, error: null };
    } catch (err) {
      return { data: {}, error: 'Network error.' };
    }
  }

  async function flagFoodLog(food_log_id, reason) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('food_log_flags')
        .insert({
          food_log_id,
          flagged_by: userId(),
          reason: reason || '',
        })
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  // ═══════════════════════════════════════
  // PARTIES
  // ═══════════════════════════════════════

  async function insertParty({ name, description, lat, lng, mile_marker, amenities, runner_note, crew_note }) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('parties')
        .insert({
          host_id: userId(),
          name,
          description: description || '',
          lat,
          lng,
          mile_marker: mile_marker || null,
          amenities: amenities || [],
          runner_note: runner_note || '',
          crew_note: crew_note || '',
        })
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchParties() {
    if (!sb()) return { data: [], error: 'Supabase not initialized' };
    try {
      const { data, error } = await sb()
        .from('parties')
        .select('*, profiles!inner(display_name)')
        .order('mile_marker', { ascending: true });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function updatePartyLive(party_id, is_live) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('parties')
        .update({ is_live, updated_at: new Date().toISOString() })
        .eq('id', party_id)
        .eq('host_id', userId())
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function deleteParty(party_id) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { error } = await sb()
        .from('parties')
        .delete()
        .eq('id', party_id)
        .eq('host_id', userId());
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function subscribeToParty(party_id) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('party_subscribers')
        .insert({ party_id, user_id: userId() })
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function unsubscribeFromParty(party_id) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { error } = await sb()
        .from('party_subscribers')
        .delete()
        .eq('party_id', party_id)
        .eq('user_id', userId());
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchMySubscriptions() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('party_subscribers')
        .select('party_id')
        .eq('user_id', userId());
      if (error) return { data: null, error: error.message };
      return { data: (data || []).map(s => s.party_id), error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchPartySubscriberCount(party_id) {
    if (!sb()) return { data: 0, error: null };
    try {
      const { count, error } = await sb()
        .from('party_subscribers')
        .select('id', { count: 'exact', head: true })
        .eq('party_id', party_id);
      if (error) return { data: 0, error: error.message };
      return { data: count || 0, error: null };
    } catch (err) {
      return { data: 0, error: 'Network error.' };
    }
  }

  // ═══════════════════════════════════════
  // BETS
  // ═══════════════════════════════════════

  async function insertBet({ target_runner_id, bet_type, prediction }) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('bets')
        .insert({
          creator_id: userId(),
          target_runner_id,
          bet_type,
          prediction,
        })
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchMyBets() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('bets')
        .select('*, profiles!bets_target_runner_id_fkey(display_name)')
        .eq('creator_id', userId())
        .order('created_at', { ascending: false });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchBetsOnMe() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('bets')
        .select('*, profiles!bets_creator_id_fkey(display_name)')
        .eq('target_runner_id', userId())
        .order('created_at', { ascending: false });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function resolveBet(bet_id, actual_result, is_correct) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('bets')
        .update({ actual_result, is_correct })
        .eq('id', bet_id)
        .select()
        .single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchLeaderboard() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('bets')
        .select('creator_id, is_correct, profiles!bets_creator_id_fkey(display_name)')
        .not('is_correct', 'is', null);
      if (error) return { data: null, error: error.message };

      // Aggregate in JS (simple enough for small dataset)
      const scores = {};
      (data || []).forEach(bet => {
        const id = bet.creator_id;
        if (!scores[id]) {
          scores[id] = {
            creator_id: id,
            display_name: bet.profiles ? bet.profiles.display_name : 'Unknown',
            total: 0,
            correct: 0,
          };
        }
        scores[id].total++;
        if (bet.is_correct) scores[id].correct++;
      });

      const leaderboard = Object.values(scores)
        .map(s => ({ ...s, accuracy: s.total > 0 ? s.correct / s.total : 0 }))
        .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);

      return { data: leaderboard, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  // ═══════════════════════════════════════
  // PROFILES
  // ═══════════════════════════════════════

  async function searchRunners(query) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('profiles')
        .select('id, display_name')
        .eq('role', 'runner')
        .ilike('display_name', `%${query}%`)
        .limit(10);
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  // ═══════════════════════════════════════
  // ACCOUNT MANAGEMENT
  // ═══════════════════════════════════════

  async function updateAvatarEmoji(emoji) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { error } = await sb()
        .from('profiles')
        .update({ avatar_emoji: emoji || '', updated_at: new Date().toISOString() })
        .eq('id', userId());
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function updatePreferences(prefs) {
    if (!sb() || !userId()) return notAuth();
    try {
      const { error } = await sb()
        .from('profiles')
        .update({ preferences: prefs || {}, updated_at: new Date().toISOString() })
        .eq('id', userId());
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchPreferences() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { data, error } = await sb()
        .from('profiles')
        .select('preferences')
        .eq('id', userId())
        .single();
      if (error) return { data: null, error: error.message };
      return { data: data ? data.preferences || {} : {}, error: null };
    } catch (err) {
      return { data: null, error: 'Network error.' };
    }
  }

  async function fetchMyStats() {
    if (!sb() || !userId()) return notAuth();
    try {
      const uid = userId();
      const [foodRes, betsRes, partiesRes] = await Promise.all([
        sb().from('food_logs').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        sb().from('bets').select('id', { count: 'exact', head: true }).eq('creator_id', uid),
        sb().from('parties').select('id', { count: 'exact', head: true }).eq('host_id', uid),
      ]);
      return {
        data: {
          food_logs: foodRes.count || 0,
          bets_placed: betsRes.count || 0,
          parties_hosted: partiesRes.count || 0,
        },
        error: null,
      };
    } catch (err) {
      return { data: { food_logs: 0, bets_placed: 0, parties_hosted: 0 }, error: 'Network error.' };
    }
  }

  async function deleteMyAccount() {
    if (!sb() || !userId()) return notAuth();
    try {
      const { error } = await sb().rpc('delete_own_account');
      if (error) {
        console.error('deleteMyAccount error:', error);
        return { data: null, error: error.message };
      }
      return { data: true, error: null };
    } catch (err) {
      console.error('deleteMyAccount network error:', err);
      return { data: null, error: 'Network error.' };
    }
  }

  // ═══════════════════════════════════════
  // REALTIME SUBSCRIPTIONS
  // ═══════════════════════════════════════

  function subscribeFoodLogs(callback) {
    if (!sb()) return null;
    const channel = sb()
      .channel('food_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'food_logs' }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
    return channel;
  }

  function subscribeParties(callback) {
    if (!sb()) return null;
    const channel = sb()
      .channel('parties_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, (payload) => {
        callback(payload.eventType, payload.new, payload.old);
      })
      .subscribe();
    return channel;
  }

  function unsubscribeChannel(channel) {
    if (sb() && channel) {
      sb().removeChannel(channel);
    }
  }

  // ── Public API ──
  return {
    // Food logs
    insertFoodLog,
    fetchMyFoodLogs,
    fetchAllFoodLogs,
    fetchFoodLogFlagCounts,
    flagFoodLog,
    // Parties
    insertParty,
    fetchParties,
    updatePartyLive,
    deleteParty,
    subscribeToParty,
    unsubscribeFromParty,
    fetchMySubscriptions,
    fetchPartySubscriberCount,
    // Bets
    insertBet,
    fetchMyBets,
    fetchBetsOnMe,
    resolveBet,
    fetchLeaderboard,
    // Profiles
    searchRunners,
    // Account management
    updateAvatarEmoji,
    updatePreferences,
    fetchPreferences,
    fetchMyStats,
    deleteMyAccount,
    // Realtime
    subscribeFoodLogs,
    subscribeParties,
    unsubscribeChannel,
  };
})();
