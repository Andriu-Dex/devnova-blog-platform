# Production Security Checklist

Este documento registra los riesgos de seguridad evaluados durante la auditoría integral y su estado de cara a la salida a producción.

| ID | Riesgo | Severidad | Estado | Mitigación | Bloquea producción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `RATE-LIMIT-LOGIN` | Falta de rate limiting en el formulario de login | HIGH | OPEN | Implementar Vercel WAF/rate limiting o proveedor KV compatible. | **YES** |
| `RATE-LIMIT-CONTACT` | Falta de rate limiting en formulario de contacto | MEDIUM | OPEN | Añadir rate limiting distribuido, WAF o Turnstile/CAPTCHA. | **YES** |
| `TEMP-PASSWORD-TTL` | Contraseñas temporales no tienen tiempo de expiración | MEDIUM | OPEN | Crear cron o almacenar `expiresAt` para caducar contraseñas generadas. | NO |
| `CSP-HARDENING` | CSP estricta pendiente por compatibilidad de Next.js | LOW | OPEN | Requiere validación de nonces en middleware sin romper React. | NO |

## PRODUCTION BLOCKERS

Los siguientes problemas deben resolverse **antes** de exponer la aplicación públicamente:
- **RATE-LIMIT-LOGIN**
- **RATE-LIMIT-CONTACT**
