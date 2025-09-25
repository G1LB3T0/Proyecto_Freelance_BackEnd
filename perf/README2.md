# Pruebas de carga y estrés con k6 (Docker)

Objetivo (SLA):
- Latencia p95 < 500 ms
- Error rate < 2%

Qué se implementó
- Script de k6: perf/k6/projects-load.js con dos escenarios:
  - read_heavy: GETs concurrentes a endpoints protegidos.
  - write_light: POST /projects autenticado (rol cliente/PM).
- Umbrales (thresholds) en el script: p95 < 500 ms y error rate < 2%.
- Orquestación Docker:
  - Servicio k6 (docker-compose.k6.yml) que depende del backend “healthy” (service_healthy).
  - API_BASE apunta a http://backend:3000 dentro de la red de compose.
- Setup robusto en k6:
  - Login automático a /login/login con EMAIL/PASSWORD (seed por defecto) o uso de JWT si se exporta.
  - Reintentos con timeout configurable para evitar “connection refused”.
- Ajustes para autenticación:
  - Los GET/POST protegidos se llaman con Authorization: Bearer <token>.
  - Lecturas a rutas correctas y sin errores 401.

Requisitos
- Docker y docker-compose instalados.
- Estar ubicado en la carpeta del backend:
  - C:\Users\luisy\Desktop\WEB\Proyecto_ING\Proyecto_Freelance_BackEnd

Cómo ejecutar (rutas relativas, sin absolutas)
1) Opcional: levantar DB + backend (si lo quieres separado)
   - docker-compose -f Docker-compose.yml up -d

2) Ejecutar k6 con backend en el mismo comando (recomendado)
   - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml --env-file .env up --abort-on-container-exit --remove-orphans

Variables útiles (opcionales)
- EMAIL y PASSWORD: credenciales para login de setup (por defecto seed PM: pablo456@gmail.com / hola456).
  - PowerShell: $env:EMAIL="tu_email"; $env:PASSWORD="tu_password"
- JWT: si lo defines, el setup no hace login y usa ese token.
  - PowerShell: $env:JWT="eyJ..."
- Control del setup (reintentos):
  - READY_TIMEOUT_MS (default 60000)
  - READY_RETRY_MS (default 2000)
  - setupTimeout del script configurado para evitar cortes prematuros.

Qué endpoints se ejercitan
- GET /projects
- GET /projects/status/:status
- POST /projects (requiere rol client o project_manager)
- Nota: estas rutas están protegidas; por eso el script usa Bearer token.

Interpretación de resultados
- Al terminar, k6 imprime:
  - http_req_duration: p50/p95/p99 (objetivo p95 < 500 ms).
  - http_req_failed: porcentaje de errores (objetivo < 2%).
  - Checks y thresholds: PASS/FAIL.
- Fin correcto:
  - “k6-load exited with code 0” y thresholds PASS.
- Ejemplo real observado:
  - http_req_failed: 0.00%
  - http_req_duration p(95) ≈ 21.12 ms (PASS)

Sobre logs “🔍 Origin recibido: undefined”
- Provienen de CORS cuando no hay cabecera Origin (k6 no la envía).
- No es error; se puede silenciar en modo carga si molesta.

Perfiles de carga vs. estrés
- Carga actual: read_heavy (lectura con rampas) + write_light (escrituras ligeras).
- Estrés: aumentar VUs/rampas o añadir un escenario “spike/stress” para empujar hasta fallar SLA.

Problemas comunes y cómo resolverlos
- service "k6" depends on undefined service "backend":
  - Solución: combinar ambos archivos: -f Docker-compose.yml -f docker-compose.k6.yml
- connection refused durante setup:
  - Usa la combinación anterior y el servicio esperará a “healthy”; el setup tiene reintentos.
- setup() execution timed out:
  - Aumentar READY_TIMEOUT_MS o usar un JWT ($env:JWT="...") para saltar login.
- 401 en lecturas:
  - Asegura que el script mande Authorization (ya está) y que el usuario tenga rol permitido.

Comandos rápidos (PowerShell)
- Ejecutar con login por defecto del seed:
  - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml --env-file .env up --abort-on-container-exit --remove-orphans
- Ejecutar pasando otro usuario:
  - $env:EMAIL="mi@correo.com"; $env:PASSWORD="secreto"
  - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml --env-file .env up --abort-on-container-exit --remove-orphans
- Ejecutar con JWT propio, sin login:
  - $env:JWT="eyJ..."
  - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml --env-file .env up --abort-on-container-exit --remove-orphans

Parar y limpiar
- Ctrl+C para detener; luego:
  - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml down --remove-orphans

Notas finales
- Si corres fuera de compose, define API_BASE=http://localhost:3000 en el entorno del contenedor k6.
- Ajusta stages/thresholds en perf/k6/projects-load.js si necesitas perfiles distintos (smoke, stress, spike).