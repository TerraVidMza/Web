---
titulo: Manual del Auditor
version: 27/10/2026
---

## Introducción

### Qué es TerraVid

TerraVid es un sistema de gestión para fincas vitivinícolas. Reúne las fincas y sus cuarteles, el trabajo del campo y lo que cuesta, las lecturas de los sensores del viñedo, la vendimia (pesajes, remitos y liquidaciones) y un análisis agronómico que cruza esos datos.

### Qué puede hacer el Auditor

- Consultar el **log de auditoría**: quién hizo cada cambio, cuándo y desde dónde.
- Ver la actividad de las últimas 24 horas en su **dashboard**.
- Consultar las **fincas**, los **cuarteles** y el **mapa**.
- Consultar el **historial de labores** de cada cuartel.

> El Auditor tiene acceso de **solo lectura**: no puede crear, modificar ni borrar nada. No ve costos, telemetría ni vendimia, y no usa la app móvil.

### Requisitos

- Una computadora o tablet con un navegador actualizado (Chrome, Edge, Firefox o Safari) y conexión a internet.
- La dirección del sistema: **https://terravid.web.app**
- Tu usuario y contraseña de TerraVid.

## Ingreso al sistema

### Iniciar sesión

1. Abrí el navegador e ingresá a **https://terravid.web.app**.
2. Escribí tu **Email** y tu **Contraseña**.
3. Hacé clic en **Iniciar sesión**.

![Pantalla de inicio de sesión](comun-login.jpg)

Si los datos son correctos, entrás a tu pantalla de inicio. Si antes de iniciar sesión habías abierto una pantalla en particular, el sistema te lleva directamente ahí.

### Errores frecuentes al ingresar

| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| **Email o contraseña incorrectos** | El email no existe o la contraseña no coincide. Por seguridad, no se dice cuál de los dos está mal. | Revisá que no esté activado Bloq Mayús y volvé a intentar. Si no la recordás, usá **Olvidé mi contraseña**. |
| **Cuenta bloqueada por demasiados intentos** | Hubo **5 intentos fallidos seguidos**. | Esperá 15 minutos o recuperá la contraseña. |
| **Tu cuenta está desactivada** | Un Propietario de tu empresa desactivó tu usuario. | Pedile que te reactive. |
| **Ingresá tu contraseña** / **Email inválido** | Falta un campo o el email está mal escrito. | Completá el campo marcado en rojo. |

### Cambio de contraseña obligatorio

Si te dieron una contraseña **temporal**, después de ingresar aparece la pantalla **Cambiá tu contraseña** y no podés usar otra pantalla hasta definir una propia. Completá la **Contraseña actual**, la **Nueva contraseña** (entre 8 y 72 caracteres, con al menos una letra y un número, distinta de la actual) y **Repetir nueva contraseña**, y hacé clic en **Guardar contraseña**.

### Recuperar la contraseña

![Recuperar la contraseña](comun-olvide-password.jpg)

1. En la pantalla de inicio de sesión, hacé clic en **Olvidé mi contraseña**.
2. Escribí tu email y confirmá. Vas a ver **Revisá tu correo**.
3. Abrí el enlace que te llega. En **Definí tu contraseña**, escribí la nueva dos veces y confirmá.

> El enlace **vence a los 30 minutos y sirve una sola vez**. Si vence, pedí uno nuevo. Si no llega, revisá la carpeta de spam.

### Duración de la sesión

Mientras usás el sistema, la sesión se renueva sola. Si pasás varios días sin entrar (7 por defecto), te va a pedir la contraseña de nuevo.

### Cerrar sesión

Abajo a la izquierda, en la ficha con tu email, hacé clic en el ícono **Cerrar sesión** (la flecha que sale de una puerta). Cerrá sesión siempre que uses una computadora compartida.

## Cómo moverse por la aplicación

![Estructura general de la pantalla](auditor-dashboard.jpg)

### Barra lateral

Arriba aparece el **nombre de tu empresa** y debajo las secciones que tu rol puede usar:

| Sección | Para qué sirve |
|---|---|
| **Dashboard** | Actividad de las últimas 24 horas. |
| **Fincas** | Fincas de la empresa y sus cuarteles. |
| **Cuarteles** | Búsqueda de cuarteles en todas las fincas. |
| **Mapa** | Ubicación de fincas y estado de cosecha. |
| **Log de auditoría** | Registro completo de cambios. |
| **Notificaciones** | Avisos del sistema. |
| **Ayuda** | Este manual y el pedido de ayuda. |

La sección en la que estás queda resaltada. Abajo está la **ficha de usuario** con tu email y tu rol, el ícono de **Mi perfil** (silueta de persona) y el de **Cerrar sesión**.

> En pantallas angostas, como un celular o una tablet vertical, la barra lateral se oculta: tocá el botón de tres rayas arriba a la izquierda para abrirla.

### Barra superior

- **Campana de notificaciones**: muestra un número rojo con las que no leíste.
- **Tema claro u oscuro**: el ícono del sol o la luna cambia el aspecto de la pantalla.

### Pestañas, filtros y tablas

- Varias secciones se dividen en **pestañas** debajo del título; la activa aparece subrayada.
- Donde hace falta, hay un desplegable **Finca** arriba de la tabla. En algunas pantallas hay que elegir una finca antes de ver datos.
- En las tablas largas, abajo se ve *Mostrando 1–20 de N*, el selector **Filas** y las flechas para pasar de página.
- Al final de muchas filas hay un botón **"..."** con las acciones de ese elemento. Si no aparece, tu rol no tiene acciones ahí.
- Las pantallas de detalle tienen arriba un enlace **← Volver a...**.

### Mensajes del sistema

Cuando guardás algo aparece un aviso breve arriba a la derecha. Si algo falla, el aviso es rojo y explica el motivo. Si una pantalla no puede cargar los datos muestra **No se pudieron cargar los datos** con un botón **Reintentar**.

## Dashboard

![Dashboard del Auditor](auditor-dashboard.jpg)

Tu pantalla de inicio muestra la **Actividad de las últimas 24 horas**: cada evento con la acción (por ejemplo *LOGIN*, *GENERAR_REMITO*, *CREAR_SENSOR*), sobre qué entidad, quién lo hizo y cuándo. **Ver el log completo** abre el log de auditoría.

## Log de auditoría

**Para qué sirve:** saber quién hizo cada cambio, cuándo y desde qué IP. Es de **solo lectura**: nadie puede modificarlo.

![Log de auditoría](auditor-auditoria.jpg)

1. Entrá a **Log de auditoría**.
2. Filtrá por **Acción**, **Entidad**, **Desde** y **Hasta**.
3. Cada fila muestra la **Fecha**, la **Acción**, la **Entidad**, el **Responsable** (nombre, email y rol), los **Cambios** y la **IP**.
4. En **Cambios**, hacé clic en *N campos* para ver qué valores cambiaron.

![Detalle de los cambios de un evento](auditor-detalle-auditoria.jpg)

Los eventos van del más nuevo al más viejo. También se registran los ingresos fallidos (*LOGIN_FALLIDO*).

### Acciones frecuentes

| Acción | Qué registra |
|---|---|
| **LOGIN** / **LOGIN_FALLIDO** | Ingresos al sistema y los intentos fallidos. |
| **SINCRONIZAR_LABORES** / **SINCRONIZAR_PESAJES** | Labores y pesajes que llegaron desde la app móvil. |
| **GENERAR_REMITO**, **APROBAR_REMITO**, **RECHAZAR_REMITO** | El circuito de los remitos de vendimia. |
| **CREAR_…**, **ACTUALIZAR_…**, **DESACTIVAR_…** | Altas, cambios y bajas de fincas, cuarteles, usuarios, sensores, etc. |

## Fincas y cuarteles

**Para qué sirve:** la estructura productiva de la empresa. Una **finca** es el establecimiento; cada finca se divide en **cuarteles**, las parcelas sobre las que se registra el trabajo y la cosecha.

![Listado de fincas](auditor-fincas.jpg)

En **Fincas** ves las fincas activas de la empresa con su ubicación, superficie y cantidad de cuarteles. El cuadro **Buscar finca...** filtra por nombre. Las fincas las da de alta el Propietario.

### Cuarteles de una finca

En **Fincas**, hacé clic en el botón **Cuarteles** de la fila. Se abre la lista de cuarteles activos con su variedad, sistema de conducción, año, hectáreas y estado de **Cosecha**.

![Cuarteles de una finca](auditor-cuarteles-finca.jpg)

**Acciones del menú "..." de un cuartel:**

- **Ver historial**: abre el historial de labores del cuartel.

### Buscar cuarteles en todas las fincas

1. Entrá a **Cuarteles** en la barra lateral.
2. Filtrá por **Nombre**, **Finca**, **Variedad**, **Cosecha** y **Estado** (*Activos* o *Dados de baja*).
3. Hacé clic en **Nombre** en el encabezado para ordenar. **Limpiar filtros** vuelve todo a cero.

![Búsqueda de cuarteles](auditor-buscar-cuarteles.jpg)

### Mapa

1. Entrá a **Mapa**.
2. En **Ver**, elegí **Todas las fincas** para ver un marcador por finca, o una finca para ver sus cuarteles.
3. Los cuarteles tienen el **color de su estado de cosecha**. Al hacer clic en un marcador se abre una ficha con sus datos. Al pie hay una referencia de colores.

![Mapa](auditor-mapa.jpg)

> Si ves *Ninguna finca tiene coordenadas cargadas*, falta completar latitud y longitud en la finca o el cuartel.

## Historial de labores por cuartel

**Dónde:** **Cuarteles → "..." → Ver historial**.

![Historial de labores](auditor-historial.jpg)

Cada labor del cuartel con **Fecha**, **Labor**, **Cantidad**, **Responsable**, **Insumos** y **Ubicación** donde se registró. Se filtra por **Desde** y **Hasta**.

## Notificaciones

**Para qué sirve:** enterarte de las novedades que te tocan sin revisar cada sección.

![Notificaciones](auditor-notificaciones.jpg)

Te llegan los avisos generales del sistema.

**Desde la campana (barra superior):** si hay notificaciones sin leer, la campana muestra un número rojo. Al hacer clic se ven las últimas; al elegir una se marca como leída y te lleva a la pantalla relacionada. **Marcar todas** las marca como leídas y **Ver todas** abre la pantalla completa.

**Desde la pantalla Notificaciones:** pestañas **Todas** y **Sin leer**; en cada aviso, **Ver** abre la pantalla relacionada y **Marcar leída** lo saca de pendientes. Arriba a la derecha está **Marcar todas como leídas**.

## Mi perfil

**Para qué sirve:** ver y actualizar tus datos y cambiar tu contraseña.

![Mi perfil](auditor-perfil.jpg)

Entrá con el ícono de persona de la ficha de usuario, abajo a la izquierda.

- **Datos personales**: podés cambiar tu **Nombre** y hacer clic en **Guardar cambios**. El email y el rol se ven pero no se editan acá.
- **Seguridad**: **Cambiar contraseña** te pide la actual y la nueva.
- **Cuenta**: muestra la empresa, el último acceso y la fecha de alta.

## Ayuda y soporte

**Para qué sirve:** consultar este manual y pedir ayuda cuando algo no funciona.

![Centro de ayuda](auditor-ayuda.jpg)

### Manual de usuario

En **Ayuda → Manual de usuario** está este manual, con **solo lo que tu rol puede hacer**. A la izquierda tenés el índice; hacé clic en un título para ir a esa parte. Con **Buscar en el manual** quedan solo las secciones que mencionan lo que escribiste (por ejemplo *remito* o *contraseña*). Hacé clic en una captura para verla en tamaño completo.

Si la empresa cargó preguntas frecuentes propias, aparecen al final en **Más preguntas frecuentes**; las modificadas en los últimos 30 días tienen la marca **Actualizado**.

### Pedir ayuda

![Pedir ayuda](auditor-soporte.jpg)

1. Entrá a **Ayuda → Pedir ayuda**.
2. En **¿En qué parte?**, elegí el módulo: Acceso y cuenta, Fincas y cuarteles, Operaciones, Telemetría, Vendimia o Reportes.
3. En **¿Qué pasó?**, contá qué estabas haciendo, qué esperabas y qué pasó (entre 10 y 1000 caracteres).
4. Hacé clic en **Enviar pedido**. Llega al **email de soporte** configurado para tu empresa.

## Preguntas frecuentes

**¿Puedo corregir un dato que encontré mal?**
No: el Auditor solo consulta. Avisale al Propietario o reportalo en **Ayuda → Pedir ayuda**.

**¿Por qué no veo costos, telemetría ni vendimia?**
Son datos de gestión que tu rol no tiene habilitados. El log de auditoría sí registra quién los cambió.

**¿El log se puede borrar o modificar?**
No. Ningún rol puede modificarlo.

## Glosario

| Término | Significado |
|---|---|
| **Finca** | Establecimiento agrícola de la empresa. |
| **Cuartel** | Parcela de una finca, con una variedad y un sistema de conducción. Sobre él se registran labores, pesajes y costos. |
| **Labor** | Trabajo hecho en un cuartel (poda, pulverización, riego…). Se mide en jornales, horas o hectáreas. |
| **Insumo** | Producto que se aplica en una labor (fertilizante, fungicida…). |
| **Cuadrilla** | Grupo de cosechadores de una finca. Cobra una tarifa por kilo. |
| **Pesaje** | Kilos que cosechó una cuadrilla en un cuartel en un día. Se carga desde la app móvil. |
| **Remito** | Agrupa los pesajes de un cuartel en una jornada para despacharlos a la bodega. Puede estar en Borrador, Aprobado o Rechazado. |
| **Liquidación** | Lo que pagó la bodega por un remito aprobado. Es el ingreso del cuartel. |
| **Campaña** | Período agrícola que se usa para contar la cosecha y comparar temporadas. |
| **Umbral** | Valor mínimo o máximo aceptable de un sensor. Fuera de ese rango se genera una alerta. |
| **Vigencia** | Fecha desde la que rige un costo o una tarifa. No puede ser anterior a hoy. |
| **Sincronizar** | Enviar al sistema lo que se registró en el teléfono. |
