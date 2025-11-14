# 💰 **Sistema de Pagos - Endpoints API**

## 🎯 **Flujo Completo de Pagos**

```
1. Cliente acepta propuesta → Se crea transacción de escrow (status: pending)
2. Cliente deposita fondos → Transacción en escrow (status: completed)
3. Freelancer completa proyecto → Proyecto status: completed
4. Cliente libera pago → Se crea payout al freelancer + comisión plataforma
```

---

## 📋 **Endpoints Implementados**

### **1️⃣ Obtener Estado de Pago de un Proyecto**
**GET** `/api/payments/project/:projectId`

**Descripción**: Consulta el estado actual del pago de un proyecto

**Headers**:
```json
{
  "Authorization": "Bearer <tu_token_jwt>"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "project_id": 1,
    "project_status": "in_progress",
    "expected_payment": 5000.00,
    "escrow_amount": 5000.00,
    "released_amount": 0.00,
    "payment_status": "escrowed",
    "transactions": [...]
  }
}
```

**Estados de Pago**:
- `pending_deposit`: Cliente debe depositar fondos
- `partial_escrow`: Depósito parcial
- `escrowed`: Fondos completos en custodia
- `payment_released`: Pago liberado al freelancer

---

### **2️⃣ Depositar Fondos en Escrow (Cliente)**
**POST** `/api/payments/escrow/deposit`

**Descripción**: El cliente deposita dinero en custodia para un proyecto

**Headers**:
```json
{
  "Authorization": "Bearer <token_cliente>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "project_id": 1,
  "amount": 5000.00,
  "payment_method": "bank_transfer"
}
```

**Campos**:
- `project_id` (requerido): ID del proyecto
- `amount` (requerido): Monto a depositar
- `payment_method` (opcional): "bank_transfer", "credit_card", "paypal", etc.

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Fondos depositados en escrow exitosamente",
  "data": {
    "id": 123,
    "title": "Depósito Escrow - Nombre Proyecto",
    "amount": "5000.00",
    "status": "completed",
    "metadata": {
      "payment_type": "escrow",
      "escrow_status": "deposited"
    }
  }
}
```

---

### **3️⃣ Liberar Pago al Freelancer (Cliente)**
**POST** `/api/payments/release`

**Descripción**: El cliente libera el pago cuando el proyecto está completado

**Headers**:
```json
{
  "Authorization": "Bearer <token_cliente>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "project_id": 1
}
```

**Validaciones**:
- ✅ El proyecto debe estar en estado `completed`
- ✅ Debe haber una propuesta aceptada
- ✅ Debe haber fondos depositados en escrow
- ✅ El pago no debe haber sido liberado previamente

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Pago liberado al freelancer exitosamente",
  "data": {
    "payout": {
      "id": 124,
      "user_id": 5,
      "amount": "4500.00",
      "type": "income",
      "status": "completed"
    },
    "commission": {
      "id": 10,
      "amount": "500.00",
      "rate": 0.10
    },
    "summary": {
      "total_amount": 5000.00,
      "freelancer_receives": 4500.00,
      "platform_commission": 500.00,
      "commission_rate": "10%"
    }
  }
}
```

---

### **4️⃣ Historial de Pagos (Freelancer)**
**GET** `/api/payments/freelancer/history`

**Descripción**: Obtiene todos los pagos recibidos por el freelancer

**Headers**:
```json
{
  "Authorization": "Bearer <token_freelancer>"
}
```

**Query Params** (opcionales):
- `status`: "completed", "pending"
- `limit`: Número de resultados (default: 50)
- `offset`: Desplazamiento (default: 0)

**Ejemplo**: `/api/payments/freelancer/history?status=completed&limit=20`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "title": "Pago Recibido - Proyecto X",
      "amount": "4500.00",
      "transaction_date": "2025-11-13T10:00:00.000Z",
      "status": "completed",
      "project": {
        "id": 1,
        "title": "Proyecto X",
        "client": {
          "id": 3,
          "username": "cliente123"
        }
      }
    }
  ],
  "summary": {
    "total_earnings": 15000.00,
    "total_payments": 5,
    "showing": 5
  }
}
```

---

### **5️⃣ Pagos Pendientes de Liberar (Cliente)**
**GET** `/api/payments/client/pending`

**Descripción**: Lista proyectos completados con pagos pendientes de liberar

**Headers**:
```json
{
  "Authorization": "Bearer <token_cliente>"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "project_id": 2,
      "project_title": "Desarrollo Web",
      "freelancer": {
        "id": 5,
        "username": "freelancer_pro"
      },
      "amount": 3000.00,
      "completion_date": "2025-11-10T00:00:00.000Z",
      "days_since_completion": 3
    }
  ],
  "count": 1
}
```

---

## 🧪 **Ejemplos de Prueba con cURL**

### **1. Depositar en Escrow**
```bash
curl -X POST http://localhost:3000/api/payments/escrow/deposit \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "amount": 5000,
    "payment_method": "bank_transfer"
  }'
```

### **2. Verificar Estado del Pago**
```bash
curl -X GET http://localhost:3000/api/payments/project/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **3. Liberar Pago**
```bash
curl -X POST http://localhost:3000/api/payments/release \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1
  }'
```

### **4. Ver Historial de Pagos (Freelancer)**
```bash
curl -X GET http://localhost:3000/api/payments/freelancer/history \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

---

## 🔐 **Permisos y Seguridad**

| Endpoint | Cliente | Freelancer | Admin |
|----------|---------|------------|-------|
| GET /project/:id | ✅ | ✅ | ✅ |
| POST /escrow/deposit | ✅ | ❌ | ✅ |
| POST /release | ✅ | ❌ | ✅ |
| GET /freelancer/history | ❌ | ✅ | ✅ |
| GET /client/pending | ✅ | ❌ | ✅ |

---

## 💡 **Notas Importantes**

1. **Comisión de Plataforma**: 10% del monto total
2. **Escrow Automático**: Se crea automáticamente al aceptar propuesta
3. **Estado del Proyecto**: Debe estar en `completed` para liberar pago
4. **Validación de Fondos**: No se puede liberar sin fondos en escrow
5. **Una Sola Liberación**: No se puede liberar el mismo pago dos veces

---

## 🐛 **Códigos de Error Comunes**

| Código | Error | Solución |
|--------|-------|----------|
| 400 | "project_id y amount son requeridos" | Enviar ambos campos en el body |
| 403 | "Solo el cliente puede depositar fondos" | Usar token del cliente del proyecto |
| 404 | "Proyecto no encontrado" | Verificar que el project_id existe |
| 400 | "El proyecto debe estar completado" | Cambiar status del proyecto a 'completed' |
| 400 | "No hay fondos en escrow" | Depositar fondos primero |
| 400 | "El pago ya fue liberado" | Este pago ya fue procesado |

---

## 🔄 **Próximos Pasos**

Para testear el flujo completo:

1. ✅ Crear proyecto (como cliente)
2. ✅ Freelancer envía propuesta
3. ✅ Cliente acepta propuesta (crea escrow automático)
4. ✅ Cliente deposita fondos: `POST /api/payments/escrow/deposit`
5. ✅ Cambiar proyecto a completado: `PUT /projects/:id` con `{ "status": "completed" }`
6. ✅ Cliente libera pago: `POST /api/payments/release`
7. ✅ Freelancer verifica pago: `GET /api/payments/freelancer/history`

---

## 📊 **Modelo de Datos**

La tabla `transactions` almacena todos los movimientos con el campo `metadata`:

```json
{
  "payment_type": "escrow" | "payout",
  "escrow_status": "awaiting_deposit" | "deposited",
  "proposal_id": 123,
  "freelancer_id": 5,
  "original_amount": 5000.00,
  "commission_amount": 500.00,
  "commission_rate": 0.10
}
```
