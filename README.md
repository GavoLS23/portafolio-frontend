# Portafolio Personal — Frontend

Frontend del portafolio personal construido con **Angular 21** y **Tailwind CSS**.
Conecta con un backend propio en **Scala 3 / Http4s** que expone una REST API y WebSockets.

---

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Stack técnico](#stack-técnico)
3. [Requisitos previos](#requisitos-previos)
4. [Instalación y arranque](#instalación-y-arranque)
5. [Variables de entorno](#variables-de-entorno)
6. [Estructura de carpetas](#estructura-de-carpetas)
7. [Arquitectura y patrones](#arquitectura-y-patrones)
8. [Flujos clave](#flujos-clave)
9. [Scripts disponibles](#scripts-disponibles)
10. [Guía de desarrollo](#guía-de-desarrollo)
11. [Despliegue](#despliegue)
12. [TODOs y limitaciones conocidas](#todos-y-limitaciones-conocidas)

---

## Descripción

La aplicación tiene dos zonas diferenciadas:

| Zona | URL | Acceso |
|---|---|---|
| **Portafolio público** | `/` | Cualquier visitante |
| **Panel de administración** | `/admin` | Solo el administrador (JWT) |

**Vista pública** — Hero section, grid de proyectos con tech stack, listado de blog con paginación y detalle de cada item. Soporta español e inglés con cambio de idioma en tiempo real.

**Panel admin** — CRUD completo de proyectos (con reordenamiento drag & drop), posts de blog, archivos multimedia (subida directa a AWS S3) y tecnologías. Incluye autoguardado vía WebSocket.

---

## Stack técnico

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 21.2 | Framework principal |
| TypeScript | 5.9 | Lenguaje tipado |
| Tailwind CSS | 3.4 | Estilos utility-first |
| @angular/cdk | 21.2 | Drag & drop para proyectos |
| @angular/animations | 21.2 | Requerido por CDK |
| @tailwindcss/forms | 0.5 | Reset de estilos de formularios |
| Vitest | 4 | Tests unitarios |
| Node.js | ≥ 20 | Entorno de ejecución |
| npm | 11 | Gestor de paquetes |

> **Backend:** Scala 3, Http4s, Doobie, PostgreSQL, Circe, JWT, Flyway, Cats Effect 3, AWS SDK.
> Documentación interactiva (Swagger UI) disponible en `http://localhost:8080` cuando el servidor está corriendo.

---

## Requisitos previos

```bash
node --version   # >= 20.0.0
npm --version    # >= 10.0.0
```

El **backend Scala debe estar corriendo** en `http://localhost:8080` antes de arrancar el frontend. Sin él, las peticiones HTTP fallarán y los componentes mostrarán mensajes de error.

Para levantar el backend (desde su directorio):

```bash
docker compose up -d   # PostgreSQL + backend
# o con sbt directamente:
sbt run
```

---

## Instalación y arranque

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd portafolio-personal/frontend

# 2. Instalar dependencias
npm install

# 3. Levantar en modo desarrollo
npm start
# → http://localhost:4200
```

El servidor de desarrollo recarga automáticamente al guardar cualquier archivo fuente.

---

## Variables de entorno

El proyecto usa archivos de entorno estáticos de Angular (no `.env`). Se encuentran en `src/environments/`:

| Archivo | Cuándo se usa |
|---|---|
| `environment.ts` | Desarrollo (`ng serve`) |
| `environment.prod.ts` | Producción (`ng build`) |

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',   // URL base del backend
  wsUrl:  'ws://localhost:8080',     // URL del WebSocket
};
```

Para producción, editar `environment.prod.ts` con los dominios reales y configurar el reemplazo automático en `angular.json`:

```json
// angular.json → configurations.production.fileReplacements
{
  "replace": "src/environments/environment.ts",
  "with":    "src/environments/environment.prod.ts"
}
```

---

## Estructura de carpetas

```
src/
├── app/
│   ├── core/                        # Singleton — servicios, guards, interceptors, modelos
│   │   ├── guards/
│   │   │   └── auth.guard.ts        # Protege rutas admin; guarda returnUrl
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts  # Inyecta JWT en cada request al API propio
│   │   ├── models/
│   │   │   └── api.models.ts        # Todos los tipos TypeScript del backend
│   │   └── services/
│   │       ├── auth.service.ts      # JWT, login, logout, estado de sesión
│   │       ├── blog.service.ts      # CRUD de posts + paginación
│   │       ├── language.service.ts  # i18n: idioma activo + carga de traducciones
│   │       ├── media.service.ts     # Subida a S3 (flujo de 3 pasos)
│   │       ├── projects.service.ts  # CRUD + reordenamiento drag & drop
│   │       ├── technologies.service.ts
│   │       └── websocket.service.ts # Previsualización + autoguardado en tiempo real
│   │
│   ├── features/
│   │   ├── admin/                   # Panel de administración (lazy loaded, authGuard)
│   │   │   ├── blog/                # Lista de posts + formulario
│   │   │   ├── dashboard/           # Métricas y acciones rápidas
│   │   │   ├── login/               # Formulario de autenticación
│   │   │   ├── media/               # Biblioteca de archivos con drag & drop
│   │   │   ├── projects/            # Lista con D&D + formulario billingüe
│   │   │   ├── technologies/        # CRUD con edición inline
│   │   │   └── admin.routes.ts      # Rutas del panel (lazy)
│   │   └── public/                  # Vista pública del portafolio
│   │       ├── blog-detail/         # Contenido HTML del editor (TipTap-ready)
│   │       ├── blog-list/           # Grid + paginación "cargar más"
│   │       ├── home/                # Hero + proyectos + posts recientes
│   │       ├── project-detail/      # Detalle completo de un proyecto
│   │       └── public.routes.ts     # Rutas públicas (lazy)
│   │
│   ├── layout/
│   │   ├── admin-layout.component.ts   # Sidebar + topbar + indicador WebSocket
│   │   └── public-layout.component.ts  # Navbar responsivo + footer
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── confirm-dialog.component.ts  # Modal de confirmación
│   │   │   ├── empty-state.component.ts     # Placeholder para listas vacías
│   │   │   ├── spinner.component.ts         # Indicador de carga (sm/md/lg)
│   │   │   └── tag-badge.component.ts       # Chip de tecnología/tag (6 colores)
│   │   └── pipes/
│   │       └── translate.pipe.ts    # {{ 'clave' | translate }} — impuro para reactividad
│   │
│   ├── app.config.ts    # Providers: router, HttpClient + interceptor, animaciones
│   ├── app.routes.ts    # Rutas raíz con lazy loading
│   └── app.ts           # Componente raíz (<router-outlet>)
│
├── environments/
│   ├── environment.ts       # Dev: localhost:8080
│   └── environment.prod.ts  # Prod: dominio real
│
├── styles.css   # Tailwind + @layer components (btn-primary, card, form-input…)
└── index.html   # Punto de entrada HTML
│
public/
└── i18n/
    ├── es.json  # Traducciones en español
    └── en.json  # Traducciones en inglés
```

---

## Arquitectura y patrones

### Standalone Components
Toda la aplicación usa **Standalone Components** (sin `NgModule`). Cada componente declara explícitamente sus `imports`.

### Signals
El estado reactivo se maneja con Signals de Angular:

```typescript
// En los servicios
readonly projects = signal<ProjectResponse[]>([]);
readonly isLoading = signal(false);
readonly isLoggedIn = computed(() => this.token() !== null);

// En los componentes
readonly menuOpen = signal(false);
```

Los Observables de `HttpClient` se usan solo para peticiones HTTP puntuales y nunca se almacenan como estado.

### inject() sobre constructor injection
```typescript
// ✅ Patrón usado en todo el proyecto
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
}
```

### Lazy loading
Cada componente de feature se carga de forma diferida. El bundle inicial es mínimo:

```typescript
// app.routes.ts
{
  path: 'admin',
  loadChildren: () =>
    import('./features/admin/admin.routes').then(m => m.adminRoutes),
}
```

### input() y output() (Angular 17+)
```typescript
// ✅ Señales de entrada/salida declarativas
readonly size    = input<'sm' | 'md' | 'lg'>('md');
readonly message = input.required<string>();
readonly action  = output<void>();
```

### Internacionalización (i18n)
Sistema propio basado en signals. **No requiere build-time compilation** como `@angular/localize`:

```typescript
// LanguageService carga /i18n/{lang}.json vía HTTP
langService.setLang('en');   // Cambia idioma y recarga traducciones
langService.t('nav.home');   // Devuelve texto traducido

// En templates
{{ 'nav.home' | translate }}
```

Las traducciones se persisten en `localStorage`. Los archivos JSON están en `public/i18n/`.

---

## Flujos clave

### Autenticación JWT

```
Usuario → LoginComponent → AuthService.login()
                              ↓
                    POST /api/v1/auth/login
                              ↓
                    token → sessionStorage
                              ↓
                    redirect → /admin/dashboard
```

- El token vive en `sessionStorage` (se limpia al cerrar el navegador)
- El `authInterceptor` añade `Authorization: Bearer <token>` a cada request al API propio
- Si el servidor devuelve `401`, `AuthService.logout()` limpia el token y redirige al login
- El `authGuard` protege todas las rutas `/admin/*` excepto `/admin/login`

### Subida de archivos a S3 (3 pasos)

```
1. POST /api/v1/admin/media/presign
   → { uploadUrl, mediaId, expiresInS }

2. PUT <uploadUrl>   ←── fetch() nativo, SIN header Authorization
   Body: binario del archivo
   (S3 rechaza headers Authorization no firmados)

3. POST /api/v1/admin/media/confirm
   → MediaResponse con URL pública del archivo
```

> En **desarrollo**, `uploadUrl` apunta al propio servidor Scala. En **producción**, apunta directamente a S3. El frontend no distingue entre ambos casos.

### WebSocket (previsualización en tiempo real)

```
AdminLayoutComponent.ngOnInit()
  → WebSocketService.connect()
  → ws://localhost:8080/ws/preview?token=<jwt>
```

- El token va como **query param** (los WebSockets del navegador no permiten headers personalizados)
- El servidor envía pings cada 30 segundos para mantener la conexión
- Reconexión automática con **backoff exponencial**: 1s → 2s → 4s → … → 30s
- El formulario de proyectos y blog envía mensajes `autosave` cada 30 segundos cuando hay cambios

Tipos de mensajes recibidos:
```typescript
{ type: 'preview_update', entityType: 'project', entityId: '...', data: {...} }
{ type: 'autosave_ack',   entityId: '...', savedAt: '2026-...' }
{ type: 'error',          message: '...' }
```

### Reordenamiento de proyectos (drag & drop)

```
ProjectsListComponent
  ↓ CdkDragDrop (Angular CDK)
  → moveItemInArray(list, prev, curr)  // Actualiza UI de forma optimista
  → PUT /api/v1/admin/projects/reorder
      { orderedIds: ['id1', 'id2', ...] }
  // Si falla → ProjectsService.loadAll() restaura el orden real
```

---

## Scripts disponibles

```bash
# Desarrollo con hot reload
npm start
# → http://localhost:4200

# Build de producción optimizado
npm run build

# Build de desarrollo (sin optimizaciones, con source maps)
npm run watch

# Tests unitarios con Vitest
npm test

# Análisis del bundle (requiere @angular-devkit/build-angular)
npx ng build --stats-json && npx webpack-bundle-analyzer dist/frontend/stats.json
```

---

## Guía de desarrollo

### Crear un nuevo componente de feature (público)

```bash
# 1. Crear el archivo del componente
touch src/app/features/public/nueva-pagina/nueva-pagina.component.ts

# 2. Añadir la ruta en public.routes.ts
{
  path: 'nueva-pagina',
  loadComponent: () =>
    import('./nueva-pagina/nueva-pagina.component').then(m => m.NuevaPaginaComponent),
}
```

### Añadir una clave de traducción

```json
// public/i18n/es.json
{ "nueva.clave": "Texto en español" }

// public/i18n/en.json
{ "nueva.clave": "Text in English" }
```

```html
<!-- En el template -->
{{ 'nueva.clave' | translate }}
```

```typescript
// En TypeScript
const text = this.langService.t('nueva.clave');
```

### Añadir un nuevo servicio HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class NuevoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1`;

  readonly items   = signal<ItemResponse[]>([]);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.http.get<ItemResponse[]>(`${this.base}/items`).subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: ()    => { this.error.set('Error al cargar'); this.loading.set(false); },
    });
  }
}
```

### Convenciones de código

| Elemento | Convención |
|---|---|
| Servicios | `inject()`, signals para estado, subscribe() solo para side effects |
| Componentes | Standalone, `input()` / `output()`, `@if` / `@for` (no `*ngIf` / `*ngFor`) |
| Formularios | Reactive Forms con `FormBuilder.nonNullable` |
| Estilos | Tailwind utilities en el template, `@layer components` para clases reutilizables |
| Tipos | Sin `any`. Interfaces en `core/models/api.models.ts` |
| Guards/Interceptors | Funciones (no clases) |

### Clases CSS predefinidas (en `styles.css`)

```html
<!-- Botones -->
<button class="btn-primary">Acción principal</button>
<button class="btn-secondary">Acción secundaria</button>
<button class="btn-danger">Eliminar</button>

<!-- Formularios -->
<label class="form-label">Campo</label>
<input class="form-input" />
<p class="form-error">Error de validación</p>

<!-- Cards -->
<div class="card">Card estática</div>
<div class="card-hover">Card con hover effect</div>

<!-- Badges de estado -->
<span class="badge-published">Publicado</span>
<span class="badge-draft">Borrador</span>

<!-- Layout -->
<div class="section-container">  <!-- max-w-6xl + padding responsivo -->
  <h2 class="section-title">Título</h2>
  <p class="section-subtitle">Subtítulo</p>
</div>
```

---

## Despliegue

### Build de producción

```bash
npm run build
# Artefactos en: dist/frontend/browser/
```

Antes de hacer el build, asegurarse de que `environment.prod.ts` tiene los valores correctos:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.com',
  wsUrl:  'wss://api.tu-dominio.com',
};
```

Y añadir `fileReplacements` en `angular.json` si aún no está:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with":    "src/environments/environment.prod.ts"
      }
    ]
  }
}
```

### Servir con Nginx (ejemplo)

```nginx
server {
  listen 80;
  root /var/www/frontend/browser;
  index index.html;

  # SPA: todas las rutas devuelven index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache agresivo para assets con hash
  location ~* \.(js|css|png|jpg|webp|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### Docker

```dockerfile
# Etapa 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## TODOs y limitaciones conocidas

| Elemento | Estado | Descripción |
|---|---|---|
| Editor TipTap | ⏳ Pendiente | El formulario de blog usa `<textarea>` en lugar del editor rich text. Integrar `@tiptap/core` + `@tiptap/starter-kit` |
| `environment.prod.ts` en `angular.json` | ⏳ Pendiente | Configurar `fileReplacements` para el build de producción |
| `GET /api/v1/admin/media/:id` | ➖ No implementado | No necesario para el prototipo; la librería carga todos los archivos con `GET /admin/media` |
| Página 404 | ⏳ Pendiente | La ruta `**` redirige al home en lugar de mostrar un componente `NotFoundComponent` |
| Tests unitarios | ⏳ Pendiente | Vitest está configurado pero no hay specs escritos. Prioridad: servicios del core |
| Preview de video | ⏳ Pendiente | `MediaLibraryComponent` no muestra thumbnail de videos |
| Imagen de portada en proyectos | ⏳ Pendiente | El `thumbnailMediaId` se gestiona pero el picker de media no está conectado al formulario |
| Filtrado por tecnología | ⏳ Pendiente | El grid de proyectos en home no tiene filtros (diseñado para añadirlos) |
