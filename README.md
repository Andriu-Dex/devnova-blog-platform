# DevNova Blog Platform - MVP Final

Esta es la plataforma de blog institucional de DevNova, lista para despliegue en producción.

![alt text](https://i.imgur.com/tvj6Ist.png)

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

## Borradores locales y Edición

El editor de blogs guarda el contenido de forma automática en el almacenamiento local del navegador (`localStorage`) mediante una estrategia *debounce* (1 segundo tras el último cambio).
- **Recuperación:** Si se cierra accidentalmente la pestaña o falla la conexión, los cambios editoriales se pueden restaurar desde el mismo navegador al reingresar al formulario.
- **No sustituye Guardar versión:** El autoguardado NO crea versiones en la base de datos automáticamente. Se debe hacer clic explícitamente en "Guardar nueva versión". El borrador local **sólo se elimina** después de que el servidor confirma la creación exitosa del blog o de la versión (no se limpia ante errores de validación o conflictos).
- **Conflictos:** El control de concurrencia a través de `baseVersionId` sigue siendo protegido en el backend (*server-side*). No se puede burlar este control usando localStorage.
- **Duplicación:** Los blogs se pueden duplicar usando la herramienta interna (disponible para autores y admins).
  - La duplicación crea una **nueva entidad independiente** copiando la **última versión editorial (latest)** del origen.
  - **No** se copia el estado de publicación (el nuevo blog nace en modo borrador) ni el historial completo.
  - Si el blog origen incluye recursos multimedia (imágenes) que posteriormente fueron archivadas/eliminadas de la plataforma, el sistema denegará la duplicación por seguridad.

## Exportación e Importación de Markdown (Respaldo Editorial)

Los autores y administradores pueden exportar cualquier versión de un blog a un archivo `.md` (Markdown).
- **Exportación:** Permite descargar el contenido Markdown junto con una cabecera oculta (`devnova-export` format 1) que contiene la metadata clave del blog (título, resumen). Las referencias a imágenes (`media://UUID`) se preservan intactas. Este export NO es un archivo público y sirve estrictamente como respaldo editorial.
- **Importación:** Al crear o editar un blog, puedes usar el botón **"Importar Markdown"**. 
  - Si el archivo `.md` contiene la cabecera generada por DevNova, se autocompletarán los campos de título y resumen.
  - Si es un `.md` puro (o de otra fuente), se importará únicamente el contenido.
  - Al importar, los cambios NO se publican ni se crea una versión automáticamente en base de datos. Pasan a ser un borrador local hasta que el usuario confirme y guarde usando el botón "Guardar/Crear Blog".
  - Ten en cuenta que si el Markdown importado hace referencia a imágenes internas de DevNova (URLs `media://`), el backend rechazará el documento si dichas imágenes no existen (ej. importación desde otra instalación).

## RSS y Exportaciones Administrativas CSV
- **RSS Público (`/feed.xml`)**: Expone exclusivamente las versiones publicadas de los blogs. Protege borradores y blogs no publicados.
- **Exportaciones de Administrador**: Los administradores pueden exportar a formato CSV (`text/csv`) las consultas de Mensajes de Contacto y Eventos de Auditoría (rutas `/admin/messages/export` y `/admin/audit/export`).
  - Estos CSV soportan los mismos filtros de la UI (por estado, dominio, fechas, etc.).
  - Las celdas CSV cuentan con mitigación contra *CSV Formula Injection* (ej. celdas que empiecen por `=`, `+`, `-`, `@` son escapadas).
  - Por privacidad, estas descargas se generan de forma directa (streaming/response string) mediante configuración `no-store` y no se guardan en el servidor.

## Limitaciones Conocidas

- **Rate Limiting Distribuido / CAPTCHA**: Actualmente el límite por IP se maneja contra PostgreSQL. En caso de ataque DDoS a escala, puede saturar la BD. Se recomienda añadir protección a nivel de Edge (Vercel WAF/Cloudflare) o Turnstile/reCAPTCHA.
- **TTL de Contraseña Temporal**: Las contraseñas temporales no tienen tiempo de caducidad implementado. Un administrador debe cambiarlas proactivamente.
- **Content Security Policy (CSP)**: No se ha aplicado una CSP estricta por precaución ante posibles bloqueos de assets de Next/Cloudinary. Se recomienda como mejora post-MVP.
