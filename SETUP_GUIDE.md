# 🚀 INNOTEAM - PMO: Setup Completo Supabase + Vercel

**Este guide te llevará paso a paso a deployar la aplicación completa y funcional en Vercel con Supabase real.**

---

## PARTE 1: Crear Proyecto en Supabase (5 minutos)

### 1. Ir a Supabase
- Abre https://supabase.com
- Inicia sesión con tu cuenta
- Click en "New Project"

### 2. Crear Proyecto
- **Name:** `innoteam-pmo` (o el nombre que prefieras)
- **Database Password:** Genera una contraseña fuerte (cópiala y guárdala)
- **Region:** `South America (São Paulo)` o la más cercana a tu zona
- Click en "Create new project"

⏳ **Espera 2-3 minutos mientras se crea el proyecto...**

### 3. Copiar Credenciales
Una vez creado el proyecto:
1. Ve a **Settings → API** (en el menú izquierdo)
2. Copia estas 3 credenciales y guárdalas:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

Guarda estas en un archivo seguro (las necesitarás en el paso siguiente).

---

## PARTE 2: Crear Schema en Supabase (5 minutos)

### 1. Abre SQL Editor
- En Supabase, ve a **SQL Editor** (menú izquierdo)
- Click en "+ New Query"

### 2. Copiar el Schema
- Abre el archivo `DATABASE.sql` del proyecto
- Copia **TODO** el contenido

### 3. Pegar en Supabase
- Pega el SQL completo en el editor de Supabase
- Click en "Run" (botón azul abajo a la derecha)

✅ **Espera a que termine. Deberías ver "Query successful".**

### 4. Verificar Tablas
- Ve a **Table Editor** (menú izquierdo)
- Deberías ver estas 9 tablas:
  - companies
  - projects
  - deliverables
  - phase_checkpoints
  - alerts
  - action_items
  - observations
  - audit_log

---

## PARTE 3: Crear Usuarios de Test (3 minutos)

### 1. Ve a Authentication
- En Supabase, click en **Authentication** (menú izquierdo)
- Click en "Users"

### 2. Crear Primer Usuario
- Click en "+ Add user"
- **Email:** `pm@innoteam.com`
- **Password:** `TestPassword123!` (cópiala)
- Click en "Create user"

### 3. Crear Segundo Usuario
- Repite el proceso:
- **Email:** `consultant@innoteam.com`
- **Password:** `TestPassword123!`
- Click en "Create user"

✅ **Deberías ver 2 usuarios en la lista.**

---

## PARTE 4: Configurar Vercel + Deploy (10 minutos)

### 1. Loguear en Vercel
```bash
vercel login
```
- Se abrirá el navegador, confirma tu cuenta

### 2. Configurar Variables de Entorno
```bash
cd "C:\Users\ander\OneDrive\Documentos\Proyectos - AWG\Innoteam-PMO"
vercel env add NEXT_PUBLIC_SUPABASE_URL
```
Pega la URL del Proyecto Supabase que copiaste en Parte 1

```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Pega el anon key

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
```
Pega el service role key

```bash
vercel env add NEXT_PUBLIC_APP_NAME
```
Escribe: `INNOTEAM - PMO`

```bash
vercel env add NEXT_PUBLIC_APP_VERSION
```
Escribe: `1.0.0`

### 3. Deploy
```bash
vercel --prod
```

Responde a las preguntas:
- **Project name:** `innoteam-pmo` (o deja el default)
- **Link to existing project?** No
- **Which directory?** `.` (punto)
- **Override settings?** No

⏳ **Espera a que termine el deploy (1-2 minutos)...**

✅ **Al terminar, Vercel te dará una URL así:** `https://innoteam-pmo.vercel.app`

---

## PARTE 5: Verificar que TODO Funciona (5 minutos)

### 1. Abre tu URL de Vercel
- Ve a la URL que Vercel te dio
- Deberías ver la página de LOGIN

### 2. Prueba Login
- **Email:** `pm@innoteam.com`
- **Password:** `TestPassword123!`
- Click en "Ingresar"

✅ **Si te redirige al Dashboard, ¡FUNCIONA!**

### 3. Navega por las Páginas
- Click en "📁 Proyectos" → Ve 15 sociedades y sus datos
- Click en "✓ Entregables" → Ve tabla con 45 entregables
- Click en "⚠ Alertas" → Ve 4 alertas críticas
- Click en "→ Acciones" → Ve 6 próximos pasos
- Click en "⚙ Administración" → Ve panel admin

### 4. Prueba Tema
- Arriba a la derecha del Dashboard, click en ☀ (sol)
- El tema debe cambiar a claro
- Click en ☾ (luna) para volver a oscuro

### 5. Logout y Prueba Segundo Usuario
- Click en ⎋ (arriba a la derecha)
- Login con: `consultant@innoteam.com` / `TestPassword123!`
- Debe funcionar igual

✅ **Si todo esto funciona, ¡estás 100% deployado!**

---

## PARTE 6: Conectar Supabase Real a la App (Opcional pero Recomendado)

En este momento, la app usa **mock data** (datos falsos en memoria). Para usar Supabase real:

### 1. Reemplazar en `src/lib/supabase.ts`
Cambiar de mock data a queries reales:

```typescript
export async function getDeliverables() {
  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
  if (error) throw error
  return data
}
```

### 2. Usar en componentes
En lugar de:
```typescript
import { getDeliverables } from '@/lib/mockData'
```

Usar:
```typescript
import { getDeliverables } from '@/lib/supabase'
```

Este cambio requiere editar múltiples archivos. **Te lo haré en la siguiente iteración si lo necesitas.**

---

## 🎉 ¡LISTO!

Tu aplicación está completamente deployada con:
- ✅ Login real con Supabase Auth
- ✅ Base de datos en Supabase
- ✅ Alojada en Vercel (URL pública)
- ✅ Tema claro/oscuro
- ✅ Todas las páginas funcionando
- ✅ Datos de ejemplo (mock data)

---

## 📞 Si Algo Falla

### Error "Invalid SUPABASE_URL"
→ Verifica que copiaste correctamente la URL de Supabase en .env

### Login no funciona
→ Verifica que creaste el usuario en Supabase Authentication

### Vercel dice "unauthorized"
→ Corre `vercel logout` y luego `vercel login` de nuevo

### Deploy se queda atascado
→ Corre: `vercel --prod --force`

---

## 🔐 Variables de Entorno (Resumen)

Estas 5 variables deben estar en Vercel Settings → Environment Variables:

| Variable | De Dónde |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role secret |
| `NEXT_PUBLIC_APP_NAME` | `INNOTEAM - PMO` |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` |

---

## URLs Importantes

- **GitHub:** https://github.com/andersson-astete/innoteam-pmo
- **Tu Vercel URL:** Obtenida al hacer deploy (será algo como `https://innoteam-pmo.vercel.app`)
- **Supabase Dashboard:** https://supabase.com/projects

---

**¡Tiempo total: ~30 minutos de configuración y ya está en producción!**
