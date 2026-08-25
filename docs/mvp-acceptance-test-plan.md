# Plan Integral de Pruebas de Aceptación (MVP)

Este documento funciona como checklist ejecutable por el desarrollador para validar íntegramente el comportamiento de DevNova sin automatizaciones prematuras contra la base de datos real.

**Estado inicial recomendado antes de ejecutar:**
- `git status` limpio o con cambios conocidos.
- Build exitoso.
- Backup lógico de la DB si se considera necesario.
- Utilizar nombres descriptivos como `TEST_AUTHOR_A`, `TEST_BLOG_A` para facilitar la limpieza posterior.
- NUNCA registrar passwords reales en evidencia (usar `[TEST PASSWORD]`).

---

## 1. Autenticación y Autorización

### [CRITICAL TEST] AUTH-001: Login ADMIN válido
- **Área**: Auth
- **Precondición**: Cuenta ADMIN (Bootstrap) operativa.
- **Pasos**: Ingresar en `/login` con credenciales de ADMIN.
- **Esperado**: Redirección exitosa a `/admin`.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUTH-002: Login AUTHOR válido
- **Área**: Auth
- **Precondición**: Cuenta de AUTHOR activa.
- **Pasos**: Ingresar en `/login` con credenciales de AUTHOR.
- **Esperado**: Redirección a `/dashboard`.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUTH-003: Login usuario inexistente
- **Área**: Auth
- **Precondición**: N/A
- **Pasos**: Ingresar credenciales con username inexistente.
- **Esperado**: Falla con mensaje genérico de credenciales inválidas.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUTH-004: Login password incorrecta
- **Área**: Auth
- **Precondición**: Usuario existente.
- **Pasos**: Ingresar username correcto con password errónea.
- **Esperado**: Mismo mensaje genérico que AUTH-003.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUTH-005: Login de usuario BLOCKED
- **Área**: Auth
- **Precondición**: Usuario con status BLOCKED.
- **Pasos**: Intentar login válido.
- **Esperado**: Mismo mensaje público genérico (no revelar motivo explícito de bloqueo).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUTH-006: Logout y destrucción de sesión
- **Área**: Auth
- **Precondición**: Sesión activa de usuario.
- **Pasos**: Hacer clic en "Cerrar sesión". Intentar acceder a ruta privada previamente abierta.
- **Esperado**: Cookie eliminada, ruta privada bloqueada y redirección a login.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### [CRITICAL TEST] AUTH-007: Cambio obligatorio de password
- **Área**: Auth
- **Precondición**: ADMIN crea un AUTHOR temporal.
- **Pasos**: 
  1. AUTHOR hace login con password temporal.
  2. Intenta forzar navegación a `/dashboard`.
  3. Ejecuta el cambio de password correctamente y reingresa.
  4. Intenta usar la credencial temporal anterior.
- **Esperado**: 
  - Obligatorio `/account/change-password` al ingresar.
  - `/dashboard` redirecciona al cambio.
  - Cambio correcto revoca sesiones y redirige a login.
  - Nuevo ingreso lleva al `/dashboard`.
  - Credencial anterior ya no funciona.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST AUTHOR

### [CRITICAL TEST] USER-001: Bloqueo de AUTHOR
- **Área**: Auth / Users
- **Precondición**: AUTHOR `TEST_AUTHOR_A` activo y con sesión abierta en otro browser.
- **Pasos**: ADMIN bloquea al usuario.
- **Esperado**: Status pasa a BLOCKED, sesión actual y activa en el otro navegador quedan revocadas. Cualquier request posterior es rechazada, login posterior devuelve error genérico. Su contenido asociado (blogs) debe persistir sin borrarse.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST AUTHOR

### USER-002: Reactivación de AUTHOR
- **Área**: Auth / Users
- **Precondición**: `TEST_AUTHOR_A` bloqueado (USER-001).
- **Pasos**: ADMIN reactiva al usuario y este intenta usar su sesión vieja. Luego intenta login de nuevo.
- **Esperado**: Sesión vieja no revive. Nuevo login permitido.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST AUTHOR

### USER-003: Reset password ADMIN → AUTHOR
- **Área**: Auth / Users
- **Precondición**: AUTHOR activo.
- **Pasos**: ADMIN genera password temporal.
- **Esperado**: Credencial anterior inválida, sesiones previas revocadas, bandera `mustChangePassword=true`. Siguiente login obliga a change-password.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST AUTHOR

### [CRITICAL TEST] AUTHZ-001: AUTHOR contra Admin Routes
- **Área**: Authorization
- **Precondición**: AUTHOR autenticado.
- **Pasos**: Intentar acceder manualmente a: `/admin`, `/admin/authors`, `/admin/content`, `/admin/team`, `/admin/social`, `/admin/messages`.
- **Esperado**: Error 404 (Not Found) según política para no exponer la existencia de rutas privilegiadas a usuarios de nivel menor.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUTHZ-002: Visitante contra Privadas
- **Área**: Authorization
- **Precondición**: Sin sesión activa.
- **Pasos**: Visitar `/dashboard` y `/admin`.
- **Esperado**: Redirecciones coherentes o rechazo según los guards establecidos. (Documentar destino exacto).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A


## 2. Blogs, Versionado y Publicación

### BLOG-001: Blog CREATE
- **Área**: Blogs
- **Precondición**: AUTHOR `TEST_AUTHOR_A`.
- **Pasos**: Crea el blog `TEST_BLOG_A`. Revisar frontend público.
- **Esperado**: Blog creado con v1 (creator=A, editor=A). No publicado. Público: No aparece.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### BLOG-002: Edición Colaborativa
- **Área**: Blogs
- **Precondición**: `TEST_BLOG_A` creado. AUTHOR `TEST_AUTHOR_B` con acceso.
- **Pasos**: AUTHOR B edita el blog.
- **Esperado**: Creator sigue siendo A. Editor pasa a ser B. Crea v2.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### BLOG-003: Control de Versionado Inmutable
- **Área**: Blogs
- **Precondición**: Blog con v1, v2 y v3 generadas.
- **Pasos**: Inspeccionar historial de versiones en la UI.
- **Esperado**: Versiones históricas intactas, números de versión ascendentes (1, 2, 3), contenido correspondiente, y nota de cambios correctas.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### [CRITICAL TEST] BLOG-004: Concurrencia de Edición
- **Área**: Blogs
- **Precondición**: Dos pestañas editando la versión vN del blog.
- **Pasos**: Pestaña A guarda (crea vN+1). Pestaña B intenta guardar inmediatamente después. B recarga e intenta de nuevo.
- **Esperado**: B sufre conflicto y fallo seguro. No se crea vN+2 fallida. Al recargar y basarse en vN+1, B puede guardar correctamente.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### BLOG-005: Publish Blog
- **Área**: Blogs
- **Precondición**: Blog con latest=v2.
- **Pasos**: Publicar el blog. Visitar frontend público.
- **Esperado**: `blog_publications` apunta a v2. Público muestra v2.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### [CRITICAL TEST] BLOG-006: Draft Posterior a Publicación
- **Área**: Blogs
- **Precondición**: Blog publicado (v2).
- **Pasos**: Editar y guardar para generar v3 sin republicar. Visitar frontend público.
- **Esperado**: Frontend debe seguir mostrando íntegramente todo el contenido y SEO de v2.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### BLOG-007: Republish Blog
- **Área**: Blogs
- **Precondición**: Escenario anterior (published=v2, latest=v3).
- **Pasos**: Publicar. Revisar frontend.
- **Esperado**: Frontend actualiza íntegramente a v3.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### BLOG-008: Unpublish Blog
- **Área**: Blogs
- **Precondición**: Blog publicado.
- **Pasos**: Despublicar.
- **Esperado**: Desaparece del listing de `/blogs`. `/blogs/[slug]` da 404. Versiones del backend se mantienen intactas.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### [CRITICAL TEST] BLOG-009: Restore Histórico
- **Área**: Blogs
- **Precondición**: Blog con v1, v2 y v3.
- **Pasos**: Restaurar v1.
- **Esperado**: Crea nueva v4 copiada exactamente de v1. `restored_from=v1`. Las versiones 1 a 3 están intactas. Publication no cambia automáticamente a v4.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### BLOG-010: Soft-Delete y Recover de Blog
- **Área**: Blogs
- **Precondición**: Blog publicado.
- **Pasos**: ADMIN elimina. ADMIN recupera.
- **Esperado**: 
  - Delete: Soft delete de BD, despublicación y remoción del público. Auditoría de ambas operaciones.
  - Recover: Recupera BD (deletedAt=NULL), pero NO republica automáticamente.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG


## 3. Multimedia (Media Library)

### MEDIA-001: Subida Segura Directa a Cloudinary
- **Área**: Multimedia
- **Precondición**: AUTHOR o ADMIN. Archivo JPG/PNG/WebP <= 10MB.
- **Pasos**: Subir imagen en el MediaPicker.
- **Esperado**: Sube directamente desde browser (pre-firma), no usa ancho de banda de backend. Registro en DB, previsualización correcta.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MEDIA

### MEDIA-002: Formato y Tamaño Inválido
- **Área**: Multimedia
- **Precondición**: N/A
- **Pasos**: Subir archivo de formato inválido (ej. un PDF disfrazado).
- **Esperado**: Rechazo del cliente y fallo seguro si fuerza request.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### MEDIA-003: Archivado y Recuperación
- **Área**: Multimedia
- **Precondición**: Archivo subido `TEST_MEDIA_A`.
- **Pasos**: Archivar imagen. Recuperar.
- **Esperado**: Al archivar desaparece de la vista activa y va a la papelera. Físicamente existe en Cloudinary. Al recuperar regresa a activa.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MEDIA

### MEDIA-004: Resolución de protocolo media://
- **Área**: Multimedia
- **Precondición**: Markdown del blog contiene `![Descripción](media://UUID)`.
- **Pasos**: Revisar edición y página pública.
- **Esperado**: DB conserva `media://`. El renderer en frontend público y editor parsean la imagen a la URL real de Cloudinary.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### MEDIA-005: Rechazo de media:// sin alt-text
- **Área**: Multimedia
- **Precondición**: N/A
- **Pasos**: Intentar escribir `![](media://UUID)` en el markdown.
- **Esperado**: Rechazo de validación.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### MEDIA-006: UUID Inexistente o Falso
- **Área**: Multimedia
- **Precondición**: N/A
- **Pasos**: Referenciar en markdown a un UUID de media inventado o inexistente.
- **Esperado**: Rechazo server-side (Media not found).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### [CRITICAL TEST] MEDIA-007: Integridad frente a Media Archivada (Edición)
- **Área**: Multimedia
- **Precondición**: Blog v1 usa imagen A. Imagen A es luego archivada.
- **Pasos**: Intentar editar y guardar el blog v2 preservando la referencia a A.
- **Esperado**: Server rechaza la operación debido a que A está archivada (Media archivada no es válida para nuevos drafts).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### [CRITICAL TEST] MEDIA-008: Integridad de Media Archivada (Restauración)
- **Área**: Multimedia
- **Precondición**: Blog v1 usa imagen A. Imagen A es luego archivada. Blog avanza a v2 sin imagen A.
- **Pasos**: Restaurar v1. Observar front.
- **Esperado**: Restauración PERMITIDA (porque fue histórico válido). Si se publica, el componente sigue renderizando A para no romper contenido antiguo, pese a estar en papelera.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### MEDIA-009: Cover Images Históricas
- **Área**: Multimedia
- **Precondición**: v1 con cover A, v2 con cover B. Archivar cover A.
- **Pasos**: Revisar visualmente historial v1.
- **Esperado**: La versión 1 en la vista histórica sigue mostrando su preview de A correctamente.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A


## 4. Seguridad Activa (XSS)

### [CRITICAL TEST] SEC-001: Evitar Ejecución de XSS HTML
- **Área**: Security
- **Precondición**: Crear TEST_BLOG_XSS.
- **Pasos**: Poner `<script>alert(1)</script>` en contenido markdown.
- **Esperado**: NO ejecución (React-markdown lo escapa o filtra).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### [CRITICAL TEST] SEC-002: Links Peligrosos
- **Área**: Security
- **Precondición**: En un TEST_BLOG_XSS.
- **Pasos**: Agregar `[Hacked](javascript:alert('pwned'))`.
- **Esperado**: El enlace renderizado debe perder el protocolo activo o no ser clickable (filtrado estricto por transform-url).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG

### SEC-003: Externals Disallowed
- **Área**: Security
- **Precondición**: En un TEST_BLOG_XSS.
- **Pasos**: Agregar `![Tracker](https://evil.site/tracker.png)`.
- **Esperado**: La imagen externa se bloquea (por estricción interna que solo permite media://).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST BLOG


## 5. Contenido Institucional y Perfil de Sitio

### SITE-001: Crear Home Inicial
- **Área**: Site Content
- **Precondición**: Sin data.
- **Pasos**: Escribir contenido para la Home y guardar.
- **Esperado**: Se crea la primera sección, v1, auditoría CREATE. Aparece en la landing pública.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SITE-002: Edición Institucional
- **Área**: Site Content
- **Precondición**: Home en v1.
- **Pasos**: Editar y generar v2.
- **Esperado**: Histórico v1 intacto. Front usa v2.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### [CRITICAL TEST] SITE-003: Concurrencia de Secciones
- **Área**: Site Content
- **Precondición**: 2 pestañas sobre la Home.
- **Pasos**: A guarda v3. B intenta guardar v3.
- **Esperado**: Misma semántica y conflicto seguro que en Blogs.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SITE-004: Restauración de Sección
- **Área**: Site Content
- **Precondición**: Home con versiones históricas.
- **Pasos**: Restaurar una versión.
- **Esperado**: Crea versión nueva copiando el contenido de la fuente, `restoredFrom` en auditoria, histórico intacto.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SITE-005: Perfil (Profile)
- **Área**: Site Content
- **Precondición**: ADMIN
- **Pasos**: Actualizar groupName, tagline y logo.
- **Esperado**: Front actualiza header, homepage tagline y metadatos SEO.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SITE-006: Manejo de Logo en Perfil
- **Área**: Site Content
- **Precondición**: Logo A. Archivar Logo A.
- **Pasos**: Observar front. Intentar crear nueva edición conservando A. Restaurar edición vieja.
- **Esperado**: Front público sigue usando el logo en BD a pesar de papelera. Nueva edición con A rechazado. Restore histórico de A, permitido.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SITE-007: Prevención de media:// en markdown institucional
- **Área**: Site Content
- **Precondición**: N/A
- **Pasos**: Insertar etiqueta markdown `media://` en la biografía o contenido institucional.
- **Esperado**: Rechazo del backend explícito.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A


## 6. Equipo y Redes Sociales

### TEAM-001: Crear Miembro
- **Área**: Team
- **Precondición**: ADMIN.
- **Pasos**: Crear un miembro TEST.
- **Esperado**: Visible en Nosotros si fue marcado visible.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MEMBER

### TEAM-002: Editar Miembro
- **Área**: Team
- **Precondición**: Member TEST con v1.
- **Pasos**: Editar y guardar.
- **Esperado**: Front actualiza a v2, se mantiene v1.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MEMBER

### [CRITICAL TEST] TEAM-003: Concurrencia de Team
- **Área**: Team
- **Precondición**: 2 pestañas sobre Miembro.
- **Pasos**: Guardar en colisión.
- **Esperado**: Conflicto capturado en B.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### TEAM-004: Visibilidad del Miembro
- **Área**: Team
- **Precondición**: TEST member.
- **Pasos**: Establecer isVisible=false. Luego true.
- **Esperado**: Desaparece del Frontend público inmediatamente al ser false, sin necesidad de compilación (revalidación SSR/ServerActions funciona).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### TEAM-005: Foto Histórica de Miembro
- **Área**: Team
- **Precondición**: Similar a Blogs, foto A archivada, restore versión que la usaba.
- **Pasos**: Ejecutar flujo.
- **Esperado**: Permitido.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### TEAM-006: Delete y Recover
- **Área**: Team
- **Precondición**: Member.
- **Pasos**: Delete -> Recover.
- **Esperado**: Soft-delete despublica del front de inmediato. Recover repone según visibilidad última de su latest version.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MEMBER

### TEAM-007: Validación Fuerte de URLs
- **Área**: Team
- **Precondición**: Edición de enlaces sociales de miembro.
- **Pasos**: Intentar `https://github.com/test`, `https://evil.example`, `https://github.com.attacker.example`.
- **Esperado**: Backend rechaza y valora exclusivamente hostnames autorizados en URLs sanas.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SOCIAL-001: Gestión de Redes Sociales (Opcional)
- **Área**: Social
- **Precondición**: Crear una TEST si necesario, u omitir sin alterar BD de DevBox.
- **Pasos**: CREATE, EDIT, hide, show, guardado idempotente (no cambios -> no ops).
- **Esperado**: Flujo funciona, No-op no arroja filas basuras en la tabla de audit.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SOCIAL-002: Protocolos de Redes Sociales
- **Área**: Social
- **Precondición**: Modificar un hipervínculo en redes sociales a usar `javascript:...` o `http://`.
- **Pasos**: 
- **Esperado**: Rechazo del backend o fallo de validación de Zod.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SOCIAL-003: Renderización del Footer
- **Área**: Social
- **Precondición**: Red Social.
- **Pasos**: Cambiar visibilidad.
- **Esperado**: Actualiza inmediatamente la aparición de la red en la página base/footer.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A


## 7. Formulario de Contacto

### CONTACT-001: Mensaje Valido
- **Área**: Contact
- **Precondición**: Formulario público.
- **Pasos**: Llenar correctamente y enviar con payload descriptivo `TEST`.
- **Esperado**: Transacción guarda nuevo mensaje (estado NEW), historial seq1, emite alerta/auditoria y aparece en Inbox del admin.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MSG

### CONTACT-002: Email Inválido
- **Área**: Contact
- **Precondición**: Formulario público.
- **Pasos**: Llenar con payload inválido (`test@test`).
- **Esperado**: Rechazo (no llega al back, o Zod lo bloquea), sin registro DB.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### CONTACT-003: Honeypot Testing
- **Área**: Contact
- **Precondición**: Formulario público.
- **Pasos**: Llenar campo oculto `website` usando DevTools y enviar.
- **Esperado**: Respuesta 200 neutral/éxito aparente para engañar al bot, pero no hay base de datos insertada ni auditoría gastada.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### CONTACT-004: XSS en Mensaje
- **Área**: Contact
- **Precondición**: Formulario de contacto.
- **Pasos**: Enviar payload `<script>alert(1)</script>` en el body.
- **Esperado**: El Inbox del Admin lo renderiza literalmente (gracias a escape natural de React pre-wrap) y no sufre ejecución.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### [CRITICAL TEST] CONTACT-005: Transición a READ
- **Área**: Contact
- **Precondición**: TEST message en NEW.
- **Pasos**: Admin marca como leído (READ).
- **Esperado**: Se crea status sequence (seq2: READ, prev: NEW), cambia status general de tabla messages, inserta auditoria STATUS_CHANGE.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MSG

### CONTACT-006: Transición READ -> READ idempotente
- **Área**: Contact
- **Precondición**: Mensaje en READ.
- **Pasos**: Forzar petición de READ nuevamente.
- **Esperado**: No genera seq3 ni filas de auditoría extra. (Idempotente).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### CONTACT-007: Archivar
- **Área**: Contact
- **Precondición**: Mensaje READ.
- **Pasos**: Transición a ARCHIVED.
- **Esperado**: Genera seq3 ARCHIVED correctamente.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: TEST MSG

### [CRITICAL TEST] CONTACT-008: Transiciones Inválidas
- **Área**: Contact
- **Precondición**: Mensajes de prueba (uno NEW, uno ARCHIVED).
- **Pasos**: Forzar petición (por DevTools/cURL si es necesario) para pasar de NEW a ARCHIVED directamente, o de ARCHIVED a READ.
- **Esperado**: Rechazo total, no impacta la BD ni salta pasos obligatorios.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### [CRITICAL TEST] CONTACT-009: Concurrencia en Mensaje
- **Área**: Contact
- **Precondición**: 2 pestañas sobre mismo mensaje en estado NEW.
- **Pasos**: Las dos accionan pasar a READ casi en simultáneo.
- **Esperado**: Una falla limpiamente o es absorbida como idempotente de acuerdo a su transacción pg advisory lock. Sólo una fila generada.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### CONTACT-010: Filtros de Bandeja (Admin)
- **Área**: Contact
- **Precondición**: 1 msj en NEW, 1 en READ, 1 en ARCHIVED.
- **Pasos**: Probar pestañas del dashboard.
- **Esperado**: Filtros resuelven correctamente el listado.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### CONTACT-011: Funcionalidad Mailto Segura
- **Área**: Contact
- **Precondición**: Mensaje normal.
- **Pasos**: Hacer clic en Responder (Mailto).
- **Esperado**: Apertura correcta del cliente de correo, codificado correctamente.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A


## 8. Auditoría General

### AUDIT-001: Fidelidad de eventos
- **Área**: Audit
- **Precondición**: Uso regular.
- **Pasos**: Navegar a la página de auditoría como admin. Buscar una acción generada en los casos pasados (CREATE, STATUS_CHANGE, PASSWORD_CHANGE, etc.).
- **Esperado**: Existen registros bien atribuidos para el Actor, el target y el momento temporal sin pérdida.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### AUDIT-002: Comprobación No-Op
- **Área**: Audit
- **Precondición**: Tests de idempotencia corridos.
- **Pasos**: Filtrar registros por los casos de fallo / re-clic (DELETE ya borrado, READ ya leido).
- **Esperado**: No debe haber eventos duplicados basuras.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A


## 9. SEO & Navegación Web (Performance / UX)

### SEO-001: Tags de publicación
- **Área**: SEO
- **Precondición**: Blog v2.
- **Pasos**: Inspeccionar HEAD de la URL pública. Editar blog a v3 pero sin publicar (Draft). Re-inspeccionar.
- **Esperado**: Etiquetas Title, Meta Description, Canonical y OG mantienen su fidelidad atada estrictamente a la última versión publicada (v2) y no a los borradores (v3).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SEO-002: Sitemap
- **Área**: SEO
- **Precondición**: N/A
- **Pasos**: Visitar `/sitemap.xml`.
- **Esperado**: Debe incluir la home, la root `/blogs`, y las rutas a los blogs individuales publicados. NO debe indexar endpoints administrativos, logs ni blogs borrados/drafts.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SEO-003: Robots.txt
- **Área**: SEO
- **Precondición**: N/A
- **Pasos**: Visitar `/robots.txt`.
- **Esperado**: Política correcta (`Disallow: /admin`, `Disallow: /dashboard`, etc.). No confundir esto con una frontera de seguridad de autorización, es para indexadores amigables.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SEC-004: Respuesta Efectiva de Cabeceras
- **Área**: Security Headers
- **Precondición**: N/A
- **Pasos**: Usar curl local `curl -I http://localhost:3000/`.
- **Esperado**: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy strict, Permissions-Policy visibles.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SEC-005: Seguridad de Cookies Session
- **Área**: Auth (Headers)
- **Precondición**: Usuario con sesión activa.
- **Pasos**: En DevTools Application Tab, revisar la cookie `auth-session`.
- **Esperado**: Flags obligatorios de HttpOnly y SameSite=Lax.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### SEC-006: Manejo de Errores Seguros
- **Área**: UX & Security
- **Precondición**: N/A
- **Pasos**: Ingresar una UUID o ID arbitraria falsa para editar un blog, ver un mensaje de contacto, u otro.
- **Esperado**: Comportamiento funcional en UI con error 404/Generic Not Found, sin arrojar la traza de la consola/stack Node JS SQL al navegador.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### UX-001: Links Seguros
- **Área**: UX
- **Precondición**: N/A
- **Pasos**: Un visitante normal (sin sesión o con sesión baja) explora la landing pública.
- **Esperado**: El menú superior no delata ni incluye links a `/admin` y `/dashboard` a perfiles que no deban verlo.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### UX-002: Reflujo Responsive
- **Área**: UX
- **Precondición**: N/A
- **Pasos**: Revisar rutas en dimensiones 375px, 768px, 1440px.
- **Esperado**: No hay recortes duros ni comportamientos erróneos. (Documentar UI flaws encontrados aquí en el register defect).
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### UX-003: Navegación de Teclado
- **Área**: UX
- **Precondición**: N/A
- **Pasos**: Usar el botón Tab.
- **Esperado**: Tabbing resalta el focus de botones, enlaces, modales.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

### UX-004: Accesibilidad de Soporte
- **Área**: UX
- **Precondición**: N/A
- **Pasos**: Revisar inputs genéricos.
- **Esperado**: Imágenes tienen Alt obligatorio (ya implementado), etiquetas ARIA semánticas están ahí.
- **Actual**: 
- **Estado**: No ejecutada
- **Datos a limpiar**: N/A

---

## 10. Candidatos a Futura Automatización E2E (Playwright)
Una vez que el proyecto cuente con una DB de pruebas, semilla (seed data) determinista y recursos multimedia simulables o carpeta separada de Cloudinary, los siguientes flujos deberían ser los primeros en transicionarse a Playwright:
1. `AUTH-001 / AUTH-002`: Tests rápidos de flujo login con aserciones en los hooks/rutas (Dashboard/Admin).
2. `AUTH-007`: Ciclo completo de password update para autores recién llegados.
3. `BLOG-004`: Simulación visual del bloqueo concurrente con tabs aisladas del browser engine.
4. `BLOG-006 / BLOG-008`: Mutación public/draft/unpublish para verificar si desaparecen del home (Test visual/DOM node).
5. `CONTACT-001`: Inyección E2E validando llenado completo exitoso.
6. `CONTACT-003 / CONTACT-004`: Validación DOM y honeypot form submissions.
7. `SEC-001`: Prueba E2E que asegure que no existe el nodo DOM `<script>` inyectado al cargar una publicación intencional de test.

---

## Summary de Ejecución
*(Para ser rellenada por el desarrollador una vez ejecutadas en Local/Preview).*

| Área | Total | PASS | FAIL | BLOCKED | No ejecutada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Auth/Users | 12 | 0 | 0 | 0 | 12 |
| Blogs | 10 | 0 | 0 | 0 | 10 |
| Multimedia | 9 | 0 | 0 | 0 | 9 |
| Security / XSS | 3 | 0 | 0 | 0 | 3 |
| Site / Team / Social | 17 | 0 | 0 | 0 | 17 |
| Contact | 11 | 0 | 0 | 0 | 11 |
| Audit | 2 | 0 | 0 | 0 | 2 |
| UX / SEO / Headers | 10 | 0 | 0 | 0 | 10 |
| **Total General** | **74** | **0** | **0** | **0** | **74** |
