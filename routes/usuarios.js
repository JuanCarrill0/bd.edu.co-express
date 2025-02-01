const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

router.get('/getContacts', async (req, res) => {
  const { email } = req.query; // Obtener el correo electrónico del query parameter

  if (!email) {
    return res.status(400).send({ error: 'Email is required' });
  }

  const query = `
    SELECT c.CONSECCONTACTO, c.NOMBRECONTACTO, c.CORREOCONTACTO
    FROM CONTACTO c
    JOIN USUARIO u ON c.IDUSUARIO = u.IDUSUARIO
    WHERE u.CORREOALTERNO = :email
  `;

  let connection;

  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).send({ message: 'No contacts found for this user' });
    }

    res.status(200).send({ contacts: result.rows });
  } catch (err) {
    console.error('Error fetching contacts:', err);
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

// Endpoint para buscar un usuario por correoalterno
router.get('/getUser', async (req, res) => {
  const { correoalterno } = req.query; // Obtener el correo alterno del query parameter

  if (!correoalterno) {
    return res.status(400).send({ error: 'Correo alterno is required' });
  }

  let connection;

  try {
    connection = await oracledb.getConnection();

    // Consulta SQL para buscar un usuario por correoalterno
    const query = `
      SELECT IDUSUARIO, NOMBRE, APELLIDO, CORREOALTERNO, CELULAR
      FROM USUARIO
      WHERE CORREOALTERNO = :correoalterno
    `;

    // Ejecutar la consulta
    const result = await connection.execute(query, [correoalterno]);

    console.log(result);

    // Verificar si se encontró un usuario
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Devolver el usuario encontrado
    res.status(200).json({ usuario: result.rows });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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

// Endpoint para buscar un usuario por correoalterno
router.get('/getContact', async (req, res) => {
  const { correoalterno } = req.query; // Obtener el correo alterno del query parameter

  if (!correoalterno) {
    return res.status(400).send({ error: 'Correo alterno is required' });
  }

  let connection;

  try {
    connection = await oracledb.getConnection();

    // Consulta SQL para buscar un usuario por correoalterno
    const query = `
      SELECT CONSECCONTACTO, IDUSUARIO, NOMBRECONTACTO, CORREOCONTACTO  
      FROM CONTACTO
      WHERE CORREOCONTACTO = :correoalterno
    `;

    // Ejecutar la consulta
    const result = await connection.execute(query, [correoalterno]);

    console.log(result);

    // Verificar si se encontró un usuario
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Devolver el usuario encontrado
    res.status(200).json({ usuario: result.rows });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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