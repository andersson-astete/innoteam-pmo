# 🚀 DEPLOY AHORA: Guía Rápida (30 minutos)

**Tu aplicación está 100% lista. Solo sigue estos 4 pasos para tener todo en producción con Supabase + Vercel.**

---

## PASO 1: Supabase Setup (10 minutos)

### 1.1 Crear Proyecto
1. Ve a https://supabase.com
2. Inicia sesión (o crea cuenta)
3. Click en "New Project"
4. Nombre: `innoteam-pmo`
5. Contraseña fuerte (guárdala)
6. Region: `South America (São Paulo)` o cercana
7. Click "Create new project"
8. **Espera 2-3 minutos** a que se complete

### 1.2 Copiar Credenciales
1. En el proyecto, ve a **Settings → API**
2. Copia estas 3 líneas (guárdala en un bloc de notas):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...xxxxx
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...xxxxx
   ```

### 1.3 Crear Schema
1. En Supabase, ve a **SQL Editor**
2. Click en "+ New Query"
3. Abre el archivo `DATABASE.sql` del proyecto
4. Copia **TODO** el contenido
5. Pega en el SQL Editor de Supabase
6. Click "Run"
7. **Espera a que termine** (verás "Query successful")

### 1.4 Crear Usuarios de Test
1. En Supabase, ve a **Authentication → Users**
2. Click "+ Add user"
3. Usuario 1:
   - Email: `pm@innoteam.com`
   - Password: `TestPassword123!`
   - Click "Create user"
4. Usuario 2:
   - Email: `consultant@innoteam.com`
   - Password: `TestPassword123!`
   - Click "Create user"

✅ **Paso 1 completado. Supabase está listo.**

---

## PASO 2: Vercel Deploy (10 minutos)

### 2.1 Login en Vercel (Terminal)
```bash
vercel login
```
- Se abrirá el navegador
- Confirma tu cuenta

### 2.2 Configurar Environment Variables
En tu terminal, corre estos comandos DESDE la carpeta del proyecto:

```bash
cd "C:\Users\ander\OneDrive\Documentos\Proyectos - AWG\Innoteam-PMO"

vercel env add NEXT_PUBLIC_SUPABASE_URL
```
→ Pega la URL de Supabase (de Paso 1.2)

```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```
→ Pega el anon key (de Paso 1.2)

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
```
→ Pega el service role key (de Paso 1.2)

```bash
vercel env add NEXT_PUBLIC_APP_NAME
```
→ Escribe: `INNOTEAM - PMO`

```bash
vercel env add NEXT_PUBLIC_APP_VERSION
```
→ Escribe: `1.0.0`

### 2.3 Deploy
```bash
vercel --prod
```

Vercel te hará preguntas:
- **Project name:** `innoteam-pmo` (o deja default)
- **Link to existing project?** `No`
- **Directory:** `.` (punto)
- **Override settings?** `No`

**Espera 1-2 minutos** a que termine.

✅ **Vercel te dará una URL:** `https://innoteam-pmo.vercel.app` (o tu custom domain)

---

## PASO 3: Verificar que TODO Funciona (5 minutos)

### 3.1 Abre tu URL
```
https://innoteam-pmo.vercel.app
```

### 3.2 Test Login
- **Email:** `pm@innoteam.com`
- **Password:** `TestPassword123!`
- Click "Ingresar"

✅ **Si ves el Dashboard, funciona.**

### 3.3 Navega por las Secciones
- Click **"📁 Proyectos"** → Ves 15 sociedades con datos reales
- Click **"✓ Entregables"** → Ves tabla con 45 reportes
- Click **"⚠ Alertas"** → Ves 4 riesgos críticos
- Click **"→ Acciones"** → Ves 6 próximos pasos
- Click **"⚙ Administración"** → Panel admin

### 3.4 Test Tema
- Arriba a la derecha: Click ☀ (sol)
- El sitio cambia a tema claro
- Click ☾ (luna) vuelve a oscuro

### 3.5 Test Login Segundo Usuario
- Click ⎋ (logout, arriba derecha)
- Login: `consultant@innoteam.com` / `TestPassword123!`
- Debe funcionar igual

✅ **¡TODO FUNCIONA!**

---

## PASO 4: Compartir y Usar

Tu aplicación está **live en producción**:

### URLs
- **Dashboard:** `https://innoteam-pmo.vercel.app`
- **GitHub:** https://github.com/andersson-astete/innoteam-pmo
- **Supabase Dashboard:** https://supabase.com/projects

### Test Users
```
pm@innoteam.com / TestPassword123!
consultant@innoteam.com / TestPassword123!
```

### Características Disponibles
✅ Login con Supabase Auth real  
✅ 4 KPI cards interactivos  
✅ 15 sociedades en tabla filtrable  
✅ 45 entregables con filtros por estado  
✅ 4 alertas críticas  
✅ 6 próximos pasos  
✅ Panel admin  
✅ Tema claro/oscuro  
✅ Responsive (móvil a desktop)  

---

## 🆘 Si Algo Falla

| Error | Solución |
|-------|----------|
| "Invalid SUPABASE_URL" | Verificar que copiaste correctamente en Paso 1.2 |
| Login no funciona | Verificar que los usuarios fueron creados en Supabase (Paso 1.4) |
| Vercel dice "unauthorized" | `vercel logout` → `vercel login` → `vercel --prod` |
| Deploy se queda atascado | `vercel --prod --force` |
| "Cannot find module" | En Vercel settings, verificar que todas las env vars están añadidas |

---

## 📚 Para Después (Opcional)

- [SETUP_GUIDE.md](SETUP_GUIDE.md) — Guía detallada con screenshots
- [RELEASE_NOTES.md](RELEASE_NOTES.md) — Todas las features
- [DATABASE.sql](DATABASE.sql) — Schema completo

---

## ⏱️ Resumen de Tiempo

- Supabase Setup: **10 min**
- Vercel Deploy: **10 min**
- Verificación: **5 min**
- **Total: 25 minutos**

---

🎉 **¡Listo! Tu aplicación está en producción con Supabase real y Vercel.**

Para cualquier pregunta: ve a [SETUP_GUIDE.md](SETUP_GUIDE.md)
