# DevNova Blog Platform - MVP Final

Esta es la plataforma de blog institucional de DevNova, lista para despliegue en producción.

## Stack y Arquitectura

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript estricto
- **Base de Datos**: PostgreSQL (Supabase) + Drizzle ORM
- **Multimedia**: Cloudinary (Direct Signed Uploads)
- **Estilos**: CSS Modules nativo (Space Grotesk, IBM Plex Mono)
- **Seguridad**: Autenticación custom (Argon2id, Session Cookies HttpOnly/Lax/Secure), XSS protection (Markdown strict), Transacciones (SELECT FOR UPDATE) y Rate Limiting en DB.

## Roles y Autorización

- **Público**: Acceso a Home, Blogs, Nosotros y Contacto.
- **ADMIN**: Control total. Gestión de Autores, Papeleras, Seguridad, Configuración Institucional, Contenido y Mensajes de Contacto.
- **AUTHOR**: Editor de blogs. Puede crear, editar, y enviar a revisión. Solo ADMIN puede publicar/despublicar.

## Variables de Entorno Seguras

Las siguientes variables deben configurarse en `.env.local` y en el panel de Vercel para producción:

```bash
# ==========================================
# SERVER SECRETS (NO EXPONER AL CLIENTE)
# ==========================================
# Conexión principal (Transaction Pooler)
DATABASE_URL=
# Conexión directa (Para migraciones, no necesaria en Vercel Edge/Serverless web)
DATABASE_MIGRATION_URL=
# Cloudinary
CLOUDINARY_API_SECRET=

# ==========================================
# NO SECRETS (BROWSER-SAFE)
# ==========================================
NEXT_PUBLIC_SITE_URL=https://tudominio.com
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_UPLOAD_PRESET=
```

> **Nota:** Las credenciales del `BOOTSTRAP_ADMIN_*` solo se usaron para la siembra inicial y no son necesarias en el runtime.

## Instalación Local

1. `npm install`
2. Configurar `.env.local` con base en `.env.example`.
3. `npm run db:migrate` (Aplica 0000-0003).
4. `npm run dev`

## Despliegue en Vercel (Checklist Exacto)

Para subir este proyecto a producción en Vercel:

1. **Conectar Repositorio**: Importar el proyecto desde GitHub a Vercel.
2. **Framework**: Asegurarse de que Vercel detecta **Next.js**.
3. **Variables de Entorno (Vercel Dashboard)**: 
   - `DATABASE_URL`: Usar cadena de conexión de Supabase con **Transaction Pooler**. Añadir sufijo `?pgbouncer=true&connection_limit=1` si es necesario según la documentación de Supabase/Drizzle.
   - Insertar variables de Cloudinary y `NEXT_PUBLIC_SITE_URL`.
   - **No** incluir `DATABASE_MIGRATION_URL` en Vercel, ya que no se ejecuta migración en el build.
4. **Build Command**: El comando por defecto `npm run build` es correcto.
5. **Verificar Build**: Confirmar que Vercel ejecuta typecheck y linting exitosamente.

## Configuración de Producción (Supabase)

1. **Runtime**: Usar **Transaction Pooler** para la aplicación web.
2. **Migraciones**: 
   - La base de datos ya debe tener las migraciones 0000-0003 aplicadas.
   - En el futuro, usar Drizzle CLI localmente conectado vía **Direct/Session Pooler** (`DATABASE_MIGRATION_URL`) para ejecutar `npm run db:migrate`. **No ejecutar push manual**.
3. No realizar cambios manuales a la estructura de la base de datos para mantener sincronía con Drizzle.

## Configuración de Producción (Cloudinary)

1. Crear un **Upload Preset** en formato `Signed` o `Unsigned` (aunque la app firma las peticiones, se recomienda configuración estricta).
2. Limitar tipos de archivo a: **Images only (jpg, jpeg, png, webp)**.
3. Limitar tamaño a **10MB**.
4. Deshabilitar sobrescritura (Overwrite = false).
5. Configurar nombrado único (Unique filename = true).

## Limitaciones Conocidas

- **Rate Limiting Distribuido / CAPTCHA**: Actualmente el límite por IP se maneja contra PostgreSQL. En caso de ataque DDoS a escala, puede saturar la BD. Se recomienda añadir protección a nivel de Edge (Vercel WAF/Cloudflare) o Turnstile/reCAPTCHA.
- **TTL de Contraseña Temporal**: Las contraseñas temporales no tienen tiempo de caducidad implementado. Un administrador debe cambiarlas proactivamente.
- **Content Security Policy (CSP)**: No se ha aplicado una CSP estricta por precaución ante posibles bloqueos de assets de Next/Cloudinary. Se recomienda como mejora post-MVP.
