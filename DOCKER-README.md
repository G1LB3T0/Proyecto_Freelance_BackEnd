# 🐳 Docker Setup para el Equipo

## 🚀 Inicio Rápido

```bash
# Clonar el proyecto
git clone <repo-url>
cd Proyecto_Freelance_BackEnd

# Levantar servicios
docker-compose up --build -d

# Probar endpoint
curl "http://localhost:3000/api/users/me/stats?user_id=1"
```

## 🔧 Compatibilidad

### ✅ **Funciona en:**
- macOS (Intel & Apple Silicon)  
- Ubuntu/Debian Linux
- Windows con WSL2

### ⚠️  **Problemas conocidos:**
- **Alpine Linux en macOS**: Usar `FROM node:18` en lugar de `node:18-alpine`

## 📊 **Endpoints Disponibles**

### Stats del Usuario
```bash
GET /api/users/me/stats?user_id=1
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "projects": {"total": 2, "active": 0, "completed": 0, "pending": 0},
    "posts": {"total": 2, "total_likes": 57, "total_comments": 17}, 
    "profile": {"views": 156, "connections": 34},
    "notifications": {"unread": 4}
  }
}
```

## 🛠️ **Comandos Útiles**

```bash
# Ver logs
docker-compose logs -f

# Reiniciar servicios  
docker-compose restart

# Limpiar todo
docker-compose down -v
```

## 🐛 **Troubleshooting**

**Problema**: Error de permisos en Alpine
**Solución**: Cambiar `FROM node:18-alpine` → `FROM node:18`

**Problema**: Puerto 3000 ocupado
**Solución**: `docker-compose down` o cambiar puerto en `docker-compose.yml`
