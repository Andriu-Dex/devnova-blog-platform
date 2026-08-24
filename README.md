# DevNova Blog Platform

Base técnica para el desarrollo de una plataforma de blog. Esta etapa prepara una aplicación Next.js limpia; no incluye todavía base de datos, autenticación, gestión de imágenes ni funcionalidades de CMS.

## Stack

- Next.js con App Router
- React y TypeScript estricto
- ESLint
- CSS nativo

## Requisitos

- Node.js 20.9 o posterior
- npm

## Instalación

```bash
npm install
```

## Ejecución local

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Base de Datos (Drizzle ORM & PostgreSQL/Supabase)

La aplicación utiliza Drizzle ORM para interactuar con PostgreSQL.

El modelo de publicaciones sigue un enfoque de versiones inmutables:
- Las versiones de contenido están en `blog_versions`.
- Las publicaciones activas se gestionan mediante `blog_publications`.
- Pueden existir versiones posteriores no publicadas (borradores).
- Los archivos multimedia se almacenan en **Cloudinary**. PostgreSQL únicamente guarda referencias y metadatos (`media_assets`).

El modelo institucional y operativo incluye (a nivel de persistencia de datos):
- Contenido institucional versionado (`site_sections`, `site_section_versions`).
- Perfil general del sitio versionado (`site_profile_versions`).
- Integrantes del equipo versionados (`team_members`, `team_member_versions`).
- Redes sociales normalizadas por plataforma (`social_platforms`, `site_social_links`).
- Mensajes de contacto inmutables (`contact_messages`) con historial de estados separado (`contact_message_status_history`).

Para el manejo de la base de datos se tienen los siguientes comandos npm:
- `npm run db:generate`: Genera migraciones SQL desde el esquema.
- `npm run db:migrate`: Aplica migraciones a la base de datos (utiliza `DATABASE_MIGRATION_URL`).
- `npm run db:studio`: Lanza Drizzle Studio para visualizar los datos.

## Variables de entorno

Copia `.env.example` como `.env.local` y completa solo las variables necesarias cuando se incorporen esos servicios:

```bash
# Conexión utilizada por la aplicación en runtime (ej. Transaction Pooler)
DATABASE_URL=
# Conexión destinada a Drizzle Kit y migraciones (conexión directa o Session Pooler)
DATABASE_MIGRATION_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BOOTSTRAP_ADMIN_USERNAME=
BOOTSTRAP_ADMIN_PASSWORD_HASH=
```

No subas secretos ni archivos `.env*` al repositorio. El archivo `.env.example` sí se versiona porque contiene únicamente los nombres de las variables.

## Verificación

```bash
npm run typecheck
npm run lint
npm run build
```

## Inicialización Segura de Base de Datos

1. Ejecuta migraciones: `npm run db:migrate`
2. Siembra los catálogos estructurales base: `npm run db:seed`
3. Genera localmente el hash de la contraseña para el admin: `npm run admin:hash-password`
4. Configura las variables `BOOTSTRAP_ADMIN_*` en tu `.env.local`
5. Finalmente, provisiona el primer administrador en la BD: `npm run admin:bootstrap`

> **Advertencias de Seguridad:** 
> - NUNCA almacenes tu contraseña en texto plano en las variables de entorno. Usa el script generador de hash.
> - NO subas (versiones) tus archivos `.env` (ni local, ni prod).
> - El script `admin:bootstrap` está diseñado **exclusivamente para provisionar el primer administrador** de forma segura e idempotente, no para gestionar usuarios a futuro.
