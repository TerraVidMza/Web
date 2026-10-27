---
titulo: Manual del Agrónomo
version: 27/10/2026
---

## Introducción

### Qué es TerraVid

TerraVid es un sistema de gestión para fincas vitivinícolas. Reúne las fincas y sus cuarteles, el trabajo del campo y lo que cuesta, las lecturas de los sensores del viñedo, la vendimia (pesajes, remitos y liquidaciones) y un análisis agronómico que cruza esos datos.

### Qué puede hacer el Agrónomo

- Consultar las **fincas**, dar de alta y editar **cuarteles**, y verlos en el **mapa**.
- Crear y editar **insumos** y **tipos de labor** y registrar sus **costos**; consultar el **costeo y margen bruto**.
- Registrar **sensores**, configurar **umbrales** y revisar **alertas**.
- Dar de alta y editar **cuadrillas**; generar, **aprobar**, **rechazar** y **liquidar** remitos.
- Usar la **inteligencia agronómica**: comparar campañas, correlación y recomendaciones.
- Registrar labores y pesajes desde la **app móvil**.

> Lo que no hace el Agrónomo: dar de alta o de baja fincas, dar de baja cuarteles, insumos o labores, fijar tarifas de cuadrillas, administrar campañas, usuarios o configuración. Eso lo hace el Propietario.

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

![Estructura general de la pantalla](agronomo-dashboard.jpg)

### Barra lateral

Arriba aparece el **nombre de tu empresa** y debajo las secciones que tu rol puede usar:

| Sección | Para qué sirve |
|---|---|
| **Dashboard** | Resumen de indicadores (pantalla de inicio). |
| **Fincas** | Fincas de la empresa y sus cuarteles. |
| **Cuarteles** | Búsqueda de cuarteles en todas las fincas. |
| **Mapa** | Ubicación de fincas y estado de cosecha. |
| **Operaciones** | Costeo por cuartel, insumos y tipos de labor. |
| **Telemetría IoT** | Sensores, lecturas y alertas. |
| **Vendimia** | Remitos, estado de cosecha y cuadrillas. |
| **Inteligencia** | Comparar campañas, correlación, recomendaciones y campañas. |
| **Notificaciones** | Avisos del sistema y alertas de sensores. |
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

## Fincas y cuarteles

**Para qué sirve:** la estructura productiva de la empresa. Una **finca** es el establecimiento; cada finca se divide en **cuarteles**, las parcelas sobre las que se registra el trabajo y la cosecha.

![Listado de fincas](agronomo-fincas.jpg)

En **Fincas** ves las fincas activas de la empresa con su ubicación, superficie y cantidad de cuarteles. El cuadro **Buscar finca...** filtra por nombre. Las fincas las da de alta el Propietario.

### Cuarteles de una finca

En **Fincas**, hacé clic en el botón **Cuarteles** de la fila. Se abre la lista de cuarteles activos con su variedad, sistema de conducción, año, hectáreas y estado de **Cosecha**.

![Cuarteles de una finca](agronomo-cuarteles-finca.jpg)

**Dar de alta un cuartel:**

1. Hacé clic en **+ Nuevo cuartel**.
2. Completá **Nombre**, **Variedad** y **Sistema de conducción** (las opciones salen de las tablas maestras).
3. Opcionalmente: **Clon**, **Año de implantación**, **Hectáreas**, **Latitud** y **Longitud**.
4. Hacé clic en **Crear cuartel**.

![Formulario Nuevo cuartel](agronomo-nuevo-cuartel.jpg)

> El **estado de cosecha** (Pendiente, En cosecha, Cosechado) no se carga a mano: lo actualiza el sistema con los pesajes y los remitos.

**Acciones del menú "..." de un cuartel:**

- **Ver historial**: abre el historial de labores del cuartel.
- **Editar**: cambia los datos del cuartel (no se puede mover a otra finca).

### Buscar cuarteles en todas las fincas

1. Entrá a **Cuarteles** en la barra lateral.
2. Filtrá por **Nombre**, **Finca**, **Variedad**, **Cosecha** y **Estado** (*Activos* o *Dados de baja*).
3. Hacé clic en **Nombre** en el encabezado para ordenar. **Limpiar filtros** vuelve todo a cero.

![Búsqueda de cuarteles](agronomo-buscar-cuarteles.jpg)

### Mapa

1. Entrá a **Mapa**.
2. En **Ver**, elegí **Todas las fincas** para ver un marcador por finca, o una finca para ver sus cuarteles.
3. Los cuarteles tienen el **color de su estado de cosecha**. Al hacer clic en un marcador se abre una ficha con sus datos. Al pie hay una referencia de colores.

![Mapa](agronomo-mapa.jpg)

> Si ves *Ninguna finca tiene coordenadas cargadas*, falta completar latitud y longitud en la finca o el cuartel.

## Insumos y tipos de labor

**Para qué sirve:** definir qué trabajos (**tipos de labor**) y qué productos (**insumos**) se pueden registrar desde el campo, y **cuánto cuesta cada uno**. Con esos costos se calcula el costeo de cada cuartel.

Las pestañas **Insumos** y **Tipos de labor** de **Operaciones** funcionan igual.

![Catálogo de tipos de labor](agronomo-tipos-labor.jpg)

### Crear un insumo o un tipo de labor

1. Entrá a **Operaciones** y elegí la pestaña **Insumos** o **Tipos de labor**.
2. Hacé clic en **+ Nuevo insumo** o **+ Nuevo tipo de labor**.
3. Completá **Nombre**, **Descripción** (opcional) y **Unidad de medida**: kilos o litros para un insumo; jornales, horas o hectáreas para una labor.
4. Cargá el **Costo unitario inicial**, que **rige desde hoy**.
5. Hacé clic en **Crear**.

### Cambiar un costo

El costo **no se edita**: se agrega una vigencia nueva, para no reescribir lo ya registrado.

1. En la fila, hacé clic en **$ Costos**. El costo que rige hoy dice **Vigente**; uno con fecha futura, **Programado**.
2. Hacé clic en **+ Nuevo costo**, cargá el **Nuevo costo** y la fecha **Rige desde** (hoy o más adelante).
3. Hacé clic en **Registrar costo**.

![Historial de costos de una labor](agronomo-costos-tipo-labor.jpg)

### Editar o dar de baja

En el menú **"..."** de la fila: **Editar** (nombre, descripción, unidad). Dar de baja un ítem lo hace el Propietario.

### Importante: los costos no son retroactivos

Cuando llega una labor del campo, el sistema busca el costo **vigente en la fecha de esa labor**. Como las vigencias arrancan **hoy o más adelante**, una labor con fecha **anterior** al primer costo queda con **error de sincronización** (*No hay costo vigente para el tipo de labor a la fecha…*). Lo mismo pasa con los insumos y con las tarifas de las cuadrillas.

Por eso, **antes de que empiece la campaña** cargá todos los tipos de labor e insumos con su costo, y recién después los capataces empiezan a registrar.

## Telemetría IoT

**Para qué sirve:** registrar los sensores instalados en el viñedo, ver lo que miden y recibir alertas cuando una lectura sale del rango aceptable.

![Sensores de una finca](agronomo-sensores.jpg)

### Ver los sensores de una finca

Entrá a **Telemetría IoT → Sensores** y elegí la **Finca**. La tabla muestra el **Código**, el **Tipo**, la **Última lectura** y el **Estado**.

### Dar de alta un sensor

1. Con la finca elegida, hacé clic en **+ Nuevo sensor**.
2. Completá **Código** (la etiqueta física del nodo, la misma que tiene programada), **Tipo** (Temperatura, Humedad de suelo, Humedad ambiente, Pluviómetro, Radiación solar o Viento) y una **Descripción** opcional.
3. Hacé clic en **Crear sensor**.

![Formulario Nuevo sensor](agronomo-nuevo-sensor.jpg)

> El **Tipo** no se puede cambiar después. Si cambiás el **Código**, hay que reprogramar el nodo.

### Credencial MQTT

Para que el nodo envíe lecturas necesita una credencial: en el menú **"..."** del sensor elegí **Credencial MQTT** y **Generar credencial**. Se muestran **Broker**, **Usuario**, **Contraseña** y **Tópico**. **Copialos en ese momento**: la contraseña no se vuelve a mostrar, y generar una nueva desconecta al nodo hasta que se le cargue.

En el mismo menú están **Editar** (código o descripción) y **Dar de baja** (las lecturas recibidas se conservan; las nuevas se rechazan).

### Gráfico y umbrales de un sensor

Hacé clic en el código del sensor o en **Serie**.

![Serie de un sensor con umbrales](agronomo-sensor-detalle.jpg)

- Con **7 días** cada punto es el promedio por hora; con **30** o **90 días**, el promedio por día. La vista **Tabla** muestra promedio, mínimo, máximo y cantidad de lecturas.
- Para fijar el rango aceptable hacé clic en **Umbrales**, cargá el **Mínimo**, el **Máximo** o los dos, y guardá. El gráfico los muestra como líneas rojas.

Cuando una lectura sale del rango, se genera una **alerta** y llega una **notificación**.

### Revisar alertas

![Alertas pendientes](agronomo-alertas.jpg)

1. Entrá a **Telemetría IoT → Alertas** (la pestaña muestra cuántas hay pendientes).
2. Cada alerta indica si el valor **Superó el máximo** o **Cayó del mínimo**, el sensor, la finca, el valor contra el umbral y la fecha.
3. Una vez atendida, hacé clic en **Revisada**.

> Marcar una alerta como revisada **no cambia el umbral**: si la causa sigue, la próxima lectura fuera de rango genera otra.

## Vendimia

**Para qué sirve:** seguir la cosecha desde el pesaje en el cuartel hasta el remito aprobado y liquidado por la bodega. Tiene tres pestañas: **Remitos**, **Estado de cosecha** y **Cuadrillas**.

El circuito es:

1. El capataz registra los **pesajes** desde la app móvil.
2. Se genera un **borrador de remito** con los pesajes de un cuartel en una jornada.
3. El Propietario o el Agrónomo lo **aprueba** o lo **rechaza**.
4. Cuando la bodega paga, se carga la **liquidación** del remito aprobado.

### Cuadrillas

![Cuadrillas de una finca](agronomo-cuadrillas.jpg)

**Crear una cuadrilla:** en **Vendimia → Cuadrillas** elegí la **Finca**, hacé clic en **+ Nueva cuadrilla**, completá **Nombre** e **Integrantes** y hacé clic en **Crear**.

![Formulario Nueva cuadrilla](agronomo-nueva-cuadrilla.jpg)

Con **$ Tarifas** ves el historial de tarifas por kilo de la cuadrilla; las fija el Propietario. En el menú **"..."** podés **Editar** el nombre y los integrantes.

### Generar un borrador de remito

1. Entrá a **Vendimia → Remitos** y hacé clic en **Generar borrador**.
2. Elegí la **Finca**, el **Cuartel** y la **Jornada**: solo entran los pesajes de ese día pendientes de remito.
3. Hacé clic en **Generar**. El sistema te lleva al detalle del borrador.

![Generar un borrador de remito](agronomo-generar-borrador.jpg)

> Un cuartel puede tener **un solo borrador a la vez**. Si no hay pesajes pendientes para ese día, el sistema avisa y no genera nada.

### Aprobar o rechazar un remito

![Remitos en borrador](agronomo-remitos.jpg)

La pestaña **Remitos** abre filtrada en **Estado: Borrador**, lo que espera aprobación. Podés filtrar por **Finca** y quitar los filtros con **Ver todos**.

1. Hacé clic en el número del remito para ver el detalle: finca, cuartel, variedad, kilos y los **pesajes incluidos** con cuadrilla, kilos, tarifa y monto a pagar.
2. Si está bien, hacé clic en **Aprobar** y confirmá.
3. Si hay un error, hacé clic en **Rechazar** y escribí el **Motivo del rechazo** (al menos 10 caracteres; es lo único que ve quien cargó los pesajes). Los pesajes quedan **observados** y no entran en otro remito hasta corregirlos.

![Detalle de un remito en borrador](agronomo-remito-borrador.jpg)

### Cargar la liquidación de la bodega

1. Abrí un remito **aprobado** y hacé clic en **Cargar liquidación**.
2. Completá **Bodega**, **Kilos aceptados**, **Precio por kg**, **Descuentos** (opcional), **Fecha de liquidación** y **N.º de comprobante** (opcional).
3. Hacé clic en **Registrar liquidación**.

![Remito aprobado con su liquidación](agronomo-remito-liquidado.jpg)

La liquidación es el **ingreso** del cuartel y alimenta el margen bruto. Si te equivocaste, el botón pasa a llamarse **Editar liquidación**.

### Imprimir un remito

En el detalle del remito, hacé clic en **Imprimir**. Desde el cuadro de impresión del navegador también podés guardarlo como PDF.

### Estado de cosecha y pesajes

En **Vendimia → Estado de cosecha** elegí la **Finca**. Arriba hay resúmenes (kilos cosechados, pagado a cuadrillas, cuarteles cosechados y pendientes) y debajo una fila por cuartel con **Estado**, **Cosechado**, **Liquidado**, **Sin remito**, **Observado**, **Rinde kg/ha** y **A cuadrillas**.

![Estado de cosecha](agronomo-cosecha.jpg)

- Kilos **Sin remito**: falta generar el borrador.
- Kilos **Observados**: son de un remito rechazado y hay que corregirlos.

Hacé clic en el nombre de un cuartel para ver sus **pesajes** (solo lectura): fecha, cuadrilla, kilos, tarifa, monto, estado (*Pendiente de remito*, *En remito*, *Liquidado* u *Observado*), remito y ubicación.

![Pesajes de un cuartel](agronomo-pesajes.jpg)

## Campañas

**Para qué sirve:** una **campaña** es el período agrícola (por ejemplo, del 1 de julio al 30 de junio). El dashboard la usa para contar los kilos cosechados y la inteligencia agronómica para comparar temporadas.

![Campañas](agronomo-campanias.jpg)

En **Inteligencia → Campañas** ves cada campaña con sus fechas y su estado: **Abierta** o **Cerrada**; la marca **Actual** indica la que rige hoy.

Las campañas y sus metas de cosecha las administra el Propietario.

## Notificaciones

**Para qué sirve:** enterarte de las novedades que te tocan sin revisar cada sección.

![Notificaciones](agronomo-notificaciones.jpg)

Te llegan las **alertas de sensores**, los **remitos pendientes de aprobación** y otros avisos del sistema.

**Desde la campana (barra superior):** si hay notificaciones sin leer, la campana muestra un número rojo. Al hacer clic se ven las últimas; al elegir una se marca como leída y te lleva a la pantalla relacionada. **Marcar todas** las marca como leídas y **Ver todas** abre la pantalla completa.

**Desde la pantalla Notificaciones:** pestañas **Todas** y **Sin leer**; en cada aviso, **Ver** abre la pantalla relacionada y **Marcar leída** lo saca de pendientes. Arriba a la derecha está **Marcar todas como leídas**.

## Mi perfil

**Para qué sirve:** ver y actualizar tus datos y cambiar tu contraseña.

![Mi perfil](agronomo-perfil.jpg)

Entrá con el ícono de persona de la ficha de usuario, abajo a la izquierda.

- **Datos personales**: podés cambiar tu **Nombre** y hacer clic en **Guardar cambios**. El email y el rol se ven pero no se editan acá.
- **Seguridad**: **Cambiar contraseña** te pide la actual y la nueva.
- **Cuenta**: muestra la empresa, el último acceso y la fecha de alta.

## Ayuda y soporte

**Para qué sirve:** consultar este manual y pedir ayuda cuando algo no funciona.

![Centro de ayuda](agronomo-ayuda.jpg)

### Manual de usuario

En **Ayuda → Manual de usuario** está este manual, con **solo lo que tu rol puede hacer**. A la izquierda tenés el índice; hacé clic en un título para ir a esa parte. Con **Buscar en el manual** quedan solo las secciones que mencionan lo que escribiste (por ejemplo *remito* o *contraseña*). Hacé clic en una captura para verla en tamaño completo.

Si la empresa cargó preguntas frecuentes propias, aparecen al final en **Más preguntas frecuentes**; las modificadas en los últimos 30 días tienen la marca **Actualizado**.

### Pedir ayuda

![Pedir ayuda](agronomo-soporte.jpg)

1. Entrá a **Ayuda → Pedir ayuda**.
2. En **¿En qué parte?**, elegí el módulo: Acceso y cuenta, Fincas y cuarteles, Operaciones, Telemetría, Vendimia o Reportes.
3. En **¿Qué pasó?**, contá qué estabas haciendo, qué esperabas y qué pasó (entre 10 y 1000 caracteres).
4. Hacé clic en **Enviar pedido**. Llega al **email de soporte** configurado para tu empresa.

## Reportes

### Dashboard de indicadores

Es la pantalla de inicio.

![Dashboard](agronomo-dashboard.jpg)

| Tarjeta | Qué muestra |
|---|---|
| **Fincas activas** / **Cuarteles activos** | Cantidad de cada uno. |
| **Alertas IoT pendientes** | Alertas de sensores sin revisar. Se atienden en Telemetría → Alertas. |
| **Remitos pendientes** | Remitos en borrador, esperando aprobación. |
| **Kg cosechados** | Kilos pesados en la campaña actual (debajo dice cuál). |
| **Estado de cosecha** | Reparto de cuarteles en **Pendiente**, **En cosecha** y **Cosechado**. |
| **Costo operativo total** | Labores más insumos registrados, con el desglose. |
| **Registros con error de sync** | Labores del campo que no se pudieron registrar, casi siempre por falta de costo vigente. |
| **Costo por finca** | Solo el costo de labores de cada finca, sin insumos. |
| **Alertas recientes sin revisar** | Aparece solo si hay alguna. |

### Costeo y margen bruto por cuartel

**Dónde:** **Operaciones → Costeo**.

![Costeo por cuartel](agronomo-costeo.jpg)

Una fila por cuartel con **Hectáreas**, costo de **Labores** e **Insumos**, **Costo total**, **Costo / ha**, **Ingresos** (liquidaciones de la bodega) y **Margen bruto**, más una fila de **Totales**. Se filtra por **Finca**, **Desde** y **Hasta**.

- Un **"—"** con signo de pregunta es un dato que no se puede calcular; pasá el mouse para ver el motivo (por ejemplo, sin liquidaciones cargadas).
- El costo de cada labor es el que regía **en la fecha de la labor**.
- Hacé clic en el nombre del cuartel para abrir su historial.

### Historial de labores por cuartel

**Dónde:** **Cuarteles → "..." → Ver historial**, o clic en el cuartel en **Costeo**.

![Historial de labores](agronomo-historial.jpg)

Cada labor con **Fecha**, **Labor**, **Cantidad**, **Responsable**, **Insumos** (cantidad y costo), **Ubicación** y **Costo**. Se filtra por **Desde** y **Hasta**.

### Inteligencia agronómica

En **Inteligencia**, primero elegís **Finca** y **Cuartel**.

**Comparar campañas:** elegí **Campaña A** y **Campaña B**. La tabla compara kilos, costos, costo por hectárea, ingresos y margen bruto con su **Variación**, y debajo las condiciones que midieron los sensores en cada período.

![Comparar campañas](agronomo-comparacion.jpg)

**Correlación:** elegí el **Sensor** y el período. Se muestra el **coeficiente de Pearson** (entre -1 y 1) con su interpretación, cuántos días con datos hubo y los dos gráficos: la medición del sensor y el costo diario del cuartel. Cerca de 1, cuando sube la medición sube el costo; cerca de -1, una sube y el otro baja; cerca de 0, no hay relación. Si aparece el aviso de **datos insuficientes**, ampliá el período; si no se puede calcular, el coeficiente se muestra como **—**.

![Correlación](agronomo-correlacion.jpg)

**Recomendaciones:** sugerencias generadas con el histórico del cuartel (por ejemplo, humedad de suelo baja sostenida), con su **severidad**, el patrón detectado y la acción sugerida. Necesita **al menos 30 días de datos**; si faltan, la pantalla dice cuántos. Para cerrar una, hacé clic en **Resolver**, escribí una nota opcional y elegí **Aplicada** o **Descartar**. Una recomendación resuelta no se reabre: si la condición vuelve, se genera otra.

![Recomendaciones](agronomo-recomendaciones.jpg)

> Ninguna pantalla exporta a Excel o PDF. Lo único imprimible es el detalle del remito.

## La app móvil

Tu rol también puede usar la **app móvil de TerraVid** para registrar labores, insumos y pesajes en el campo, incluso sin señal. Entrás con el mismo email y contraseña. La app tiene su propio manual en la pestaña **Ayuda**, que se puede leer sin conexión.

Lo que se registra desde la app llega solo a la Web cuando el teléfono se sincroniza: lo ves en el historial de cada cuartel, en el costeo y en los pesajes.

## Preguntas frecuentes

**No veo el botón para dar de baja un insumo, una labor o un cuartel.**
Dar de baja lo hace el Propietario. Vos podés crear y editar.

**Quiero cambiar la tarifa de una cuadrilla.**
Las tarifas las fija el Propietario. Desde **$ Tarifas** ves cuál rige.

**El dashboard muestra "Registros con error de sync".**
Hay labores del campo sin costo vigente en su fecha. Cargá los costos antes de que empiecen los trabajos; para las que ya fallaron, pedí ayuda en **Ayuda → Pedir ayuda**.

**Recomendaciones dice que faltan días de histórico.**
Se necesitan al menos 30 días con datos de sensores en la finca del cuartel.

**La correlación muestra "—" o el aviso de datos insuficientes.**
Hacen falta al menos 7 días con lecturas del sensor y labores en el cuartel. Ampliá el período.

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
