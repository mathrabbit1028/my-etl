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
  await query(
    `CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS materials (
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
}

export async function listTopicsWithMaterials() {
  await ensureSchema();
  const topicsRes = await query(
    `SELECT id, title, sort_order, created_at FROM topics ORDER BY sort_order ASC, id ASC`
  );
  const materialsRes = await query(
    `SELECT id, topic_id, title, file_name, file_type, file_size, blob_url, is_public, created_at FROM materials ORDER BY created_at ASC`
  );
  const topics = topicsRes.rows;
  const materials = materialsRes.rows;
  const grouped = topics.map((t) => ({ ...t, materials: materials.filter((m) => m.topic_id === t.id) }));
  return grouped;
}

export async function createTopic(title, sortOrder = 0) {
  await ensureSchema();
  const res = await query(
    `INSERT INTO topics (title, sort_order) VALUES ($1, $2) RETURNING id, title, sort_order, created_at`,
    [title, sortOrder]
  );
  return res.rows[0];
}

export async function deleteTopic(id) {
  await ensureSchema();
  await query(`DELETE FROM topics WHERE id = $1`, [id]);
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
