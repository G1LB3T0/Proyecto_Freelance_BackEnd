# Pruebas de carga y estrés

Este folder contiene scripts y configuración para ejecutar pruebas de carga con k6 dentro de Docker.

## Contenido
- `perf/k6/projects-load.js`: script k6 con escenarios de lectura y escritura y thresholds p95<500ms.
- `docker-compose.k6.yml`: servicio `k6` que ejecuta el script contra el `backend` del compose principal.

## Requisitos
- Docker y docker-compose.
- Backend levantado con `Docker-compose.yml` de este repo (servicio `backend`).

## Cómo ejecutar
1) Arranca DB + backend (si no está corriendo):
   - docker-compose -f Docker-compose.yml up -d

2) Ejecuta pruebas k6 en un contenedor (combina ambos archivos compose):
   - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml --env-file .env up --abort-on-container-exit --remove-orphans

   Alternativa en dos pasos:
   - docker-compose -f Docker-compose.yml up -d
   - docker-compose -f Docker-compose.yml -f docker-compose.k6.yml up --abort-on-container-exit --remove-orphans

   Variables opcionales:
   - EMAIL y PASSWORD (para login en setup). Por defecto usa un project_manager del seed: `pablo456@gmail.com` / `hola456`.
   - Alternativamente, puedes pasar un JWT y se omitirá el login:
       - set JWT=eyJhbGciOi... (Windows PowerShell: $env:JWT="...")
       - docker-compose -f docker-compose.k6.yml up
    - Control de espera de backend en setup (reintentos):
       - READY_TIMEOUT_MS (default 60000)
       - READY_RETRY_MS (default 2000)

    Ejemplo (Windows PowerShell con rutas absolutas):
    - docker-compose -f "c:\\Users\\luisy\\Desktop\\WEB\\Proyecto_ING\\Proyecto_Freelance_BackEnd\\Docker-compose.yml" -f "c:\\Users\\luisy\\Desktop\\WEB\\Proyecto_ING\\Proyecto_Freelance_BackEnd\\docker-compose.k6.yml" --env-file "c:\\Users\\luisy\\Desktop\\WEB\\Proyecto_ING\\Proyecto_Freelance_BackEnd\\.env" up --abort-on-container-exit --remove-orphans

3) Interpretar resultados
   - k6 mostrará métricas de latencia (p(95)), RPS y error rate. Los thresholds fallarán si p95>=500ms o errores>=2%.

## Notas
- El script usa API_BASE=http://backend:3000 (resolución de servicio por compose). Si corres fuera de compose, cambia a http://localhost:3000 via env.
- Puedes ajustar etapas y thresholds en el script según tus necesidades.
- Si deseas usar Artillery en lugar de k6, podemos añadir otro script en `perf/artillery`.
 - El servicio `k6` ahora espera a que `backend` esté healthy (depends_on: service_healthy) y además el `setup` reintenta login hasta READY_TIMEOUT_MS.
