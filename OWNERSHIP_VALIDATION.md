# 🔐 Endpoints con Validación de Ownership Implementada

## Opciones Implementadas:

### **Opción B**: ID automático del usuario autenticado
### **Opción C**: Middleware de validación de ownership

---

## 📋 **Nuevos Middlewares de Validación**

### `validateOwnership(options)`
Middleware flexible para validar que el usuario solo acceda a sus propios recursos.

**Opciones:**
- `idField`: Campo a validar (default: 'client_id')
- `source`: Origen del ID ('body', 'params', 'query')
- `allowedRoles`: Roles permitidos para esta validación
- `skipForRoles`: Roles que pueden saltarse la validación (ej: 'admin')

### Helpers específicos:
- `validateClientOwnership`: Para validar client_id
- `validateFreelancerOwnership`: Para validar freelancer_id  
- `validateUserOwnership`: Para validar user_id
- `validateParamOwnership(paramName)`: Para validar parámetros de URL

---

## 🛡️ **Endpoints Protegidos**

### **PROYECTOS** (`/projects`)

| Método   | Endpoint                    | Validación                                 | Descripción                               |
| -------- | --------------------------- | ------------------------------------------ | ----------------------------------------- |
| `POST`   | `/`                         | ✅ Usa `req.user.id` automáticamente        | Crea proyecto para el usuario autenticado |
| `PUT`    | `/:id`                      | ✅ Valida ownership en controlador          | Solo el dueño puede actualizar            |
| `DELETE` | `/:id`                      | ✅ Valida ownership en controlador          | Solo el dueño puede eliminar              |
| `GET`    | `/client/:clientId`         | ✅ `validateParamOwnership('clientId')`     | Solo propios proyectos o admin            |
| `GET`    | `/freelancer/:freelancerId` | ✅ `validateParamOwnership('freelancerId')` | Solo propios proyectos o admin            |

### **PROPUESTAS** (`/proposals`)

| Método | Endpoint                    | Validación                                 | Descripción                                   |
| ------ | --------------------------- | ------------------------------------------ | --------------------------------------------- |
| `POST` | `/`                         | ✅ Usa `req.user.id` automáticamente        | Crea propuesta para el freelancer autenticado |
| `GET`  | `/freelancer/:freelancerId` | ✅ `validateParamOwnership('freelancerId')` | Solo propias propuestas o admin               |

---

## 📝 **Ejemplos de Uso**

### Crear Proyecto (Automático)
```bash
# Antes (inseguro):
curl -X POST /projects \
  -H "Authorization: Bearer token" \
  -d '{"client_id": 5, "title": "Mi proyecto"}'  # Podía usar cualquier client_id

# Ahora (seguro):
curl -X POST /projects \
  -H "Authorization: Bearer token" \
  -d '{"title": "Mi proyecto"}'  # client_id = req.user.id automáticamente
```

### Crear Propuesta (Automático)
```bash
# Antes (inseguro):
curl -X POST /proposals \
  -H "Authorization: Bearer token" \
  -d '{"project_id": 1, "freelancer_id": 3, "proposed_budget": 1000}'  # Podía usar cualquier freelancer_id

# Ahora (seguro):
curl -X POST /proposals \
  -H "Authorization: Bearer token" \
  -d '{"project_id": 1, "proposed_budget": 1000}'  # freelancer_id = req.user.id automáticamente
```

### Acceso a Recursos Propios
```bash
# Usuario ID 5 autenticado:
curl -X GET /projects/client/5 \
  -H "Authorization: Bearer token"  # ✅ Permitido

curl -X GET /projects/client/7 \
  -H "Authorization: Bearer token"  # ❌ 403 Forbidden

# Admin puede acceder a cualquier recurso:
curl -X GET /projects/client/7 \
  -H "Authorization: Bearer admin_token"  # ✅ Permitido
```

---

## 🔧 **Configuración Custom**

### Ejemplo de validación personalizada:
```javascript
// En tus rutas
const customValidator = validateOwnership({
    idField: 'author_id',
    source: 'body',
    allowedRoles: ['author', 'editor'],
    skipForRoles: ['admin', 'super_admin']
});

router.post('/articles', authMiddleware, customValidator, createArticle);
```

### Validación en parámetros:
```javascript
// Validar que el usuario solo pueda acceder a su perfil
router.get('/profile/:userId', 
    authMiddleware, 
    validateParamOwnership('userId'), 
    getUserProfile
);
```

---

## 🛡️ **Beneficios de Seguridad**

1. **Prevención de escalación horizontal**: Los usuarios no pueden acceder a recursos de otros usuarios
2. **Automático**: Los IDs se asignan automáticamente del token JWT
3. **Flexible**: Diferentes validaciones para diferentes endpoints
4. **Admin-friendly**: Los admins pueden saltarse validaciones
5. **Granular**: Control por rol y por campo

---

## ⚡ **Casos de Uso Adicionales**

Puedes usar estos middlewares en otros controladores:

- **Posts**: `validateUserOwnership` para que solo el autor edite
- **Profile**: `validateParamOwnership('userId')` para acceso a perfil propio
- **Reviews**: Validar que reviewer_id === req.user.id
- **Files**: Validar ownership de archivos subidos

¡La validación está lista para usarse en toda tu aplicación! 🎉
