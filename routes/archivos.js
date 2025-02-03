const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuración de Multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Ruta para subir archivos adjuntos
router.post('/adjuntos', upload.array('attachments'), async (req, res) => {
  const attachments = req.files;
  const { idUsuario, idMensaje } = req.body; // Asegúrate de enviar idMensaje desde el front-end

  console.log(idMensaje);

  if (!attachments || attachments.length === 0) {
    return res.status(400).json({ error: 'No se han subido archivos' });
  }

  try {
    // Obtener una conexión a la base de datos
    const connection = await oracledb.getConnection();

    // Guardar los archivos adjuntos en la base de datos
    let results = [];
    for (const file of attachments) {
      const tipoArchivo = path.extname(file.originalname); // Usar file.originalname para obtener la extensión
      const nombreArchivo = file.originalname;
      const query = `
        INSERT INTO ARCHIVOADJUNTO (
          CONSECARCHIVO, IDTIPOARCHIVO, IDUSUARIO, IDMENSAJE, NOMARCHIVO)
          VALUES (
          seq_consecarchivo.NEXTVAL, upper(substr(:tipoArchivo, 2)), :idUsuario, :idMensaje, :nombreArchivo)
      `;
      const result = await connection.execute(
        query,
        {
          tipoArchivo: tipoArchivo,
          idUsuario: idUsuario,
          idMensaje: idMensaje,
          nombreArchivo: nombreArchivo
        },
        { autoCommit: true } // Asegurarse de que los cambios se confirmen automáticamente
      );
      results.push(result);
    }

    // Escribir en consola el resultado de la consulta
    console.log('Resultados de las consultas:', results);

    // Liberar la conexión
    await connection.close();

    // Devolver el resultado de la consulta
    res.status(200).json({ results });
  } catch (error) {
    console.error('Error al subir los archivos:', error);
    res.status(500).json({ error: 'Error al subir los archivos' });
  }
});


// Exportar el router
module.exports = router;