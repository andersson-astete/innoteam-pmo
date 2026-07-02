# INNOTEAM - PMO

**Project Tracking Platform for SAP/ODOO Implementations**

Plataforma web profesional para seguimiento centralizado de proyectos SAP/ODOO. Multi-rol, reportería tipo Power BI, exportación, y tema claro/oscuro. **Completamente funcional con Supabase + Vercel.**

## ⚡ Quick Start (30 minutos a producción)

### Opción 1: Deploy Automático en Vercel (Recomendado)

**Sigue el [SETUP_GUIDE.md](SETUP_GUIDE.md) para:**
1. Crear proyecto en Supabase (5 min)
2. Ejecutar schema SQL (5 min)
3. Crear usuarios de test (3 min)
4. Deploy en Vercel con env vars (10 min)
5. Verificar que todo funciona (5 min)

**Resultado:** URL pública en Vercel + Supabase DB real + Login funcional

### Opción 2: Desarrollo Local

**Prerequisites**
- Node.js 18+
- npm

**Pasos**
1. **Clone el repo**
   ```bash
   git clone https://github.com/andersson-astete/innoteam-pmo.git
   cd innoteam-pmo
   npm install
   ```

2. **Setup Supabase**
   - Crea proyecto en https://supabase.com
   - Copia `.env.example` → `.env.local`
   - Añade tus credenciales de Supabase
   - Ejecuta `DATABASE.sql` en Supabase SQL Editor
   - Crea usuarios de test en Supabase Auth

3. **Run locally**
   ```bash
   npm run dev
   # → http://localhost:3000
   ```

## 🎯 Key Features

✅ **Multi-Rol Authentication** — Gerencia, PM, Consultores funcionales, Técnicos  
✅ **Dashboard Ejecutivo** — 4 KPI cards + 6 gráficos + tabla de proyectos  
✅ **Entregables** — 45 reportes con filtros por estado/país  
✅ **Alertas & Acciones** — 4 riesgos críticos + 6 próximos pasos  
✅ **Admin Panel** — Gestión de empresas, usuarios, proyectos, auditoría  
✅ **Tema Claro/Oscuro** — Toggle ☀/☾ con persistencia  
✅ **Responsive** — Mobile (320px) → Desktop (1920px)  
✅ **Exportación** — PDF y Excel (jsPDF + xlsx)  
✅ **Datos Reales ISM** — 45 entregables de 15 sociedades en 6 países  
✅ **Professional UI** — Estilo Power BI / Tableau  

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/login/          # Login page
│   └── dashboard/           # Dashboard layout
│       ├── page.tsx         # Home (4 cards)
│       ├── projects/        # Projects (KPIs + tabla)
│       ├── deliverables/    # Deliverables (45 reportes)
│       ├── alerts/          # Alerts (4 riesgos)
│       ├── actions/         # Actions (6 pasos)
│       └── admin/           # Admin panel
├── components/              # KPICard, Header, Sidebar
├── lib/                     # mockData, supabase, auth, export
└── styles/                  # CSS variables + themes
public/                      # Static assets
DATABASE.sql               # Supabase schema (9 tablas)
SETUP_GUIDE.md            # Setup paso a paso
```

## 🚀 Deployment

### Deploy a Vercel
```bash
vercel --prod
```

Vercel te pedirá que configures las env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION`

**Ver [SETUP_GUIDE.md](SETUP_GUIDE.md) para instrucciones detalladas.**

## 📊 Demo Data

**Proyecto ISM (45 entregables):**
- 6 Países: RD1, Perú, RD2, Uruguay, Guatemala, Haití
- 15 Sociedades: San Miguel del Caribe, Embotelladora, Cynkat, G&A, Silver, + 10 más
- 3 Reportes c/u: BG (Balance General), DRE (Estado de Resultados), FF (Flujo de Fondos)
- Estados: init, proc, testing, go, client
- 4 Alertas críticas + 6 próximos pasos

## 🔐 Authentication

**Test Users (crear en Supabase):**
- Email: `pm@innoteam.com` / Password: `TestPassword123!`
- Email: `consultant@innoteam.com` / Password: `TestPassword123!`

## 📚 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) — Setup paso a paso para Vercel + Supabase
- [RELEASE_NOTES.md](RELEASE_NOTES.md) — Features y versión
- [DATABASE.sql](DATABASE.sql) — Schema completo de Supabase (9 tablas)
- [PHASE1_SUMMARY.md](PHASE1_SUMMARY.md) — Detalles técnicos de Fase 1

## 🛠 Development Scripts

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
```

## 🌐 Live Demo

Una vez deployed en Vercel:
- **URL:** `https://innoteam-pmo.vercel.app` (o tu URL personalizada)
- **Dashboard:** Ver 4 cards interactivos
- **Projects:** 15 sociedades + tabla
- **Deliverables:** 45 reportes filtrados
- **Alerts:** 4 riesgos críticos
- **Actions:** 6 próximos pasos
- **Admin:** Panel de gestión

## 📞 Support & Contribution

- **GitHub Issues:** Reporta bugs o sugiere features
- **Pull Requests:** Contribuciones bienvenidas
- **Documentation:** Ver archivos .md en la raíz

---

**© 2026 InnoTeam**  
GitHub: https://github.com/andersson-astete/innoteam-pmo  
Status: ✅ Complete & Production Ready
