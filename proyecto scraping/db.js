import mysql from 'mysql2';
import fs from 'fs';

const ca = fs.readFileSync(new URL('./certs/global-bundle.pem', import.meta.url), 'utf8');

export const connection = mysql.createConnection({
 host: 'database-1.c90so60ys7h2.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'ericacorrea1597',
  database: 'sistema_seguridad',
  port: 3306,
   // SSL correcto con CA de RDS
  ssl: { ca, rejectUnauthorized: true },  
  waitForConnections: true,
  connectionLimit: 10,
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

//module.exports = connection;
