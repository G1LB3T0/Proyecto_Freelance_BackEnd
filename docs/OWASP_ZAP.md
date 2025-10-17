# Pruebas de seguridad OWASP ZAP

Este documento explica como se ejecutan las pruebas de seguridad automaticas incluidas en el backend utilizando **OWASP ZAP** dentro de contenedores. Encontraras que hace cada prueba, los pasos para correrla localmente o en CI y donde revisar los resultados.

## Requisitos previos
- Docker Desktop 4.0+ (o Docker Engine 20.10+) en ejecucion.
- `docker compose` disponible en la linea de comandos.
- Puerto `3000` libre en tu maquina si deseas acceder manualmente al backend durante las pruebas.

## Resumen de scripts disponibles
| Script | Descripcion |
| --- | --- |
| `npm run security:stack-up` | Levanta `db` y `backend` en segundo plano usando `Docker-compose.yml`. |
| `npm run security:zap-baseline` | Ejecuta un analisis **pasivo** con `zap-baseline.py`. No envia payloads intrusivos. |
| `npm run security:zap-full` | Ejecuta un analisis **activo** con `zap-full-scan.py`. Incluye pruebas intrusivas, usalo solo en entornos aislados. |
| `npm run security:stack-down` | Apaga la pila y elimina los volumenes creados durante la prueba. |

Los reportes generados se guardan automaticamente en `tests/security/zap/reports/` en formato **HTML**, **JSON** y **XML** para cada ejecucion (`zap-baseline-report.*` o `zap-full-report.*`).

## Paso a paso: analisis Baseline (pasivo)
1. **Levanta el stack** (db + backend) en modo detached:
   ```powershell
   npm run security:stack-up
   ```
2. **Ejecuta el escaneo Baseline** (no intrusivo):
   ```powershell
   npm run security:zap-baseline
   ```
   - El contenedor `ghcr.io/zaproxy/zaproxy:stable` se adjunta a la red interna de Docker Compose y analiza `http://backend:3000`.
   - El comando fallara (codigo distinto de cero) si detecta alertas de riesgo medio o alto.
   - Los resultados se guardan en `tests/security/zap/reports/` como:
     - `zap-baseline-report.html` (reporte visual)
     - `zap-baseline-report.json`
     - `zap-baseline-report.xml`
3. **Analiza los resultados** abriendo el HTML en tu navegador.
4. **Apaga los contenedores** al finalizar:
   ```powershell
   npm run security:stack-down
   ```

## Paso a paso: analisis Full Scan (activo)
> WARNING: Este escaneo lanza ataques activos (SQLi, XSS, fuzzing). Usalo solo contra entornos controlados o de staging con datos desechables.

1. Asegurate de tener la pila levantada (`npm run security:stack-up`).
2. Ejecuta el escaneo full:
   ```powershell
   npm run security:zap-full
   ```
   - Ejecuta `zap-full-scan.py` desde el contenedor oficial `ghcr.io/zaproxy/zaproxy:stable`.
   - Puede tardar varios minutos y generar trafico agresivo.
   - Produce `zap-full-report.html`, `zap-full-report.json` y `zap-full-report.xml` en `tests/security/zap/reports/`.
3. Revisa el HTML generado para entender hallazgos, URLs afectadas y nivel de riesgo.
4. Derriba la pila una vez terminado (`npm run security:stack-down`).

## Personalizacion avanzada
### Apuntar a otra URL
- Para forzar el objetivo del scan, define la variable de entorno `ZAP_TARGET` antes de ejecutar el script.
- Ejemplo en PowerShell:
  ```powershell
  $env:ZAP_TARGET = "http://localhost:3000"
  npm run security:zap-baseline
  Remove-Item Env:\ZAP_TARGET
  ```

### Cargar un archivo OpenAPI/Swagger
1. Copia tu especificacion como `tests/security/zap/openapi.yaml` (u otro nombre).
2. Indica la ruta dentro del contenedor usando `ZAP_BASELINE_EXTRA` o `ZAP_FULL_EXTRA`:
   ```powershell
   $env:ZAP_BASELINE_EXTRA = '-z "openapifile=/zap/wrk/openapi.yaml"'
   npm run security:zap-baseline
   Remove-Item Env:\ZAP_BASELINE_EXTRA
   ```
   Esto alimenta el spider con todos los endpoints declarados.

### Autenticacion o contextos
- Anade scripts (por ejemplo auth en JavaScript) dentro de `tests/security/zap/` y referencia su ruta mediante `ZAP_BASELINE_EXTRA` o `ZAP_FULL_EXTRA` segun corresponda.
- Puedes ajustar reglas a ignorar en `tests/security/zap/zap-baseline.conf` (ej. `ignore=10095`).

## Integracion CI/CD
El workflow `.github/workflows/ci-tests.yml` incluye el job `zap_baseline`:
- Levanta la pila Docker (`db` + `backend`).
- Ejecuta `docker compose ... run --rm zap-baseline` usando la misma configuracion que los scripts locales.
- Publica el artefacto `zap-baseline-report` con los archivos generados.
- Derriba los contenedores y limpia volumenes.

Puedes descargar el artefacto desde la ejecucion en GitHub Actions para ver los hallazgos. Si el job falla, revisa el reporte HTML para corregir vulnerabilidades antes de reintentar.

## Interpretar resultados
- **Riesgo Alto (High)**: exposicion critica. Atiende inmediatamente.
- **Riesgo Medio (Medium)**: requiere revision prioritaria.
- **Riesgo Bajo (Low)** o **Informativo (Informational)**: utilizalo como guia para endurecer el servicio.
- Registra tickets o historias tecnicas para cada hallazgo significativo.

## Buenas practicas
- Repite el Baseline en cada PR (ya automatizado via CI).
- Ejecuta el Full Scan con menor frecuencia (ej. semanal) o antes de despliegues mayores.
- Manten los reportes historicos para medir la evolucion del riesgo.
- Actualiza los scripts cuando cambien rutas, autenticacion o la topologia del backend.
