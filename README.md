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

- **Gestión de Versiones de Blogs:** Implementación de historial inmutable, con un sistema seguro para crear nuevas versiones de blogs basadas en `version_number`. Todo controlado a través del servicio transaccional `blog-service.ts`.
- **Publicación y Despublicación:** La publicación se maneja como un apuntador independiente (`blog_publications`). La acción de editar no publica automáticamente; la publicación usa explícitamente la última versión. El proceso de despublicar (unpublish) no elimina versiones, sólo remueve el apuntador de publicación.
- **Historial y Restauración:** El historial de versiones muestra la línea temporal completa e intacta. Restaurar una versión pasada crea una NUEVA versión en lugar de sobreescribir la original y copia todas las referencias multimedia históricas correspondientes.
- **Soft Delete y Recuperación (Trash):** El borrado de blogs es lógico (`deleted_at`); al eliminar, el blog es despublicado automáticamente. La recuperación remueve el flag de borrado pero NO republica el blog. Las acciones DELETE y RECOVER son exclusivas para usuarios ADMIN.
- **Auditoría Estricta:** Las acciones `PUBLISH`, `UNPUBLISH`, `RESTORE`, `DELETE` y `RECOVER` están todas vinculadas a su evento de auditoría en la BD.
- **Control de Concurrencia:** Utiliza `SELECT ... FOR UPDATE` sobre la raíz de la tabla `blogs` durante operaciones críticas como Edit, Publish y Restore, para evitar colisiones y condiciones de carrera.

El modelo de publicaciones sigue un enfoque de versiones inmutables:
- Las versiones de contenido están en `blog_versions`.
- Las publicaciones activas se gestionan mediante `blog_publications`.
- Pueden existir versiones posteriores no publicadas (borradores).
- **Gestión de Multimedia y Cloudinary (Direct Signed Uploads):**
  - **Upload Directo Firmado:** El navegador solicita una firma criptográfica efímera al backend (`/api/cloudinary/sign-upload`) y sube los archivos directamente a Cloudinary, evitando sobrecargar funciones serverless.
  - **Seguridad de Credenciales:** `CLOUDINARY_API_SECRET` es estrictamente `server-only` y nunca viaja al cliente.
  - **Verificación Criptográfica:** La respuesta de subida se verifica server-side mediante el cálculo de la firma de respuesta antes del registro.
  - **Metadatos Canónicos:** El backend consulta directamente la Admin API de Cloudinary para obtener dimensiones, tamaño exacto y formato real antes de persistir en PostgreSQL.
  - **Validaciones:** Formatos permitidos: JPG, JPEG, PNG y WebP. Tamaño máximo: 10 MB.
  - **Persistencia Limpia:** PostgreSQL (`media_assets`) no almacena URLs estáticas ni firmas; las URLs de entrega optimizada se generan dinámicamente en tiempo de ejecución.
  - **Soft Delete y Conservación:** El borrado de medios es lógico (`deleted_at`); nunca se destruyen archivos en Cloudinary (`destroy` prohibido) para garantizar la integridad de versiones históricas.
  - **Tolerancia a Fallos y Huérfanos:** Si ocurre un fallo en DB posterior a la subida en Cloudinary, el asset quedará como un huérfano externo sin comprometer la base de datos (no se ejecutan rollbacks destructivos automáticos).

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
> - NUNCA almacenes tu contraseña en texto plano en las variables de entorno.
> - El script `admin:bootstrap` está diseñado **exclusivamente para provisionar el primer administrador** de forma segura e idempotente, no para gestionar usuarios a futuro.

> **Nota Adicional de Trazabilidad y Seguridad:**
> - Nunca incluir passwords, hashes, tokens o connection strings en reportes de estado o logs.
> - Utilizar marcadores como `[REDACTED]` cuando se documenten operaciones de seguridad.
> - Las modificaciones futuras de credenciales deben realizarse exclusivamente mediante servicios de dominio auditados dentro de la aplicación.
> - No editar `user_credentials` ni modificar los hashes manualmente en PostgreSQL (o Supabase) salvo recuperación extraordinaria documentada (como ocurrió en una sesión de troubleshooting previa).

## Gestión Administrativa de Autores

- **El ADMIN crea a los Autores:** La creación de cuentas está restringida al panel administrativo.
- **Contraseña temporal generada server-side:** El sistema genera una contraseña criptográfica aleatoria para los nuevos autores o durante un reset administrativo.
- **Visualización única:** Esta contraseña temporal se muestra en texto plano al ADMIN **una sola vez** en la pantalla tras la acción.
- **Almacenamiento seguro:** La DB almacena exclusivamente el hash Argon2id generado al instante.
- **Forzar cambio:** Las cuentas creadas/reseteadas nacen con `mustChangePassword = true`.
- **Bloqueo de cuentas:** Bloquear a un autor **revoca inmediatamente** todas sus sesiones activas de forma atómica.
- **Reactivación de cuentas:** Reactivar a un autor bloqueado **no** restaura sus sesiones antiguas.
- **Seguridad en reportes:** Nunca se pegan o comparten credenciales reales ni de prueba en reportes o logs de seguimiento.

## Prueba manual del Login

1. Ejecuta `npm run dev`
2. Abre tu navegador y accede a `http://localhost:3000/login`
3. Utiliza las credenciales ADMIN configuradas por el desarrollador.
4. Verifica el estado autenticado y comprueba que puedes cerrar sesión.
