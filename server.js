const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const loginRoutes = require('./routes/login');
const usuariosRoutes = require('./routes/usuarios');
const emailRoutes = require('./routes/email');
const archivosRoutes = require('./routes/archivos');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  user: 'system',
  password: 'Oracle2025',
  connectString: '192.168.2.122:1521/XE'
}

async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Connected to database');
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

initialize();

app.use('/api', loginRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', emailRoutes);
app.use('/api', archivosRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});