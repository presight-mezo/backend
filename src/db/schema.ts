import { db } from "./client.js";

// ── Schema Migrations ─────────────────────────────────────────────────────────

export function migrateDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      address              TEXT PRIMARY KEY,
      default_risk_mode    TEXT NOT NULL DEFAULT 'full-stake',
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      username             TEXT,
      bio                  TEXT,
      avatar_url           TEXT,
      twitter              TEXT,
      created_at           TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      description  TEXT,
      is_private   INTEGER NOT NULL DEFAULT 0,
      archived     INTEGER NOT NULL DEFAULT 0,
      admin_address TEXT NOT NULL,
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id  TEXT NOT NULL REFERENCES groups(id),
      address   TEXT NOT NULL,
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (group_id, address)
    );

    CREATE TABLE IF NOT EXISTS markets (
      id               TEXT PRIMARY KEY,
      group_id         TEXT NOT NULL REFERENCES groups(id),
      question         TEXT NOT NULL,
      deadline         TEXT NOT NULL,
      resolver_address TEXT NOT NULL,
      mode             TEXT NOT NULL DEFAULT 'full-stake', -- 'full-stake' | 'zero-risk'
      status           TEXT NOT NULL DEFAULT 'OPEN',       -- 'OPEN' | 'RESOLVED'
      outcome          TEXT,                               -- 'YES' | 'NO' | NULL
      yes_pool         TEXT NOT NULL DEFAULT '0',
      no_pool          TEXT NOT NULL DEFAULT '0',
      created_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stakes (
      id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      market_id    TEXT NOT NULL REFERENCES markets(id),
      user_address TEXT NOT NULL,
      direction    TEXT NOT NULL, -- 'YES' | 'NO'
      amount       TEXT NOT NULL, -- MUSD wei as string
      mode         TEXT NOT NULL,
      tx_hash      TEXT NOT NULL,
      staked_at    TEXT DEFAULT (datetime('now')),
      UNIQUE (market_id, user_address)
    );

    CREATE TABLE IF NOT EXISTS mandates (
      user_address     TEXT PRIMARY KEY,
      limit_per_market TEXT NOT NULL, -- MUSD wei as string
      tx_hash          TEXT NOT NULL,
      registered_at    TEXT DEFAULT (datetime('now')),
      revoked          INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS conviction_scores (
      user_address   TEXT NOT NULL,
      group_id       TEXT NOT NULL REFERENCES groups(id),
      score          INTEGER NOT NULL DEFAULT 0,
      markets_played INTEGER NOT NULL DEFAULT 0,
      wins           INTEGER NOT NULL DEFAULT 0,
      total_staked   TEXT NOT NULL DEFAULT '0',
      total_won      TEXT NOT NULL DEFAULT '0',
      last_updated   TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_address, group_id)
    );

    CREATE TABLE IF NOT EXISTS trove_positions (
      user_address   TEXT PRIMARY KEY,
      trove_balance  TEXT NOT NULL, -- BTC collateral
      musd_balance   TEXT NOT NULL,
      updated_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync (
      id         TEXT PRIMARY KEY,
      last_block INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Safe migrations for newly added columns
  const alters = [
    "ALTER TABLE users ADD COLUMN username TEXT",
    "ALTER TABLE users ADD COLUMN bio TEXT",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
    "ALTER TABLE users ADD COLUMN twitter TEXT",
    "ALTER TABLE groups ADD COLUMN description TEXT",
    "ALTER TABLE groups ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE groups ADD COLUMN archived INTEGER NOT NULL DEFAULT 0"
  ];
  for (const query of alters) {
    try {
      db.exec(query);
    } catch (e: any) {
      if (!e.message.includes("duplicate column name")) {
        console.error("Migration error:", e.message);
      }
    }
  }
}

// ── Users CRUD ────────────────────────────────────────────────────────────────

export interface UserRecord {
  address: string;
  default_risk_mode: string;
  onboarding_completed: number;
  username?: string;
  bio?: string;
  avatar_url?: string;
  twitter?: string;
}

export const usersDb = {
  get(address: string): UserRecord | undefined {
    return db
      .prepare("SELECT * FROM users WHERE address = ?")
      .get(address.toLowerCase()) as any;
  },

  upsert(address: string, default_risk_mode: string, onboarding_completed: boolean) {
    db.prepare(`
      INSERT INTO users (address, default_risk_mode, onboarding_completed)
      VALUES (?, ?, ?)
      ON CONFLICT (address) DO UPDATE SET
        default_risk_mode = excluded.default_risk_mode,
        onboarding_completed = excluded.onboarding_completed
    `).run(address.toLowerCase(), default_risk_mode, onboarding_completed ? 1 : 0);
  },

  updateProfile(address: string, data: { username?: string; bio?: string; avatar_url?: string; twitter?: string; default_risk_mode?: string }) {
    db.prepare(`
      UPDATE users SET
        username = COALESCE(?, username),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        twitter = COALESCE(?, twitter),
        default_risk_mode = COALESCE(?, default_risk_mode)
      WHERE address = ?
    `).run(
      data.username ?? null,
      data.bio ?? null,
      data.avatar_url ?? null,
      data.twitter ?? null,
      data.default_risk_mode ?? null,
      address.toLowerCase()
    );
  },
};

// ── Mandate CRUD ──────────────────────────────────────────────────────────────

export interface MandateRecord {
  user_address: string;
  limit_per_market: string;
  tx_hash: string;
}

export const mandatesDb = {
  get(userAddress: string): MandateRecord & { revoked: number } | undefined {
    return db
      .prepare("SELECT * FROM mandates WHERE user_address = ? AND revoked = 0")
      .get(userAddress.toLowerCase()) as any;
  },

  upsert(data: MandateRecord) {
    db.prepare(`
      INSERT INTO mandates (user_address, limit_per_market, tx_hash, revoked)
      VALUES (?, ?, ?, 0)
      ON CONFLICT (user_address) DO UPDATE SET
        limit_per_market = excluded.limit_per_market,
        tx_hash          = excluded.tx_hash,
        registered_at    = datetime('now'),
        revoked          = 0
    `).run(data.user_address.toLowerCase(), data.limit_per_market, data.tx_hash);
  },

  revoke(userAddress: string) {
    db.prepare("UPDATE mandates SET revoked = 1 WHERE user_address = ?")
      .run(userAddress.toLowerCase());
  },
};

// ── Groups CRUD ───────────────────────────────────────────────────────────────

export const groupsDb = {
  get(groupId: string) {
    return db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as any;
  },

  create(id: string, name: string, adminAddress: string, description?: string, isPrivate?: boolean) {
    db.prepare(`
      INSERT INTO groups (id, name, admin_address, description, is_private) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id, 
      name, 
      adminAddress.toLowerCase(), 
      description || null, 
      isPrivate ? 1 : 0
    );
  },

  addMember(groupId: string, address: string) {
    db.prepare(`
      INSERT OR IGNORE INTO group_members (group_id, address) VALUES (?, ?)
    `).run(groupId, address.toLowerCase());
  },

  removeMember(groupId: string, address: string) {
    db.prepare("DELETE FROM group_members WHERE group_id = ? AND address = ?")
      .run(groupId, address.toLowerCase());
  },

  update(id: string, data: { name?: string; description?: string; isPrivate?: boolean }) {
    db.prepare(`
      UPDATE groups SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        is_private = COALESCE(?, is_private)
      WHERE id = ?
    `).run(
      data.name !== undefined ? data.name : null,
      data.description !== undefined ? data.description : null,
      data.isPrivate !== undefined ? (data.isPrivate ? 1 : 0) : null,
      id
    );
  },

  archive(id: string) {
    db.prepare("UPDATE groups SET archived = 1 WHERE id = ?").run(id);
  },

  isMember(groupId: string, address: string): boolean {
    const row = db
      .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND address = ?")
      .get(groupId, address.toLowerCase());
    return !!row;
  },

  memberCount(groupId: string): number {
    const row = db
      .prepare("SELECT COUNT(*) as cnt FROM group_members WHERE group_id = ?")
      .get(groupId) as any;
    return row?.cnt ?? 0;
  },

  members(groupId: string) {
    return db
      .prepare(`
        SELECT gm.address, gm.joined_at, u.username, u.avatar_url
        FROM group_members gm
        LEFT JOIN users u ON gm.address = u.address
        WHERE gm.group_id = ? 
        ORDER BY gm.joined_at ASC
      `)
      .all(groupId) as any[];
  },

  getByUser(address: string) {
    return db
      .prepare(`
        SELECT g.*, 
               (SELECT COUNT(*) FROM group_members m WHERE m.group_id = g.id) as _count_members,
               (SELECT COUNT(*) FROM markets mk WHERE mk.group_id = g.id AND mk.status = 'OPEN') as _count_active_markets
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.address = ? AND g.archived = 0
        ORDER BY g.created_at DESC
      `)
      .all(address.toLowerCase()) as any[];
  },
};

// ── Markets CRUD ──────────────────────────────────────────────────────────────

export const marketsDb = {
  get(marketId: string) {
    return db.prepare("SELECT * FROM markets WHERE id = ?").get(marketId) as any;
  },

  getByGroup(groupId: string) {
    return db
      .prepare("SELECT * FROM markets WHERE group_id = ? ORDER BY status = 'OPEN' DESC, deadline ASC")
      .all(groupId) as any[];
  },

  getAll(limit: number = 20) {
    return db
      .prepare("SELECT * FROM markets WHERE status = 'OPEN' ORDER BY deadline ASC LIMIT ?")
      .all(limit) as any[];
  },

  getByResolverAndStatus(resolverAddress: string, status: string) {
    return db
      .prepare("SELECT * FROM markets WHERE resolver_address = ? AND status = ? ORDER BY deadline ASC")
      .all(resolverAddress.toLowerCase(), status) as any[];
  },

  getOpenZeroRisk() {
    return db
      .prepare("SELECT * FROM markets WHERE mode = 'zero-risk' AND status = 'OPEN'")
      .all() as any[];
  },

  create(data: {
    id: string; groupId: string; question: string; deadline: string;
    resolverAddress: string; mode: string;
  }) {
    db.prepare(`
      INSERT INTO markets (id, group_id, question, deadline, resolver_address, mode)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.id, data.groupId, data.question, data.deadline,
           data.resolverAddress.toLowerCase(), data.mode);
  },

  updatePool(marketId: string, direction: boolean, amount: string) {
    const col = direction ? "yes_pool" : "no_pool";
    db.prepare(`
      UPDATE markets SET ${col} = CAST(CAST(${col} AS INTEGER) + CAST(? AS INTEGER) AS TEXT)
      WHERE id = ?
    `).run(amount, marketId);
  },

  resolve(marketId: string, outcome: boolean) {
    db.prepare(`
      UPDATE markets SET status = 'RESOLVED', outcome = ?
      WHERE id = ?
    `).run(outcome ? "YES" : "NO", marketId);
  },
};

// ── Stakes CRUD ───────────────────────────────────────────────────────────────

export const stakesDb = {
  getByMarket(marketId: string) {
    return db
      .prepare("SELECT * FROM stakes WHERE market_id = ?")
      .all(marketId) as any[];
  },

  hasStaked(marketId: string, userAddress: string): boolean {
    const row = db
      .prepare("SELECT 1 FROM stakes WHERE market_id = ? AND user_address = ?")
      .get(marketId, userAddress.toLowerCase());
    return !!row;
  },

  get(marketId: string, userAddress: string) {
    return db
      .prepare("SELECT * FROM stakes WHERE market_id = ? AND user_address = ?")
      .get(marketId, userAddress.toLowerCase()) as any;
  },

  create(data: {
    marketId: string; userAddress: string; direction: string;
    amount: string; mode: string; txHash: string;
  }) {
    db.prepare(`
      INSERT INTO stakes (market_id, user_address, direction, amount, mode, tx_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(data.marketId, data.userAddress.toLowerCase(), data.direction,
           data.amount, data.mode, data.txHash);
  },

  getById(stakeId: string) {
    return db.prepare("SELECT * FROM stakes WHERE id = ?").get(stakeId) as any;
  },
};

// ── Conviction Scores ─────────────────────────────────────────────────────────

export const scoresDb = {
  get(userAddress: string, groupId: string) {
    return db
      .prepare("SELECT * FROM conviction_scores WHERE user_address = ? AND group_id = ?")
      .get(userAddress.toLowerCase(), groupId) as any;
  },

  getLeaderboard(groupId: string) {
    return db
      .prepare(`
        SELECT gm.address as user_address, 
               COALESCE(cs.score, 0) as score, 
               COALESCE(cs.markets_played, 0) as markets_played, 
               COALESCE(cs.wins, 0) as wins,
               u.username,
               u.avatar_url
        FROM group_members gm
        LEFT JOIN conviction_scores cs ON gm.address = cs.user_address AND gm.group_id = cs.group_id
        LEFT JOIN users u ON gm.address = u.address
        WHERE gm.group_id = ?
        ORDER BY score DESC
        LIMIT 100
      `)
      .all(groupId) as any[];
  },

  getGlobalLeaderboard(limit: number = 100) {
    return db
      .prepare(`
        SELECT user_address, 
               SUM(score) as score, 
               SUM(markets_played) as markets_played, 
               SUM(wins) as wins
        FROM conviction_scores
        GROUP BY user_address
        ORDER BY score DESC
        LIMIT ?
      `)
      .all(limit) as any[];
  },

  getGlobal(userAddress: string) {
    const rows = db
      .prepare(`
        SELECT score, markets_played, wins, total_staked, total_won
        FROM conviction_scores
        WHERE user_address = ?
      `)
      .all(userAddress.toLowerCase()) as any[];

    if (rows.length === 0) return undefined;

    let totalScore = 0;
    let marketsPlayed = 0;
    let wins = 0;
    let totalStaked = BigInt(0);
    let totalWon = BigInt(0);

    for (const row of rows) {
      totalScore += row.score;
      marketsPlayed += row.markets_played;
      wins += row.wins;
      totalStaked += BigInt(row.total_staked || "0");
      totalWon += BigInt(row.total_won || "0");
    }

    return {
      totalScore,
      marketsPlayed,
      wins,
      totalStaked: totalStaked.toString(),
      totalWon: totalWon.toString(),
    };
  },

  increment(userAddress: string, groupId: string, delta: {
    score: number; marketsPlayed: number; wins: number;
    totalStaked: string; totalWon: string;
  }) {
    db.prepare(`
      INSERT INTO conviction_scores (user_address, group_id, score, markets_played, wins, total_staked, total_won)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_address, group_id) DO UPDATE SET
        score          = score + ?,
        markets_played = markets_played + ?,
        wins           = wins + ?,
        total_staked   = CAST(CAST(total_staked AS INTEGER) + CAST(? AS INTEGER) AS TEXT),
        total_won      = CAST(CAST(total_won AS INTEGER) + CAST(? AS INTEGER) AS TEXT),
        last_updated   = datetime('now')
    `).run(
      userAddress.toLowerCase(), groupId,
      delta.score, delta.marketsPlayed, delta.wins, delta.totalStaked, delta.totalWon,
      // UPDATE params
      delta.score, delta.marketsPlayed, delta.wins, delta.totalStaked, delta.totalWon
    );
  },
};

// ── Sync CRUD ─────────────────────────────────────────────────────────────────

export const syncDb = {
  getLastBlock(id: string = "main"): number {
    const row = db.prepare("SELECT last_block FROM sync WHERE id = ?").get(id) as any;
    return row?.last_block ?? 0;
  },

  updateLastBlock(block: number, id: string = "main") {
    db.prepare(`
      INSERT INTO sync (id, last_block) VALUES (?, ?)
      ON CONFLICT (id) DO UPDATE SET last_block = excluded.last_block
    `).run(id, block);
  },
};

// ── Troves CRUD ───────────────────────────────────────────────────────────────

export const trovesDb = {
  get(userAddress: string) {
    return db
      .prepare("SELECT * FROM trove_positions WHERE user_address = ?")
      .get(userAddress.toLowerCase()) as any;
  },

  upsert(userAddress: string, troveBalance: string, musdBalance: string) {
    db.prepare(`
      INSERT INTO trove_positions (user_address, trove_balance, musd_balance)
      VALUES (?, ?, ?)
      ON CONFLICT (user_address) DO UPDATE SET
        trove_balance = excluded.trove_balance,
        musd_balance  = excluded.musd_balance,
        updated_at    = datetime('now')
    `).run(userAddress.toLowerCase(), troveBalance, musdBalance);
  },
};
