
# Freelance Hub · Backend

API REST para gestionar usuarios y publicaciones en un proyecto de Freelance Hub, construida con Node.js, Express, Prisma y PostgreSQL. Incluye autenticación básica con JWT y despliegue con Docker.

**[Repositorio del frontend](https://github.com/G1LB3T0/Proyecto_Freelance_FrontEnd)** · [Perfil profesional](https://github.com/G1LB3T0)

## Documentación principal

- Revisa los **endpoints** para conocer los flujos de usuarios y publicaciones.
- Consulta `prisma/schema.prisma` para explorar el modelo de datos.
- Usa las instrucciones locales o la configuración Docker para preparar el entorno.

## Estructura del proyecto

```
.
├── .env
├── Docker-compose.yml
├── Dockerfile
├── init.sql
├── index.js
├── package.json
├── pg_hba.conf
├── prisma/
│   └── schema.prisma
└── src/
    ├── controllers/
    │   └── post.Controllers.js
    └── routes/
        ├── ejemplo.routes.js
        ├── login.routes.js
        ├── register.routes.js
        └── post.routes.js
```

## Requisitos

- Node.js v18+
- Docker & Docker Compose
- npm o yarn

## Instalación local

1. Clonar el repositorio  
   ```bash
   git clone https://github.com/G1LB3T0/Proyecto_Freelance_BackEnd.git
   ```
2. Entrar al directorio  
   ```bash
   cd Proyecto_Freelance_BackEnd
   ```
3. Instalar dependencias  
   ```bash
   npm install
   ```
4. Crear archivo `.env` en la raíz con las variables:
   ```dotenv
   DATABASE_URL=postgresql://<usuario>:<contraseña>@<host>:<puerto>/<basedatos>
   JWT_SECRET=<tu_secreto_jwt>
   PORT=3000
   ```
5. Generar cliente de Prisma  
   ```bash
   npx prisma generate
   ```
6. Ejecutar migraciones (si no usas Docker)  
   ```bash
   npx prisma migrate dev --name init
   ```
7. Iniciar servidor en modo desarrollo  
   ```bash
   npm run dev
   ```

## Uso con Docker

1. Levantar servicios  
   ```bash
   docker-compose up --build
   ```
2. La API estará disponible en `http://localhost:3000`

## Endpoints

### Usuarios & Autenticación

- **POST /register**  
  Registra un usuario. Body:
  ```json
  {
    "email": "user@mail.com",
    "password": "1234",
    "username": "usuario",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "phone": "12345678",
    "date_of_birth": "YYYY-MM-DD",
    "gender": "Male/Female",
    "country": "País",
    "postal_code": "CP"
  }
  ```
- **POST /login**  
  Autentica y devuelve un token JWT. Body:
  ```json
  { "email": "user@mail.com", "password": "1234" }
  ```
- **GET /api**  
  Lista todos los usuarios.

### Publicaciones (Posts)

- **GET /posts**  
  Listar todos los posts.
- **GET /posts/:id**  
  Obtener un post por ID.
- **GET /posts/user/:userId**  
  Obtener posts de un usuario.
- **GET /posts/category/:categoryId**  
  Obtener posts por categoría.
- **POST /posts**  
  Crear un nuevo post. Body:
  ```json
  {
    "user_id": 1,
    "title": "Título",
    "content": "Contenido",
    "image_url": "http://...",
    "category_id": 2
  }
  ```
- **PUT /posts/:id**  
  Actualizar un post existente.
- **DELETE /posts/:id**  
  Eliminar un post.

## Prisma & Base de datos

- El esquema Prisma está en `prisma/schema.prisma`.
- El script de inicialización `init.sql` crea tablas y datos de ejemplo.

## Comandos de verificación

El `package.json` declara estos scripts:

```bash
npm run test:run
npm run test:coverage
```

## Licencia

ISC  Luis  
