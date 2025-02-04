# bd.edu.co-backend

**Backend para la Plataforma MÓDULO BD**  
Framework: **Node.js + Express**  
Base de Datos: **Oracle (implementación mediante Power Designer)**

---

## 1. Estado del Proyecto
El backend de la plataforma proporciona una API RESTful para gestionar la interacción con la base de datos y los módulos de la aplicación.  

### **Avances Actuales:**  
- Estructura básica de la API creada con rutas para los siguientes módulos:  
  - **Gestión de Usuarios:** CRUD completo (Crear, Leer, Actualizar, Eliminar) para las tablas paramétricas: 
    - Archivos
    - Email
    - Login
    - Usuarios
- Integración con Oracle para persistencia de datos.  
- Validaciones de datos y manejo de errores básicos implementados.  

### **Pendientes:**  
- Desarrollo del módulo **GestiónCorreo**, que incluye la funcionalidad de envío y recepción de correos almacenados en la base de datos.  
- Optimización de consultas SQL.  
- Documentación adicional de endpoints.

---

## 2. Requisitos
### **Dependencias principales:**  
- Node.js (v18.20.2 o superior)  
- Express.js  
- OracleDB Driver (`oracledb`)  

### **Instalación:**  
1. Clonar el repositorio:  
    ```bash
    git clone https://github.com/usuario/bd.edu.co-backend.git
    cd bd.edu.co-backend
    ```
2. Instalar dependencias:  
    ```bash
    npm install
    ```
3. Configurar el archivo `.env`:  
    ```env
      const dbConfig = {
        user: 'user,
        password: 'password',
        connectString: 'localHost/oracleDB'
      }
    ```
4. Iniciar el servidor:  
    ```bash
    npm run start
    ```

---

## 3. Estructura del Proyecto
```bash
bd.edu.co-backend/
├── routes/
│   └── archivos.js
│   └── email.js
│   └── login.js
│   └── usuarios.js
├── server.js
└── .env
