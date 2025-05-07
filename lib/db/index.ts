import { Pool } from 'pg';

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Generic query function
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// User operations
export async function getUserById(id: string) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result[0];
}

export async function createUser(data: { auth_id: string; email?: string; name?: string; profile_image?: string }) {
  const result = await query(
    'INSERT INTO users (auth_id, email, name, profile_image) VALUES ($1, $2, $3, $4) RETURNING *',
    [data.auth_id, data.email, data.name, data.profile_image]
  );
  return result[0];
}

export async function updateUser(id: string, data: { email?: string; name?: string; profile_image?: string }) {
  const result = await query(
    'UPDATE users SET email = COALESCE($1, email), name = COALESCE($2, name), profile_image = COALESCE($3, profile_image), updated_at = NOW() WHERE id = $4 RETURNING *',
    [data.email, data.name, data.profile_image, id]
  );
  return result[0];
}

// Project operations
export async function getProjectsByUserId(userId: string) {
  return query('SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC', [userId]);
}

export async function getProjectById(id: string) {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  return result[0];
}

export async function createProject(data: { 
  user_id: string; 
  name: string; 
  description?: string; 
  is_public?: boolean;
  thumbnail?: string;
  source_url?: string;
}) {
  const result = await query(
    'INSERT INTO projects (user_id, name, description, is_public, thumbnail, source_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [data.user_id, data.name, data.description, data.is_public, data.thumbnail, data.source_url]
  );
  return result[0];
}

export async function updateProject(id: string, data: {
  name?: string;
  description?: string;
  is_public?: boolean;
  thumbnail?: string;
  source_url?: string;
}) {
  const result = await query(
    `UPDATE projects 
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         is_public = COALESCE($3, is_public),
         thumbnail = COALESCE($4, thumbnail),
         source_url = COALESCE($5, source_url),
         updated_at = NOW()
     WHERE id = $6 
     RETURNING *`,
    [data.name, data.description, data.is_public, data.thumbnail, data.source_url, id]
  );
  return result[0];
}

export async function deleteProject(id: string) {
  await query('DELETE FROM projects WHERE id = $1', [id]);
}

// Game operations
export async function getAllGames() {
  return query('SELECT * FROM games ORDER BY name');
}

export async function getGameById(id: string) {
  const result = await query('SELECT * FROM games WHERE id = $1', [id]);
  return result[0];
}