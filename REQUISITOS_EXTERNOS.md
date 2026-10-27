# REQUISITOS_EXTERNOS.md — Lo que debes preparar fuera de Codex

**Proyecto:** Electro Shop, demo universitaria, 26/10/2026.  
**Objetivo de costo:** $0 USD/mes de infraestructura durante el piloto, sujeto a cuotas y condiciones vigentes. Dominio propio opcional y de pago anual.  
**Importante:** aquí solo marcamos cuentas o datos que requieren tu participación. **Codex escribe y configura el código**; no debes programar a mano ni compartir contraseñas en chats/commits.

## Semáforo por momento

| Momento | Requisito externo | ¿Necesario ya? | Qué hará Codex después |
|---|---|---|---|
| CP-002 | PC con VS Code y Node.js, Git, Codex autenticado | **Sí** | Frontend local |
| CP-002/CP-006 | Cuenta GitHub + repo privado `electroshop-academico` | Conveniente ya | Commits/PR y Netlify |
| CP-003 | Cuenta y proyecto Supabase Free | **No hasta CP-003** | Migraciones, Auth, RLS |
| CP-004 | Una cuenta admin de prueba en Supabase Auth | No hasta CP-004 | Login/CRUD seguro |
| CP-006 | Cuenta Netlify Free vinculada a GitHub | No hasta CP-006 | Desplegar sitio |
| Posterior | Dominio propio | **No** | DNS/HTTPS |
| Posterior | Firebase, pasarelas, proveedor de correo, AWS | **No** | Fuera del MVP |

## A. Preparación local inmediata — CP-002

- [ ] **VS Code** instalado en Windows: https://code.visualstudio.com/
- [ ] **Node.js versión LTS vigente** y npm: https://nodejs.org/  (verificar `node -v`, `npm -v`).
- [ ] **Git**: https://git-scm.com/downloads (verificar `git --version`).
- [ ] **Codex** mediante la extensión oficial de VS Code o Codex de escritorio. Iniciar sesión **con tu cuenta ChatGPT Plus**, no por API key: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- [ ] En el selector usar **GPT-6.1 Sol** + **Medium** si está disponible; si aún no aparece por despliegue gradual, escoger **GPT-6 Sol** + Medium u otro modelo incluido. No contratar un plan nuevo ni API para este trabajo.
- [ ] Descomprimir el ZIP de preparación como una carpeta de proyecto (que contenga `PROJECT.md` y `AGENTS.md`) y **abrir esa carpeta raíz**, no `checkpoints/...` en VS Code.
- [ ] Ejecutar primer prompt de `docs/CODEX_START.md`. Codex se ocupa de crear `web/`, instalar dependencias y ejecutar scripts.
- [ ] Si no tienes GitHub todavía, puedes hacer CP-002 local; GitHub será obligatorio antes de Netlify y recomendable para revisión/PR.

**Comandos para verificar herramientas en PowerShell:**

```powershell
node -v
npm -v
git --version
```

### GitHub recomendado

- [ ] Crear/iniciar sesión: https://github.com/
- [ ] Crear un repositorio **privado**, nombre sugerido `electroshop-academico`; no subir ZIPs de otras personas ni datos reales.
- [ ] Subir el contenido de la carpeta raíz y dar acceso a tu compañero como colaborador si lo necesita.
- [ ] Preferir ramas por CP y revisar PR. No subir `web/.env.local`, secretos ni `node_modules`.
- [ ] Si utilizas Codex web/cloud, conectar el repositorio GitHub cuando Codex lo solicite. La extensión local en VS Code puede trabajar con una carpeta local sin conectar GitHub primero.

## B. Supabase Free — preparar justo antes de CP-003

**Recomendado sobre Firebase para el MVP:** PostgreSQL y relaciones entre catálogo, roles, pedidos simulados y reparación. No crear ambos proyectos.

1. [ ] Crear/iniciar sesión en https://supabase.com/ y abrir https://supabase.com/dashboard .
2. [ ] Crear nueva organización personal si la consola lo solicita; seleccionar **Free**.
3. [ ] Crear proyecto, nombre sugerido `electroshop-academico` y región disponible cercana al público objetivo. Guardar la contraseña de DB en administrador de contraseñas **(nunca en chat ni Git)**.
4. [ ] En panel del proyecto abrir **Connect** o **Settings → API Keys** y copiar **Project URL** y **publishable key** `sb_publishable_...` (para cliente); no confundir con `secret` `sb_secret_...` ni `service_role`.
5. [ ] Codex preparará `.env.example`. Tú completarás **solo en tu máquina** `web/.env.local` con:

```dotenv
PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICABLE
```

6. [ ] Permitir que Codex genere primero las migraciones SQL y reglas RLS; revisarlas antes de ejecutarlas por SQL Editor/CLI. **No crear tablas manualmente con tipos improvisados**.
7. [ ] Ejecutar las migraciones y semillas de desarrollo siguiendo las instrucciones que Codex entregue en CP-003; comprobar tablas y permisos de prueba. Si se necesita CLI, Codex puede explicar cómo autenticar localmente sin copiar tokens al repo.
8. [ ] Antes de CP-004, crear/invitar **usuario de prueba admin** desde Auth Dashboard (correo de prueba controlado por ti) y concederle rol solo mediante procedimiento de administración SQL que Codex documente. La app nunca debe permitir autoasignarse admin.
9. [ ] Configurar Auth URL/redirects para `http://localhost:4321` y después para dominio `*.netlify.app`, según el login escogido y URLs exactas. Deshabilitar registros públicos si no son necesarios para el MVP.
10. [ ] Si se usa Storage para imágenes en una fase adicional, usar políticas de bucket apropiadas, límites y archivos propios; para CP-002 usar placeholders locales sin Storage.

**No compartir:** contraseña de la DB, token de acceso personal, keys `sb_secret_...`, clave `service_role`, JWT secreto o accesos a cuentas. **URL y publishable key son públicas por diseño**, pero aun así se recomienda gestionarlas mediante `.env.local` y variables de despliegue para prevenir errores.

**Cuotas al verificar (octubre de 2026):** Supabase Free anuncia 500 MB de DB, 1 GB de Storage y 50 000 usuarios activos mensuales; puede pausar un proyecto Free por actividad insuficiente tras ~7 días. Confirmar al crear: https://supabase.com/pricing y https://supabase.com/docs/guides/platform/free-project-pausing

## C. Netlify Free — solo antes de CP-006

1. [ ] Crear/iniciar sesión en https://app.netlify.com/ y seleccionar **Free** ($0).
2. [ ] Conectar GitHub y seleccionar el repo del proyecto; el equipo y tú deben decidir quién será propietario del sitio.
3. [ ] En build settings usar **Base directory: `web`**, **Build command: `npm run build`**, **Publish directory: `dist`**, salvo que el `netlify.toml` aprobado por Codex ya establezca estos valores.
4. [ ] Crear un subdominio libre como `electroshop-academico.netlify.app` (ejemplo, **no está reservado**).
5. [ ] Si CP-003 ya funciona, configurar en Environment Variables las dos `PUBLIC_SUPABASE_*` del proyecto de demo. No publicar secretos; los valores `PUBLIC_*` se incrustan en el frontend y las políticas RLS son la barrera de seguridad.
6. [ ] Configurar Auth redirect URLs del sitio en Supabase (según se requiera).
7. [ ] Revisar deploy preview, producción, enlaces, HTTPS y comportamiento de inicio de sesión. Codex preparará config; tú autorizas la conexión/despliegue.
8. [ ] Comprobar consumo de créditos de la cuenta Netlify Free. Tiene **300 créditos/mes con límite rígido**; despliegues a producción, ancho de banda y otras funciones consumen créditos. Evitar hacer deploy de cada pequeño commit y no activar servicios de pago.

**Referencia:** https://www.netlify.com/pricing/ y https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/

## D. Datos visuales/funcionales que necesita el equipo

- [ ] Confirmar el nombre público de la demo: `Electro Shop` (por defecto).
- [ ] Si quieren logo real, entregar **SVG/PNG transparente autorizado**. Si no, Codex crea wordmark tipográfico temporal.
- [ ] Para 16 productos de prueba, se usarán SKUs, nombres, precios y stock **inventados**. No se requiere CSV real.
- [ ] Confirmar si el profesor exige reparaciones por folio. Si no, quedan como CP-007 opcional.
- [ ] Foto de producto y textos de tercero: solo con permiso/licencia; prohibido copiar automáticamente el catálogo de DIP Mecatrónica.
- [ ] Dirección/WhatsApp/Instagram reales solo si quieren publicar esos datos y se verifica su exactitud; de otro modo demo con placeholders y sin envío real.
- [ ] Fecha de entrega y rúbrica del curso (si existe): compartirlas con el orquestador para recalibrar CPs, sin detener CP-002.

## E. ¿Qué NO necesitas comprar/crear ahora?

- **Dominio:** no es requisito. En un futuro, compra al registrador que elijas; evalúa **precio de renovación**, DNS y privacidad; Netlify puede conectar un dominio sin hosting pagado.
- **OpenAI API key:** **NO** para Codex con login a ChatGPT Plus; solo si la propia app incorporara llamadas a IA, cosa que no exige el MVP.
- **Firebase:** NO, porque elegimos Supabase para esta primera entrega. Si cambian la arquitectura, documentar una ADR y recordar que algunos servicios de Firebase Storage requieren plan Blaze/facturación.
- **Tarjeta bancaria para pagos en el sitio:** NO.
- **AWS VM/FastAPI/Docker/servicios de correo:** NO para CP-002 y MVP base. Docker/Supabase CLI son opcionales para pruebas de base de datos en local.

## F. Checklist antes de autorizar un despliegue

- [ ] Sin credenciales/contraseñas/token privado en Git.
- [ ] Build, tests y revisión de RLS confirmados.
- [ ] Panel admin autenticado de verdad; permisos verificados en servidor/DB.
- [ ] Todas las compras/órdenes rotuladas DEMO; cero cobros.
- [ ] Assets originales/licenciados y datos ficticios.
- [ ] Netlify Free y Supabase Free; límites monitoreados.
- [ ] URL definitiva de Netlify probada en teléfono y escritorio.

**Fuentes oficiales (verificar condiciones al crear):**
- Codex en Plus y selección de modelo: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan y https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- Supabase: https://supabase.com/pricing ; https://supabase.com/docs/guides/getting-started/api-keys ; https://supabase.com/docs/guides/database/secure-data
- Netlify: https://www.netlify.com/pricing/ ; https://docs.netlify.com/build/configure-builds/overview/
