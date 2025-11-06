import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  // In build or local dev without DB, we don't throw immediately to allow static pages to build.
  // Functions that need DB will fail with a clear error below.
  // console.warn('Warning: Missing DATABASE_URL/POSTGRES_URL');
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    })
  : null;

async function query(text, params) {
  if (!pool) throw new Error('Database not configured: set DATABASE_URL or POSTGRES_URL');
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function ensureSchema() {
  // Owners table
  await query(
    `CREATE TABLE IF NOT EXISTS owners (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
  );
  // Topics and materials tables
  await query(
    `CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      topic_id INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size BIGINT,
      blob_url TEXT NOT NULL,
      is_public BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
  );
  // Add owner_id to topics if missing
  await query(`ALTER TABLE topics ADD COLUMN IF NOT EXISTS owner_id INT REFERENCES owners(id) ON DELETE SET NULL;`);
  // Ensure default owner exists
  await query(`INSERT INTO owners (slug, name, sort_order) VALUES ('default', '기본', 999999) ON CONFLICT (slug) DO NOTHING;`);
  // Keep default owner sorted last if it exists with smaller sort_order
  await query(`UPDATE owners SET sort_order = 999999 WHERE slug = 'default' AND sort_order < 999999;`);
  // Assign default owner to any topics without an owner
  await query(`UPDATE topics SET owner_id = (SELECT id FROM owners WHERE slug = 'default') WHERE owner_id IS NULL;`);
}

export async function listTopicsWithMaterials(ownerSlug = 'default') {
  await ensureSchema();
  // Resolve owner id by slug
  const ownerRes = await query(`SELECT id FROM owners WHERE slug = $1`, [ownerSlug]);
  const ownerId = ownerRes.rows[0]?.id;
  if (!ownerId) {
    // If owner not found, return empty
    return [];
  }
  const topicsRes = await query(
    `SELECT id, title, sort_order, created_at, owner_id FROM topics WHERE owner_id = $1 ORDER BY sort_order ASC, id ASC`,
    [ownerId]
  );
  const topicIds = topicsRes.rows.map(t => t.id);
  let materials = [];
  if (topicIds.length > 0) {
    const materialsRes = await query(
      `SELECT id, topic_id, title, file_name, file_type, file_size, blob_url, is_public, created_at FROM materials WHERE topic_id = ANY($1::int[]) ORDER BY created_at ASC`,
      [topicIds]
    );
    materials = materialsRes.rows;
  }
  const topics = topicsRes.rows;
  return topics.map((t) => ({ ...t, materials: materials.filter((m) => m.topic_id === t.id) }));
}

export async function createTopic(title, sortOrder = 0, ownerSlug = 'default') {
  await ensureSchema();
  const ownerRes = await query(`SELECT id FROM owners WHERE slug = $1`, [ownerSlug]);
  const ownerId = ownerRes.rows[0]?.id;
  if (!ownerId) throw new Error('Owner not found');
  const res = await query(
    `INSERT INTO topics (title, sort_order, owner_id) VALUES ($1, $2, $3) RETURNING id, title, sort_order, created_at`,
    [title, sortOrder, ownerId]
  );
  return res.rows[0];
}

export async function deleteTopic(id) {
  await ensureSchema();
  await query(`DELETE FROM topics WHERE id = $1`, [id]);
}

export async function updateTopicTitle(id, title) {
  await ensureSchema();
  const res = await query(
    `UPDATE topics SET title = $1 WHERE id = $2 RETURNING id, title, sort_order, created_at`,
    [title, id]
  );
  return res.rows[0];
}

export async function updateTopicOrder(reorderedIds) {
  await ensureSchema();
  // reorderedIds is an array of topic IDs in the desired order
  // Update sort_order based on array index
  for (let i = 0; i < reorderedIds.length; i++) {
    await query(`UPDATE topics SET sort_order = $1 WHERE id = $2`, [i, reorderedIds[i]]);
  }
}

export async function createMaterial({ topicId, title, fileName, fileType, fileSize, blobUrl, isPublic = true }) {
  await ensureSchema();
  const res = await query(
    `INSERT INTO materials (topic_id, title, file_name, file_type, file_size, blob_url, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, topic_id, title, file_name, file_type, file_size, blob_url, is_public, created_at`,
    [topicId, title, fileName, fileType || null, fileSize || null, blobUrl, isPublic]
  );
  return res.rows[0];
}

export async function deleteMaterial(id) {
  await ensureSchema();
  const res = await query(`DELETE FROM materials WHERE id = $1 RETURNING blob_url`, [id]);
  return res.rows[0];
}

export async function getMaterialById(id) {
  await ensureSchema();
  const res = await query(
    `SELECT id, topic_id, title, file_name, file_type, file_size, blob_url, is_public, created_at
     FROM materials WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

// Owners helpers
export async function listOwners() {
  await ensureSchema();
  const res = await query(`SELECT id, slug, name, sort_order, created_at FROM owners ORDER BY sort_order ASC, id ASC`);
  return res.rows;
}

export async function createOwner({ slug, name, sortOrder = 0 }) {
  await ensureSchema();
  const res = await query(
    `INSERT INTO owners (slug, name, sort_order) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, slug, name, sort_order, created_at`,
    [slug, name, sortOrder]
  );
  return res.rows[0];
}

export async function updateTopicOwner(topicId, ownerSlug) {
  await ensureSchema();
  const owner = await getOwnerBySlug(ownerSlug);
  if (!owner) throw new Error('Owner not found');
  await query(`UPDATE topics SET owner_id = $1 WHERE id = $2`, [owner.id, topicId]);
}

async function getOrCreateUnsortedTopic(ownerSlug) {
  await ensureSchema();
  const owner = await getOwnerBySlug(ownerSlug);
  if (!owner) throw new Error('Owner not found');
  // Try to find existing topic titled '미분류'
  const found = await query(`SELECT id FROM topics WHERE owner_id = $1 AND title = $2 LIMIT 1`, [owner.id, '미분류']);
  if (found.rows[0]) return found.rows[0];
  const created = await createTopic('미분류', 0, ownerSlug);
  return created;
}

export async function moveMaterialToOwner(materialId, ownerSlug) {
  await ensureSchema();
  const targetTopic = await getOrCreateUnsortedTopic(ownerSlug);
  await query(`UPDATE materials SET topic_id = $1 WHERE id = $2`, [targetTopic.id, materialId]);
}

export async function getOwnerBySlug(slug) {
  await ensureSchema();
  const res = await query(`SELECT id, slug, name, sort_order, created_at FROM owners WHERE slug = $1`, [slug]);
  return res.rows[0] || null;
}

export async function getOwnerById(id) {
  await ensureSchema();
  const res = await query(`SELECT id, slug, name, sort_order, created_at FROM owners WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

export async function updateOwnerName(id, name) {
  await ensureSchema();
  const res = await query(
    `UPDATE owners SET name = $1 WHERE id = $2 RETURNING id, slug, name, sort_order, created_at`,
    [name, id]
  );
  return res.rows[0];
}

export async function deleteOwner(ownerId) {
  await ensureSchema();
  // prevent deleting default owner
  const def = await getOwnerBySlug('default');
  if (!def) throw new Error('Default owner missing');
  if (def.id === ownerId) throw new Error('Cannot delete default owner');
  // reassign topics to default owner
  await query(`UPDATE topics SET owner_id = $1 WHERE owner_id = $2`, [def.id, ownerId]);
  // delete owner
  await query(`DELETE FROM owners WHERE id = $1`, [ownerId]);
}
