const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'mysql-3160ff5b-surveyearn-app.d.aivencloud.com',
    port: 11237,
    user: 'avnadmin',
    password: 'AVNS_hiFSN7maN3Rh05ZVN1n',
    database: 'defaultdb',
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