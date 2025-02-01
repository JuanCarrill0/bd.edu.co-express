const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();

router.post('/sendMessage', async (req, res) => {
  const {
    idUsuario,
    idMensaje,
    idPais,
    idTipoCarpeta,
    idCategoria,
    asunto,
    cuerpoMensaje,
    fechaAccion,
    horaAccion,
    menIdUsuario, // Opcional: ID del usuario al que se responde
    menIdMensaje // Opcional: ID del mensaje al que se responde
  } = req.body;

  // Validar campos obligatorios
  if (!idUsuario || !idMensaje || !idPais || !idTipoCarpeta || !idCategoria || !asunto || !cuerpoMensaje || !fechaAccion || !horaAccion) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO MENSAJE (
      IDUSUARIO, IDMENSAJE, IDPAIS, IDTIPOCARPETA, IDCATEGORIA, ASUNTO, CUERPOMENSAJE, FECHAACCION, HORAACCION, MEN_IDUSUARIO, MEN_IDMENSAJE
    ) VALUES (
      :idUsuario, :idMensaje, :idPais, :idTipoCarpeta, :idCategoria, :asunto, :cuerpoMensaje, TO_DATE(:fechaAccion, 'YYYY-MM-DD'), TO_TIMESTAMP(:horaAccion, 'HH24:MI:SS'), :menIdUsuario, :menIdMensaje
    )
  `;

  let connection;

  try {
    connection = await oracledb.getConnection();

    // Ejecutar la consulta de inserción
    const result = await connection.execute(
      query,
      {
        idUsuario,
        idMensaje,
        idPais,
        idTipoCarpeta,
        idCategoria,
        asunto,
        cuerpoMensaje,
        fechaAccion,
        horaAccion,
        menIdUsuario: menIdUsuario || null, // Si no se proporciona, se usa null
        menIdMensaje: menIdMensaje || null // Si no se proporciona, se usa null
      },
      { autoCommit: true } // Confirmar la transacción automáticamente
    );

    res.status(201).send({ message: 'Message sent successfully', result });
    console.log('Message sent successfully:', result);
  } catch (err) {
    console.error('Error sending message:', err);
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

// Endpoint para guardar un mensaje enviado en la tabla DESTINATARIO
router.post('/destinatario', async (req, res) => {
  const { idPais, idUsuario, idMensaje, idTipoCopia, consecContacto } = req.body;

  if (!idPais || !idUsuario || !idMensaje || !idTipoCopia || !consecContacto) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  let connection;
  try {
    // Conectar a la base de datos
    connection = await oracledb.getConnection();

    // Verificar si la secuencia existe y crearla si no existe
    const checkSeqQuery = `
      SELECT COUNT(*) AS SEQ_COUNT
      FROM USER_SEQUENCES
      WHERE SEQUENCE_NAME = 'DESTINATARIO_SEQ'
    `;
    const seqResult = await connection.execute(checkSeqQuery);
    const seqCount = seqResult.rows[0][0];

    if (seqCount === 0) {
      const createSeqQuery = `
        CREATE SEQUENCE destinatario_seq
        START WITH 1
        INCREMENT BY 1
        NOCACHE
      `;
      await connection.execute(createSeqQuery);
    }

    // Insertar en la tabla DESTINATARIO
    const sql = `
      INSERT INTO DESTINATARIO (CONSECDESTINATARIO, IDPAIS, IDUSUARIO, IDMENSAJE, IDTIPOCOPIA, CONSECCONTACTO)
      VALUES (destinatario_seq.NEXTVAL, :idPais, :idUsuario, :idMensaje, :idTipoCopia, :consecContacto)
    `;

    const result = await connection.execute(sql, {
      idPais,
      idUsuario,
      idMensaje,
      idTipoCopia,
      consecContacto
    }, { autoCommit: true });

    res.status(201).json({ message: 'Mensaje enviado y guardado correctamente.' });
  } catch (error) {
    console.error('Error al guardar el mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    // Cerrar la conexión
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error al cerrar la conexión:', error);
      }
    }
  }
});

module.exports = router;