export default {
  async createUser(db, { email, password, username, status = 'offline' }) {
    const result = await db.query(
      'INSERT INTO users (email, password, username, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, password, username, status]
    );
    return result.rows[0].id;
  },

  async findByEmail(db, email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async updateStatus(db, email, status) {
    await db.query('UPDATE users SET status = $1 WHERE email = $2', [status, email]);
  }
};
