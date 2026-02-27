# 💳 Sistema de Depósitos - Guía de Integración Frontend

## Componentes Creados

### 1. **DepositService** (`src/services/depositService.ts`)
Servicio que maneja todas las peticiones https al backend para depósitos.

**Métodos disponibles:**
- `createDepositRequest(productId, quantity)` - Crea nueva solicitud
- `uploadDepositProof(depositId, file)` - Sube comprobante
- `getMyDepositRequests()` - Obtiene todas las solicitudes del usuario
- `getDepositStatus(depositId)` - Obtiene estado de una solicitud

---

## 2. Componentes React

### **DepositRequest** (`src/components/DepositRequest.tsx`)
Modal para crear nueva solicitud de depósito.

**Características:**
- Selecciona producto de lista
- Define cantidad
- Muestra resumen de pedido
- Validaciones en tiempo real

**Props:**
- `onSuccess?: () => void` - Callback cuando se crea exitosamente

**Uso:**
```tsx
import DepositRequest from './components/DepositRequest';

<DepositRequest onSuccess={() => console.log('Solicitud creada')} />
```

---

### **UploadProof** (`src/components/UploadProof.tsx`)
Componente para subir comprobante de pago.

**Características:**
- Drag & drop para cargar imagen
- Previsualización antes de subir
- Validación de tipo y tamaño
- Muestra estado del comprobante

**Props:**
- `deposit: DepositRequest` (requerido) - Datos de la solicitud
- `onSuccess?: () => void` - Callback al subir exitosamente
- `onClose?: () => void` - Callback para cerrar

**Uso:**
```tsx
import UploadProof from './components/UploadProof';

<UploadProof 
  deposit={depositData}
  onSuccess={() => loadDeposits()}
  onClose={() => setShowModal(false)}
/>
```

---

### **MyDeposits** (`src/components/MyDeposits.tsx`)
Vista principal con historial de depósitos del usuario.

**Características:**
- Lista todas las solicitudes
- Filtros por estado (Todas, Pendientes, Aprobadas, Rechazadas)
- Estadísticas (tarjetas de conteo)
- Botones rápidos para subir comprobante
- Muestra comentarios del admin

**Uso:**
```tsx
import MyDeposits from './components/MyDeposits';

<MyDeposits />
```

---

## 3. Estilos CSS

Todos los componentes tienen estilos incluidos:
- `src/styles/DepositRequest.css`
- `src/styles/UploadProof.css`
- `src/styles/MyDeposits.css`

**Colores principales:**
- Primario: `#667eea` / `#764ba2` (gradiente)
- Estado Pendiente: `#ffc107` (amarillo)
- Estado Aprobado: `#28a745` (verde)
- Estado Rechazado: `#dc3545` (rojo)

---

## 4. Integración en Rutas

### Opción A: Página Dedicada
Crea `src/pages/usuario/Deposits.tsx`:
```tsx
import React from 'react';
import DepositRequest from '../../components/DepositRequest';
import MyDeposits from '../../components/MyDeposits';

export const Deposits = () => {
  return (
    <div className="deposits-page">
      <DepositRequest />
      <MyDeposits />
    </div>
  );
};
```

Luego añade en tu router:
```tsx
import { Deposits } from './pages/usuario/Deposits';

<Route path="/deposits" element={<Deposits />} />
```

### Opción B: Integrar en Página Existente (Store)
En `src/pages/Store.tsx`:
```tsx
import DepositRequest from '../components/DepositRequest';
import MyDeposits from '../components/MyDeposits';

export const Store = () => {
  const [tab, setTab] = useState('browse');

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setTab('browse')}>Productos</button>
        <button onClick={() => setTab('deposits')}>Mis Depósitos</button>
      </div>

      {tab === 'browse' && (
        <>
          <DepositRequest />
          {/* tu lista de productos existente */}
        </>
      )}

      {tab === 'deposits' && <MyDeposits />}
    </div>
  );
};
```

---

## 5. Flujo de Usuario Completo

1. **Usuario ve productos** → `DepositRequest` muestra modal
2. **Selecciona producto y cantidad** → Se crea solicitud en BD
3. **Backend retorna ID de solicitud**
4. **Usuario sube comprobante** → `UploadProof` carga imagen
5. **Admin revisa** → Aprueba o rechaza
6. **Usuario ve estado actualizado** → `MyDeposits` muestra resultado

---

## 6. Estados del Depósito

```
deposit_status:
  - pending: Esperando comprobante
  - approved: ✓ Aprobado (puntos asignados)
  - rejected: ✗ Rechazado (stock restaurado)
  - expired: ⌛ Expirado (después de 24h sin comprobante)
```

---

## 7. Validaciones Frontend

✅ **Archivo:**
- Solo imágenes (jpg, png, webp)
- Máximo 4MB

✅ **Cantidad:**
- Mínimo 1
- No puede exceder stock disponible

✅ **Autenticación:**
- Requiere token válido
- Redirige a login si expira

---

## 8. Manejo de Errores

Todos los servicios retornan estructura:
```typescript
{
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
```

**Ejemplo:**
```tsx
const result = await DepositService.createDepositRequest(1, 5);
if (result.success) {
  console.log('Solicitud creada:', result.data.id);
} else {
  console.error('Error:', result.message);
}
```

---

## 9. Conectar con Admin (Próximo Paso)

Una vez funcione la parte del usuario, crearemos:
- `AdminDepositDashboard` - Vista para revisar depósitos
- Componentes para aprobar/rechazar
- Notificaciones en tiempo real

---

## ✅ Checklist de Integración

- [ ] Copiar `depositService.ts` a `src/services/`
- [ ] Copiar 3 componentes .tsx a `src/components/`
- [ ] Copiar 3 archivos .css a `src/styles/`
- [ ] Importar componentes donde necesites
- [ ] Probar flujo completo
- [ ] Verificar estilos (ajustar si es necesario)
- [ ] Conectar a rutas del navbar/menu
