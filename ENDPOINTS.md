# 📋 **FreelanceHub API - Endpoints Disponibles**

## 🔐 **Autenticación y Usuarios**

### **✅ Implementados**
| Método | Endpoint     | Descripción                      | Body/Params                                                                                                |
| ------ | ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api`       | Obtener todos los usuarios       | -                                                                                                          |
| `POST` | `/api/login` | Autenticar usuario y obtener JWT | `{ email, password }`                                                                                      |
| `POST` | `/register`  | Registrar nuevo usuario          | `{ email, password, username, first_name, last_name, phone, date_of_birth, gender, country, postal_code }` |

---

## 📝 **Posts/Publicaciones**

### **✅ Implementados**
| Método   | Endpoint                      | Descripción                 | Body/Params                                             |
| -------- | ----------------------------- | --------------------------- | ------------------------------------------------------- |
| `GET`    | `/posts`                      | Obtener todos los posts     | -                                                       |
| `GET`    | `/posts/:id`                  | Obtener post por ID         | `id` en params                                          |
| `GET`    | `/posts/user/:userId`         | Obtener posts de un usuario | `userId` en params                                      |
| `GET`    | `/posts/category/:categoryId` | Obtener posts por categoría | `categoryId` en params                                  |
| `POST`   | `/posts`                      | Crear nuevo post            | `{ user_id, title, content, image_url?, category_id? }` |
| `PUT`    | `/posts/:id`                  | Actualizar post             | `id` en params + campos a actualizar                    |
| `DELETE` | `/posts/:id`                  | Eliminar post               | `id` en params                                          |

---

## 🚀 **Proyectos**

### **✅ Implementados**
| Método   | Endpoint                             | Descripción                 | Body/Params                                                                                       |
| -------- | ------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET`    | `/projects`                          | Obtener todos los proyectos | -                                                                                                 |
| `GET`    | `/projects/:id`                      | Obtener proyecto por ID     | `id` en params                                                                                    |
| `GET`    | `/projects/client/:clientId`         | Proyectos de un cliente     | `clientId` en params                                                                              |
| `GET`    | `/projects/freelancer/:freelancerId` | Proyectos de un freelancer  | `freelancerId` en params                                                                          |
| `GET`    | `/projects/status/:status`           | Proyectos por estado        | `status` en params (`open`, `in_progress`, `completed`, `cancelled`)                              |
| `POST`   | `/projects`                          | Crear nuevo proyecto        | `{ client_id, title, description, budget, deadline?, category_id?, skills_required?, priority? }` |
| `PUT`    | `/projects/:id`                      | Actualizar proyecto         | `id` en params + campos a actualizar                                                              |
| `DELETE` | `/projects/:id`                      | Eliminar proyecto           | `id` en params                                                                                    |

---

## 💼 **Propuestas de Proyectos**

### **✅ Implementados**
| Método  | Endpoint                                       | Descripción                 | Body/Params                                                                                                     |
| ------- | ---------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/projects/proposals`                          | Crear propuesta             | `{ project_id, freelancer_id, proposed_budget, delivery_time, proposal_text, cover_letter?, portfolio_links? }` |
| `GET`   | `/projects/:projectId/proposals`               | Propuestas de un proyecto   | `projectId` en params                                                                                           |
| `GET`   | `/projects/freelancer/:freelancerId/proposals` | Propuestas de un freelancer | `freelancerId` en params                                                                                        |
| `PATCH` | `/projects/proposals/:proposalId/accept`       | Aceptar propuesta           | `proposalId` en params                                                                                          |
| `PATCH` | `/projects/proposals/:proposalId/reject`       | Rechazar propuesta          | `proposalId` en params                                                                                          |

---

## ⭐ **Reviews/Calificaciones**

### **✅ Implementados**
| Método | Endpoint                         | Descripción           | Body/Params                                                  |
| ------ | -------------------------------- | --------------------- | ------------------------------------------------------------ |
| `POST` | `/projects/reviews`              | Crear review          | `{ project_id, reviewer_id, reviewed_id, rating, comment? }` |
| `GET`  | `/projects/user/:userId/reviews` | Reviews de un usuario | `userId` en params                                           |

---

## 👥 **Freelancers**

### **✅ Implementados**
| Método | Endpoint                                            | Descripción                   | Body/Params                       |
| ------ | --------------------------------------------------- | ----------------------------- | --------------------------------- |
| `GET`  | `/api/freelancers`                                  | Obtener todos los freelancers | -                                 |
| `GET`  | `/api/freelancers/skill/:skillName`                 | Freelancers por skill         | `skillName` en params             |
| `GET`  | `/api/freelancers/skill/:skillName/level/:minLevel` | Freelancers por skill y nivel | `skillName`, `minLevel` en params |
| `GET`  | `/api/freelancers/country/:country`                 | Freelancers por país          | `country` en params               |

---

## 🧪 **Pruebas/Testing**

### **✅ Implementados**
| Método | Endpoint   | Descripción        | Body/Params |
| ------ | ---------- | ------------------ | ----------- |
| `GET`  | `/ejemplo` | Endpoint de prueba | -           |

---

## ❌ **Endpoints Faltantes (Recomendados)**

### **🔄 Gestión de Usuarios**
| Método   | Endpoint                       | Descripción                  | Prioridad |
| -------- | ------------------------------ | ---------------------------- | --------- |
| `GET`    | `/api/users/:id`               | Obtener usuario por ID       | 🔥 Alta    |
| `PUT`    | `/api/users/:id`               | Actualizar perfil de usuario | 🔥 Alta    |
| `DELETE` | `/api/users/:id`               | Eliminar cuenta de usuario   | 🔶 Media   |
| `POST`   | `/api/users/:id/upload-avatar` | Subir foto de perfil         | 🔶 Media   |
| `GET`    | `/api/users/:id/stats`         | Estadísticas del usuario     | 🔵 Baja    |

### **📊 Dashboard/Estadísticas**
| Método | Endpoint                        | Descripción                         | Prioridad |
| ------ | ------------------------------- | ----------------------------------- | --------- |
| `GET`  | `/api/dashboard/client/:id`     | Dashboard del cliente               | 🔥 Alta    |
| `GET`  | `/api/dashboard/freelancer/:id` | Dashboard del freelancer            | 🔥 Alta    |
| `GET`  | `/api/stats/projects`           | Estadísticas generales de proyectos | 🔶 Media   |
| `GET`  | `/api/stats/users`              | Estadísticas de usuarios            | 🔵 Baja    |

### **🔍 Búsqueda y Filtros**
| Método | Endpoint                                     | Descripción                  | Prioridad |
| ------ | -------------------------------------------- | ---------------------------- | --------- |
| `GET`  | `/projects/search?q=keyword`                 | Buscar proyectos por keyword | 🔥 Alta    |
| `GET`  | `/projects/filter?budget_min=X&budget_max=Y` | Filtrar por presupuesto      | 🔥 Alta    |
| `GET`  | `/projects/category/:categoryId`             | Proyectos por categoría      | 🔶 Media   |
| `GET`  | `/api/freelancers/search?q=keyword`          | Buscar freelancers           | 🔶 Media   |

### **💬 Mensajería**
| Método  | Endpoint                             | Descripción              | Prioridad |
| ------- | ------------------------------------ | ------------------------ | --------- |
| `POST`  | `/api/messages`                      | Enviar mensaje           | 🔶 Media   |
| `GET`   | `/api/messages/conversation/:userId` | Conversación con usuario | 🔶 Media   |
| `GET`   | `/api/messages/unread`               | Mensajes no leídos       | 🔶 Media   |
| `PATCH` | `/api/messages/:id/read`             | Marcar como leído        | 🔶 Media   |

### **📁 Gestión de Archivos**
| Método   | Endpoint                    | Descripción                 | Prioridad |
| -------- | --------------------------- | --------------------------- | --------- |
| `POST`   | `/api/upload/project-files` | Subir archivos del proyecto | 🔶 Media   |
| `POST`   | `/api/upload/portfolio`     | Subir archivos de portfolio | 🔶 Media   |
| `DELETE` | `/api/files/:id`            | Eliminar archivo            | 🔵 Baja    |

### **🔔 Notificaciones**
| Método  | Endpoint                      | Descripción                    | Prioridad |
| ------- | ----------------------------- | ------------------------------ | --------- |
| `GET`   | `/api/notifications`          | Obtener notificaciones         | 🔶 Media   |
| `PATCH` | `/api/notifications/:id/read` | Marcar notificación como leída | 🔶 Media   |
| `POST`  | `/api/notifications/settings` | Configurar notificaciones      | 🔵 Baja    |

### **💰 Pagos y Facturación**
| Método | Endpoint                        | Descripción        | Prioridad |
| ------ | ------------------------------- | ------------------ | --------- |
| `POST` | `/api/payments/create`          | Crear pago         | 🔶 Media   |
| `GET`  | `/api/payments/history/:userId` | Historial de pagos | 🔶 Media   |
| `POST` | `/api/invoices/generate`        | Generar factura    | 🔵 Baja    |

### **🏷️ Categorías y Skills**
| Método | Endpoint          | Descripción                  | Prioridad |
| ------ | ----------------- | ---------------------------- | --------- |
| `GET`  | `/api/categories` | Obtener todas las categorías | 🔥 Alta    |
| `POST` | `/api/categories` | Crear nueva categoría        | 🔵 Baja    |
| `GET`  | `/api/skills`     | Obtener todas las skills     | 🔥 Alta    |
| `POST` | `/api/skills`     | Crear nueva skill            | 🔵 Baja    |

---

## 📈 **Resumen del Estado Actual**

### **✅ Completados: 24 endpoints**
- ✅ Autenticación (3)
- ✅ Posts (7) 
- ✅ Proyectos (8)
- ✅ Propuestas (5)
- ✅ Reviews (2)
- ✅ Freelancers (4)
- ✅ Testing (1)

### **❌ Pendientes: 31 endpoints sugeridos**
- 🔥 **Alta prioridad**: 8 endpoints
- 🔶 **Media prioridad**: 15 endpoints  
- 🔵 **Baja prioridad**: 8 endpoints

### **🎯 Próximos pasos recomendados:**
1. **Gestión de usuarios** (GET, PUT usuarios por ID)
2. **Dashboard** (estadísticas básicas)
3. **Búsqueda de proyectos** (filtros y keywords)
4. **Categorías y skills** (endpoints básicos)

---

## 🔧 **Notas Técnicas**

### **Estados válidos:**
- **Proyectos**: `open`, `in_progress`, `completed`, `cancelled`
- **Propuestas**: `pending`, `accepted`, `rejected`
- **Prioridades**: `low`, `medium`, `high`

### **Autenticación:**
- Algunos endpoints requieren JWT en header: `Authorization: Bearer <token>`
- Usuario debe estar autenticado para crear/modificar contenido

### **Validaciones:**
- IDs deben ser números enteros
- Emails deben tener formato válido
- Ratings deben estar entre 1-5
- Presupuestos deben ser números decimales positivos