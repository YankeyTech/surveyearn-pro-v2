const mysql = require('mysql2/promise');

async function run() {
  const url = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: url.port,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false }
  });

  const [r] = await conn.execute(
    'UPDATE users SET role = ? WHERE email = ?',
    ['admin', 'barcavini17@gmail.com']
  );
  console.log('Updated rows:', r.affectedRows);
  await conn.end();
}

run().catch(console.error);