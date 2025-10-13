# Backend Test Plan for GitHub Actions

## Objectives
- Validate critical authentication and authorization flows before merging to master.
- Guarantee that resource ownership restrictions remain intact across services.
- Ensure API endpoints exposed through Docker containers stay functional under integration tests.

## Test Suites to Implement

### 1. Autenticación y gestión de sesiones
| Endpoint | Nombre de la prueba | Descripción |
| --- | --- | --- |
| `POST /login/login` | Credenciales válidas devuelven sesión | Usar credenciales sembradas, esperar 200, `success=true`, datos de usuario y token en el cuerpo. |
| `POST /login/login` | Credenciales inválidas rechazadas | Enviar contraseña equivocada, esperar 401, mensaje de error y sin token. |
| `GET /login/verify` | Acepta token firmado | Invocar con token de login exitoso, esperar 200 y datos decodificados. |
| `GET /login/verify` | Rechaza token malformado | Enviar encabezado Bearer con token basura, esperar 401 y que el middleware registre error JWT. |
| `POST /login/refresh` | Emite token nuevo para sesión activa | Proveer payload válido, esperar token rotado con mismos claims y `iat` posterior. |
| `POST /login/refresh` | Rechaza token faltante o inválido | Omitir encabezado, esperar 401 y `success=false`. |
| `POST /login/logout` | Confirma cierre de sesión | Consumir endpoint con token válido, esperar 200 y mensaje que instruya eliminar la sesión local. |

### 2. Control de acceso basado en roles
| Componente | Nombre de la prueba | Descripción |
| --- | --- | --- |
| Middleware de auth | Bloquea `user_type` faltante | Adjuntar token sin rol requerido, esperar 403 en ruta protegida. |
| Middleware de auth | Permite bypass de admin | Usar token de admin en endpoint restringido y confirmar 200. |
| Helper de ownership | Niega actualización ajena | Intentar editar recurso ajeno, esperar 403 con mensaje explicativo. |
| Helper de ownership | Permite acciones del dueño | Actualizar recurso como propietario válido, esperar 200 y cambios persistidos. |

### 3. Recursos CRUD
Enfocarse en módulos representativos para minimizar tiempo de ejecución y cubrir patrones comunes.

| Módulo | Nombre de la prueba | Descripción |
| --- | --- | --- |
| Posts | Listado de posts | `GET /api/posts` retorna payload paginado con arreglo `posts`. |
| Posts | Creador publica post | Freelancer autenticado envía payload, esperar 201 con registro persistido. |
| Posts | Bloqueo a no propietario | Freelancer distinto intenta modificar post, esperar 403. |
| Posts | Propietario elimina post | Dueño legítimo borra post existente, esperar 200 y mensaje de confirmación. |
| Projects | Creación requiere campos | Falta de título/descripción/presupuesto debe devolver 400 de validación. |
| Projects | Creación válida exitosa | Project manager envía payload completo, esperar 201 e ID almacenado. |
| Projects | Respeto a transiciones de estado | Petición PUT actualiza estado, esperar 200 y valor nuevo. |
| Projects | Refuerzo de roles | Freelancer entrando a ruta solo de managers recibe 403. |
| Events | Dueño puede actualizar | Creador modifica metadatos, esperar 200 y payload actualizado. |
| Events | Bloqueo a borrado ajeno | Usuario distinto intenta borrar evento, esperar 403. |

### 4. Casos negativos y de resiliencia
| Escenario | Descripción |
| --- | --- |
| Manejo de fallos de Prisma | Simular excepción de Prisma, esperar respuesta 500 estandarizada (`success=false`, `message`). |
| Guardia 404 | Solicitar `/unknown-route`, esperar 404 con `{ error: { mensaje: 'Ruta no encontrada' } }`. |

## Docker-Based Execution Strategy
- Use the existing `Docker-compose.yml` to provision Postgres and the backend container.
- Run tests using `docker compose run --rm backend npm run test:run`; this will connect to the `db` service and execute Vitest inside the container.
- Seed data via `init.sql` or targeted Prisma setup scripts executed in `beforeAll` hooks.

## GitHub Actions Workflow Outline

### Workflow File
`.github/workflows/ci-tests.yml`

### Trigger
```yaml
on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]
```

### Jobs Overview
- **setup**: Checkout repository, set up Docker Buildx (if required), and cache node modules with `actions/cache`.
- **test**: Build backend image with `docker compose -f Docker-compose.yml build backend` and run the test target using `docker compose -f Docker-compose.yml run --rm backend npm run test:run`.
- **cleanup**: Always run `docker compose -f Docker-compose.yml down -v` to remove containers and volumes between CI runs.

### Environment Variables
Define the following secrets in the repository and inject them in the workflow:
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DATABASE_URL` (optional if using service discovery inside Docker)

### Sample Job Snippet
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
        working-directory: Proyecto_Freelance_BackEnd
      - name: Build services
        run: docker compose -f Docker-compose.yml build
        working-directory: Proyecto_Freelance_BackEnd
      - name: Run integration tests
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_EXPIRES_IN: ${{ secrets.JWT_EXPIRES_IN }}
        run: docker compose -f Docker-compose.yml run --rm backend npm run test:run
        working-directory: Proyecto_Freelance_BackEnd
      - name: Clean up
        if: always()
        run: docker compose -f Docker-compose.yml down -v
        working-directory: Proyecto_Freelance_BackEnd
```

## Next Steps
- Implement missing integration suites described above and confirm they pass locally via Docker.
- Create the GitHub Actions workflow file and commit it alongside the new tests.
- Monitor runtime; if execution exceeds time limits, partition the tests by feature or run the longest suites on a separate job.
