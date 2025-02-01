const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM usuario WHERE correoalterno = :email AND contrasena = :password';
  let connection;

  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(query, { email, password });
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.status(200).send({ message: 'Login successful', user: user });
    } else {
      res.status(401).send({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send({ error: 'Internal Server Error', details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
});

module.exports = router;