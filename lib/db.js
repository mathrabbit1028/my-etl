import { sql } from '@vercel/postgres';

export async function ensureSchema() {
  await sql`CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    topic_id INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INT,
    blob_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

export async function listTopicsWithMaterials() {
  await ensureSchema();
  const { rows: topics } = await sql`SELECT id, title, sort_order, created_at FROM topics ORDER BY sort_order ASC, id ASC`;
  const { rows: materials } = await sql`SELECT id, topic_id, title, file_name, file_type, file_size, blob_url, is_public, created_at FROM materials ORDER BY created_at ASC`;
  const grouped = topics.map(t => ({ ...t, materials: materials.filter(m => m.topic_id === t.id) }));
  return grouped;
}

export async function createTopic(title, sortOrder = 0) {
  await ensureSchema();
  const { rows } = await sql`INSERT INTO topics (title, sort_order) VALUES (${title}, ${sortOrder}) RETURNING id, title, sort_order, created_at`;
  return rows[0];
}

export async function deleteTopic(id) {
  await ensureSchema();
  await sql`DELETE FROM topics WHERE id = ${id}`;
}

export async function createMaterial({ topicId, title, fileName, fileType, fileSize, blobUrl, isPublic = true }) {
  await ensureSchema();
  const { rows } = await sql`INSERT INTO materials (topic_id, title, file_name, file_type, file_size, blob_url, is_public)
    VALUES (${topicId}, ${title}, ${fileName}, ${fileType}, ${fileSize}, ${blobUrl}, ${isPublic})
    RETURNING id, topic_id, title, file_name, file_type, file_size, blob_url, is_public, created_at`;
  return rows[0];
}

export async function deleteMaterial(id) {
  await ensureSchema();
  const { rows } = await sql`DELETE FROM materials WHERE id = ${id} RETURNING blob_url`;
  return rows[0];
}
