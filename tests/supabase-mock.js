// ── Supabase Mock Client for Testing ──
// Implements the Supabase JS client API surface with in-memory storage.
// Used by backend.test.html to test all modules without a live Supabase instance.

const MockSupabase = (function () {

  function createClient(url, key) {
    // In-memory tables
    const tables = {
      profiles: [],
      food_logs: [],
      food_log_flags: [],
      parties: [],
      party_subscribers: [],
      bets: [],
    };

    let autoIncrement = 1;
    let currentSession = null;
    let authListeners = [];
    let channelListeners = {};

    function generateId() {
      return 'mock-' + (autoIncrement++);
    }

    // ── Query Builder ──
    // Mimics Supabase's chained query API: .from().select().eq().order() etc.
    function createQueryBuilder(tableName) {
      let filters = [];
      let selectCols = '*';
      let joinTable = null;
      let joinInner = false;
      let orderCol = null;
      let orderAsc = true;
      let rangeStart = null;
      let rangeEnd = null;
      let isSingle = false;
      let isHead = false;
      let countMode = null;
      let limitNum = null;
      let ilikePairs = [];
      let inPairs = [];
      let notPairs = [];
      let pendingOp = null; // 'select' | 'insert' | 'update' | 'delete'
      let insertData = null;
      let updateData = null;

      const builder = {
        select(cols, opts) {
          // Only set op to 'select' if not chained after insert/update/delete
          if (!pendingOp) pendingOp = 'select';
          selectCols = cols || '*';
          if (opts && opts.count === 'exact') countMode = 'exact';
          if (opts && opts.head) isHead = true;
          // Parse join: '*, profiles!inner(display_name)'
          const joinMatch = (cols || '').match(/(\w+)!(\w+)\(([^)]+)\)/);
          if (joinMatch) {
            joinTable = joinMatch[1];
            joinInner = joinMatch[2] === 'inner';
          }
          return builder;
        },
        insert(data) {
          pendingOp = 'insert';
          insertData = Array.isArray(data) ? data : [data];
          return builder;
        },
        update(data) {
          pendingOp = 'update';
          updateData = data;
          return builder;
        },
        delete() {
          pendingOp = 'delete';
          return builder;
        },
        eq(col, val) {
          filters.push(row => row[col] === val);
          return builder;
        },
        in(col, vals) {
          inPairs.push({ col, vals });
          filters.push(row => vals.includes(row[col]));
          return builder;
        },
        ilike(col, pattern) {
          const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
          ilikePairs.push({ col, pattern });
          filters.push(row => regex.test(row[col] || ''));
          return builder;
        },
        not(col, op, val) {
          notPairs.push({ col, op, val });
          if (op === 'is' && val === null) {
            filters.push(row => row[col] !== null && row[col] !== undefined);
          }
          return builder;
        },
        order(col, opts) {
          orderCol = col;
          orderAsc = opts ? opts.ascending !== false : true;
          return builder;
        },
        range(start, end) {
          rangeStart = start;
          rangeEnd = end;
          return builder;
        },
        limit(n) {
          limitNum = n;
          return builder;
        },
        single() {
          isSingle = true;
          return builder;
        },
        // Terminal — returns a Promise-like thenable
        then(resolve, reject) {
          try {
            const result = execute();
            resolve(result);
          } catch (e) {
            if (reject) reject(e);
          }
        },
      };

      function applyFilters(rows) {
        let result = [...rows];
        filters.forEach(fn => {
          result = result.filter(fn);
        });
        return result;
      }

      function applyOrder(rows) {
        if (!orderCol) return rows;
        return rows.sort((a, b) => {
          const va = a[orderCol], vb = b[orderCol];
          if (va < vb) return orderAsc ? -1 : 1;
          if (va > vb) return orderAsc ? 1 : -1;
          return 0;
        });
      }

      function applyJoins(rows) {
        if (!joinTable || !tables[joinTable]) return rows;
        return rows.map(row => {
          // Find profile by matching user_id or host_id or creator_id
          const fkCandidates = ['user_id', 'host_id', 'creator_id', 'target_runner_id'];
          let profile = null;
          for (const fk of fkCandidates) {
            if (row[fk]) {
              profile = tables[joinTable].find(p => p.id === row[fk]);
              if (profile) break;
            }
          }
          return { ...row, [joinTable]: profile || null };
        });
      }

      function execute() {
        const table = tables[tableName];
        if (!table) return { data: null, error: { message: 'Table not found: ' + tableName } };

        if (pendingOp === 'insert') {
          const inserted = [];
          for (const item of insertData) {
            const row = {
              id: item.id || generateId(),
              ...item,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            };
            table.push(row);
            inserted.push(row);

            // Fire realtime listeners
            fireRealtimeEvent(tableName, 'INSERT', row, null);
          }

          const resultData = isSingle ? inserted[0] : inserted;

          // If .select() was chained after .insert(), return the data
          if (selectCols) {
            return { data: resultData, error: null };
          }
          return { data: resultData, error: null };
        }

        if (pendingOp === 'update') {
          let rows = applyFilters(table);
          rows.forEach(row => {
            const old = { ...row };
            Object.assign(row, updateData);
            fireRealtimeEvent(tableName, 'UPDATE', row, old);
          });
          const resultData = isSingle ? rows[0] || null : rows;
          return { data: resultData, error: null };
        }

        if (pendingOp === 'delete') {
          const toDelete = applyFilters(table);
          toDelete.forEach(row => {
            const idx = table.indexOf(row);
            if (idx !== -1) {
              table.splice(idx, 1);
              fireRealtimeEvent(tableName, 'DELETE', null, row);
            }
          });
          return { data: null, error: null };
        }

        // SELECT
        let rows = applyFilters(table);
        rows = applyOrder(rows);
        rows = applyJoins(rows);

        if (rangeStart !== null && rangeEnd !== null) {
          rows = rows.slice(rangeStart, rangeEnd + 1);
        }

        if (limitNum !== null) {
          rows = rows.slice(0, limitNum);
        }

        if (isHead && countMode === 'exact') {
          return { count: rows.length, error: null };
        }

        if (isSingle) {
          return { data: rows[0] || null, error: rows.length === 0 ? { message: 'Row not found' } : null };
        }

        return { data: rows, error: null };
      }

      return builder;
    }

    // ── Realtime ──
    function fireRealtimeEvent(table, eventType, newRow, oldRow) {
      const key = table + '_realtime';
      const listeners = channelListeners[key];
      if (!listeners) return;
      listeners.forEach(fn => {
        fn({
          eventType,
          new: newRow,
          old: oldRow,
        });
      });
    }

    function createChannel(name) {
      const handlers = [];
      const channel = {
        on(type, opts, callback) {
          if (!channelListeners[name]) channelListeners[name] = [];
          channelListeners[name].push(callback);
          handlers.push(callback);
          return channel;
        },
        subscribe() {
          return channel;
        },
      };
      return channel;
    }

    // ── Auth ──
    const auth = {
      async getSession() {
        return { data: { session: currentSession } };
      },
      onAuthStateChange(callback) {
        authListeners.push(callback);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      async signInWithOAuth({ provider, options }) {
        // Simulate OAuth — just create a session
        const user = {
          id: generateId(),
          email: 'testuser@example.com',
          user_metadata: { full_name: 'Test User' },
        };
        currentSession = { user };
        authListeners.forEach(cb => cb('SIGNED_IN', currentSession));
        return { error: null };
      },
      async signInWithOtp({ email, options }) {
        if (!email || !email.includes('@')) {
          return { error: { message: 'Invalid email' } };
        }
        // Simulate magic link — immediately sign in for testing
        const user = {
          id: generateId(),
          email,
          user_metadata: { full_name: email.split('@')[0] },
        };
        currentSession = { user };
        authListeners.forEach(cb => cb('SIGNED_IN', currentSession));
        return { error: null };
      },
      async signOut() {
        currentSession = null;
        authListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      },
    };

    // ── Client ──
    return {
      from(tableName) {
        return createQueryBuilder(tableName);
      },
      channel(name) {
        return createChannel(name);
      },
      removeChannel(channel) {
        // No-op for mock
      },
      async rpc(fnName, args) {
        // Mock RPC functions
        if (fnName === 'delete_own_account') {
          if (!currentSession || !currentSession.user) {
            return { error: { message: 'Not authenticated' } };
          }
          const uid = currentSession.user.id;
          // Delete profile and cascade
          tables.profiles = tables.profiles.filter(p => p.id !== uid);
          tables.food_logs = tables.food_logs.filter(f => f.user_id !== uid);
          tables.bets = tables.bets.filter(b => b.creator_id !== uid && b.target_runner_id !== uid);
          tables.parties = tables.parties.filter(p => p.host_id !== uid);
          tables.party_subscribers = tables.party_subscribers.filter(s => s.user_id !== uid);
          tables.food_log_flags = tables.food_log_flags.filter(f => f.flagged_by !== uid);
          return { data: null, error: null };
        }
        return { data: null, error: { message: 'Unknown RPC: ' + fnName } };
      },
      auth,

      // Test helpers (not part of real Supabase API)
      _reset() {
        Object.keys(tables).forEach(t => { tables[t] = []; });
        autoIncrement = 1;
        currentSession = null;
        authListeners = [];
        channelListeners = {};
      },
      _getTables() { return tables; },
      _getSession() { return currentSession; },
      _setSession(session) {
        currentSession = session;
        if (session) {
          authListeners.forEach(cb => cb('SIGNED_IN', session));
        }
      },
      _seedTable(tableName, rows) {
        if (tables[tableName]) {
          tables[tableName] = [...rows];
        }
      },
    };
  }

  return { createClient };
})();

// Override the global `supabase` object so auth.js/db.js pick it up
const supabase = MockSupabase;
