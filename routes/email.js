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
  const { 
    idPais, 
    idUsuario, 
    idMensaje, 
    idTipoCopia, 
    consecContacto 
  } = req.body;

  if (!idPais || !idUsuario || !idMensaje || !idTipoCopia || !consecContacto) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // Convertir los valores a números y validar que no sean NaN
  const consecContactoNum = Number(consecContacto);

  if (isNaN(consecContactoNum)) {
    return res.status(400).json({ error: 'El campo consecContacto debe ser un número válido.' });
  }

  let connection;
  try {
    // Conectar a la base de datos
    connection = await oracledb.getConnection();

    // // Verificar si la secuencia existe y crearla si no existe
    // const checkSeqQuery = `
    //   SELECT COUNT(*) AS SEQ_COUNT
    //   FROM USER_SEQUENCES
    //   WHERE SEQUENCE_NAME = 'DESTINATARIO_SEQ'
    // `;
    // const seqResult = await connection.execute(checkSeqQuery);
    // const seqCount = seqResult.rows[0][0];

    // if (seqCount === 0) {
    //   const createSeqQuery = `
    //     CREATE SEQUENCE destinatario_seq
    //     START WITH 1
    //     INCREMENT BY 1
    //     NOCACHE
    //   `;
    //   await connection.execute(createSeqQuery);
    // }

    // Obtener el siguiente valor de la secuencia
    const seqValueQuery = `SELECT destinatario_seq.NEXTVAL AS NEXT_ID FROM DUAL`;
    const seqValueResult = await connection.execute(seqValueQuery);
    const nextId = seqValueResult.rows[0][0];

    // Insertar el mensaje en la tabla DESTINATARIO
    const insertQuery = `
      INSERT INTO DESTINATARIO (CONSECDESTINATARIO, IDPAIS, IDUSUARIO, IDMENSAJE, IDTIPOCOPIA, CONSECCONTACTO)
      VALUES (seq_consecdestinatario.NEXTVAL, :idPais, :idUsuario, :idMensaje, :idTipoCopia, :consecContacto)
    `;
    const binds = {
      consecDestinatario: nextId,
      idPais: idPais, // VARCHAR2(5)
      idUsuario: idUsuario, // VARCHAR2(5)
      idMensaje: idMensaje, // VARCHAR2(5)
      idTipoCopia: idTipoCopia, // VARCHAR2(4)
      consecContacto: consecContactoNum // NUMBER(38)
    };

    await connection.execute(insertQuery, binds, { autoCommit: true });

    res.status(201).json({ message: 'Mensaje guardado exitosamente' });
  } catch (error) {
    console.error('Error al guardar el mensaje:', error);
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

router.get('/recibidos', async (req, res) => {
  const { correocontacto } = req.query;

  if (!correocontacto) {
    return res.status(400).json({ error: 'ID de usuario es requerido.' });
  }
  
  let connection;
  try {
    // Conectar a la base de datos
    connection = await oracledb.getConnection();
    const sql = `
    SELECT U.NOMBRE, M.ASUNTO, M.CUERPOMENSAJE, M.FECHAACCION, M.HORAACCION, U.CORREOALTERNO REMITENTE
      FROM MENSAJE M, DESTINATARIO D, TIPOCOPIA T, CONTACTO C, USUARIO U
      WHERE C.CORREOCONTACTO = :correocontacto AND
	    C.CONSECCONTACTO = D.CONSECCONTACTO AND
      D.IDUSUARIO = M.IDUSUARIO AND
      M.IDUSUARIO = U.IDUSUARIO AND
      T.IDTIPOCOPIA = D.IDTIPOCOPIA AND 
      T.IDTIPOCOPIA = 'CO'
    `;

    const result = await connection.execute(sql, {
      correocontacto
    }, { autoCommit: true });

    console.log(result);

    // Verificar si se encontró un usuario
    if (result.rows.length === 0) {
      return res.status(200).json({ mensaje: 'Correo Recibido Vacio' });
    }

    // Devolver el usuario encontrado
    res.status(200).json({ inbox: result.rows });
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

router.get('/enviados', async (req, res) => {
  const { idUsuario } = req.query;

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID de usuario es requerido.' });
  }
  
  let connection;
  try {
    // Conectar a la base de datos
    connection = await oracledb.getConnection();
    const sql = `
      SELECT NVL(C.NOMBRECONTACTO, 'No proporcionado') NOMBRE, C.CORREOCONTACTO, M.ASUNTO, M.CUERPOMENSAJE, M.FECHAACCION, M.HORAACCION, D.IDTIPOCOPIA
        FROM CONTACTO C, MENSAJE M, TIPOCOPIA T, DESTINATARIO D
        WHERE M.IDUSUARIO = :idUsuario AND
        M.IDUSUARIO = D.IDUSUARIO AND
        M.IDMENSAJE = D.IDMENSAJE AND
        C.CONSECCONTACTO = D.CONSECCONTACTO AND
        T.IDTIPOCOPIA = D.IDTIPOCOPIA
    `;

    const result = await connection.execute(sql, {
      idUsuario
    }, { autoCommit: true });

    console.log(result);

    // Verificar si se encontró un usuario
    if (result.rows.length === 0) {
      return res.status(200).json({ mensaje: 'Correo Recibido Vacio' });
    }

    // Devolver el usuario encontrado
    res.status(200).json({ inbox: result.rows });
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