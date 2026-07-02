# INNOTEAM - PMO

**Project Tracking Platform for SAP/ODOO Implementations**

Una plataforma web de seguimiento centralizado para proyectos de implementación SAP/ODOO, con roles diferenciados, reportería premium tipo Power BI, exportación a PDF/Excel, y automatización.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm o yarn

### Setup

1. **Clone/Enter the project**
   ```bash
   cd Innoteam-PMO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Crea una cuenta en [Supabase](https://supabase.com)
   - Copia las credenciales (URL, anon key, service role key)
   - Actualiza `.env.local` con tus valores

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abre en el navegador**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── auth/
│   │   └── login/
│   └── dashboard/
├── components/       # React components (Header, Sidebar, etc)
├── lib/             # Utilities (Supabase client, auth helpers)
├── styles/          # Global CSS + CSS modules
└── public/          # Static assets (logos, icons)
```

## 🔑 Key Features (Fase 1 - Setup)

✅ **Login & Authentication** — Supabase Auth
✅ **Responsive Layout** — Header + Sidebar + Main content
✅ **Theme Toggle** — Claro/Oscuro (CSS variables)
✅ **Navigation** — Rutas básicas (Dashboard, Proyectos, etc)
⏳ **Database Schema** — Por crear en Supabase
⏳ **Dashboards** — Por implementar en Fase 2-3

## 🛠 Development

### Available Scripts

```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run ESLint
```

### Database Setup (Supabase)

Ver archivo `DATABASE.sql` (por crear) para crear el schema.

## 📋 Roadmap

- **Fase 1**: Setup ✅ (en curso)
- **Fase 2**: Dashboard Ejecutivo
- **Fase 3**: Dashboard Detallado (PM)
- **Fase 4**: CRUD Entregables
- **Fase 5**: Alertas y Acciones
- **Fase 6**: Exportación + Personalización
- **Fase 7**: Testing + Deploy

## 🔐 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=INNOTEAM - PMO
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 📞 Support

Para questions o issues, contacta al equipo de desarrollo.

---

**© 2026 InnoTeam. Todos los derechos reservados.**
