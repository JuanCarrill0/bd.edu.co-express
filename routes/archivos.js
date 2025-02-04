const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// // Configuración de Multer para subir archivos
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage: storage });

// Ruta para subir archivos adjuntos
router.post('/adjuntos', async (req, res) => {
  const { idUsuario, idMensaje, attachments } = req.body; // Asegúrate de enviar idUsuario, idMensaje y attachments desde el front-end

  if (!attachments || attachments.length === 0) {
    return res.status(400).json({ error: 'No se han proporcionado archivos' });
  }

  let connection;
  try {
    // Obtener una conexión a la base de datos
    connection = await oracledb.getConnection();

    // Guardar la información de los archivos adjuntos en la base de datos
    const results = [];
    for (const file of attachments) {
      const tipoArchivo = path.extname(file.name).toUpperCase().replace('.', ''); // Obtener la extensión y formatearla
      const nombreArchivo = file.name;

      const query = `
        INSERT INTO ARCHIVOADJUNTO (
          CONSECARCHIVO, IDTIPOARCHIVO, IDUSUARIO, IDMENSAJE, NOMARCHIVO
        ) VALUES (
          seq_consecarchivo.NEXTVAL, :tipoArchivo, :idUsuario, :idMensaje, :nombreArchivo
        )
      `;

      const result = await connection.execute(
        query,
        {
          tipoArchivo: tipoArchivo,
          idUsuario: idUsuario,
          idMensaje: idMensaje,
          nombreArchivo: nombreArchivo,
        },
        { autoCommit: true } // Asegurarse de que los cambios se confirmen automáticamente
      );

      results.push(result);
    }

    // Escribir en consola el resultado de la consulta
    console.log('Resultados de las consultas:', results);

    // Devolver el resultado de la consulta
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Error al guardar la información de los archivos:', error);
    res.status(500).json({ error: 'Error al guardar la información de los archivos' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// Exportar el router
module.exports = router;