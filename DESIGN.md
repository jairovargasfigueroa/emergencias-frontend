---
name: SGA · Panel de administración
description: El panel de la central de ambulancias. Callado mientras todo está cubierto; claro y rojo cuando algo pide una decisión.
colors:
  primario: "#D92D20"
  primarioPresionado: "#B42318"
  primarioTinte: "#FDECEA"
  primarioTinteTexto: "#B42318"
  primarioTexto: "#FFFFFF"
  fondo: "#F7F7F8"
  superficie: "#FFFFFF"
  borde: "#E7E7EA"
  bordeFuerte: "#D4D4D8"
  texto: "#18181B"
  textoSecundario: "#71717A"
  textoTenue: "#A1A1AA"
  disponible: "#16A34A"
  disponibleTinte: "#E8F5EC"
  disponibleTexto: "#166534"
  disponibleFuerte: "#15803D"
  enAtencion: "#D97706"
  enAtencionTinte: "#FDF1E3"
  enAtencionTexto: "#B45309"
  enAtencionFuerte: "#B45309"
  fueraServicio: "#6B7280"
  fueraServicioTinte: "#F0F0F2"
  fueraServicioTexto: "#52525B"
  primarioTinteOscuro: "#3A1614"
  primarioTinteTextoOscuro: "#F97066"
  fondoOscuro: "#111114"
  superficieOscuro: "#1A1A1F"
  bordeOscuro: "#2A2A31"
  bordeFuerteOscuro: "#3F3F46"
  textoOscuro: "#F4F4F5"
  textoSecundarioOscuro: "#A1A1AA"
  textoTenueOscuro: "#71717A"
  disponibleTinteOscuro: "#0F2E1C"
  disponibleTextoOscuro: "#4ADE80"
  enAtencionTinteOscuro: "#3A2508"
  enAtencionTextoOscuro: "#FBBF24"
  fueraServicioTinteOscuro: "#27272A"
  fueraServicioTextoOscuro: "#A1A1AA"
typography:
  titulo-pagina:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  titulo-consola:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  titulo-aviso:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  cuerpo:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  dato:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  etiqueta:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
rounded:
  control: "8px"
  opcion: "10px"
  panel: "12px"
  dialogo: "14px"
  pildora: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  pagina: "40px"
components:
  boton-primario:
    backgroundColor: "{colors.primario}"
    textColor: "{colors.primarioTexto}"
    rounded: "{rounded.control}"
    height: "36px"
  boton-primario-hover:
    backgroundColor: "{colors.primarioPresionado}"
    textColor: "{colors.primarioTexto}"
  boton-contorno:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.control}"
    height: "36px"
  insignia-disponible:
    backgroundColor: "{colors.disponibleTinte}"
    textColor: "{colors.disponibleTexto}"
    typography: "{typography.etiqueta}"
    rounded: "{rounded.pildora}"
    height: "24px"
    padding: "0 10px"
  contador:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 12px"
  contador-activo:
    backgroundColor: "{colors.texto}"
    textColor: "{colors.superficie}"
  panel:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.panel}"
  franja-en-alarma:
    backgroundColor: "{colors.primarioTinte}"
    textColor: "{colors.primarioTinteTexto}"
    typography: "{typography.titulo-aviso}"
    rounded: "{rounded.panel}"
  navegacion-activa:
    backgroundColor: "{colors.primarioTinte}"
    textColor: "{colors.primarioTinteTexto}"
    rounded: "{rounded.control}"
    height: "40px"
---

# Design System: SGA · Panel de administración

## Overview

**Creative North Star: "Silencio hasta que importa"**

El panel se mira durante todo un turno, a veces de madrugada, y casi siempre no pasa nada. Por eso está callado: fondos neutros, bordes finos, nada que decore. La interfaz no compite con el trabajo. Cuando algo pide una decisión (un incidente sin unidad, una unidad que perdió la señal), es lo único que levanta la voz: aparece el rojo, crece el texto y cambia el aspecto del bloque entero. Se tiene que notar de reojo, sin leer.

La densidad es de herramienta de trabajo: tablas con muchas filas, datos en columnas fijas, textos de 12 a 14 px. La personalidad está en la precisión: el tiempo que lleva cada cosa siempre a la vista, las placas y las horas en monoespaciada, palabras del oficio y no de sistema. Es un sistema para emergencias: nada de animaciones de adorno, gradientes ni efectos.

**Key Characteristics:**
- Neutros fríos de la escala zinc; un solo color de acento, el rojo de alerta, reservado para lo que pide una decisión.
- Tres colores de estado de la flota (verde, ámbar, gris) que nunca se usan para otra cosa.
- Plano en reposo: superficies con borde de 1 px, sin sombras. Solo lo que flota encima (diálogos, menús) tiene sombra.
- IBM Plex Sans para todo, IBM Plex Mono para datos que se comparan: placas, horas, teléfonos, tiempos.
- Modo claro y oscuro siguiendo al sistema, con los mismos roles en los dos.

## Colors

Neutros fríos casi sin color, un rojo de alerta escaso y tres colores de estado que son vocabulario de la central, no decoración.

### Primary
- **Rojo de alerta** (primario): lo que pide una decisión. Relleno del botón de la acción principal, pines de incidentes sin unidad, punto del contador "Sin señal", borde de la franja en alarma. Nunca para enlaces, teléfonos ni adornos.
- **Rojo de alerta presionado** (primarioPresionado): fondo del botón primario al pasar o presionar. Solo como fondo, debajo de texto blanco.
- **Tinte de alerta** (primarioTinte / primarioTinteOscuro): fondo del encabezado de la franja en alarma, del aviso flotante y del ítem activo del menú.
- **Texto de alerta** (primarioTinteTexto / primarioTinteTextoOscuro): texto rojo sobre la superficie o sobre el tinte. En oscuro es un rojo claro para llegar a 4,5:1; no se reemplaza por `primarioPresionado`.

### Secondary
- **Verde disponible** (disponible, disponibleTinte, disponibleTexto, disponibleFuerte): unidad disponible y el visto bueno de "Todo cubierto". El fuerte es para rellenos con texto blanco encima, como los pines.
- **Ámbar en atención** (enAtencion, enAtencionTinte, enAtencionTexto, enAtencionFuerte): unidad atendiendo, y el tiempo de un paso que ya se estiró.
- **Gris fuera de servicio** (fueraServicio, fueraServicioTinte, fueraServicioTexto): unidad parada o sin turno.

### Neutral
- **Fondo** (fondo / fondoOscuro): el lienzo de la página y el encabezado de tablas y paneles.
- **Superficie** (superficie / superficieOscuro): tarjetas, tablas, diálogos y el menú lateral.
- **Borde y borde fuerte** (borde, bordeFuerte y sus versiones oscuras): separación entre filas y contorno de paneles; el fuerte para controles y bordes al pasar el mouse.
- **Texto, secundario y tenue** (texto, textoSecundario, textoTenue y sus versiones oscuras): el tenue no lleva información; para texto que se tiene que leer, como "Sin tripulación", va el secundario.

### Named Rules
**The Red Means Decide Rule.** El rojo de alerta aparece solo donde el operador tiene que decidir algo. Si un elemento rojo no pide una decisión, va en otro color.

**The State Colors Are Vocabulary Rule.** Verde, ámbar y gris significan disponible, en atención y fuera de servicio en toda la app. No se reutilizan para éxito, advertencia o deshabilitado genéricos.

## Typography

**Body Font:** IBM Plex Sans (con system-ui, Segoe UI, Roboto, Arial)
**Label/Mono Font:** IBM Plex Mono (con ui-monospace, Consolas)

**Character:** Una sola familia para títulos, botones y datos: técnica sin ser fría. La monoespaciada no es disfraz de "sistema": se usa solo donde hay que comparar caracteres en columna.

### Hierarchy
- **Título de página** (600, 24px, 32px): el nombre de cada sección, en el encabezado.
- **Título de consola** (600, 20px, 28px): el del Centro de control, más chico a propósito para que la franja de problemas pese más.
- **Título de aviso** (600, 18px, 24px): el titular de la franja y los títulos de los diálogos.
- **Cuerpo** (400, 14px, 20px): textos de diálogos y descripciones.
- **Dato** (400, 13px, 18px): el contenido de filas, la bitácora y las descripciones de problemas.
- **Etiqueta** (500, 12px, 16px): encabezados de columna, tipos, insignias y textos de apoyo.
- **Mono** (500, 13–14px): placas, horas, teléfonos y tiempos transcurridos. Solo se carga el peso 500.

### Named Rules
**The Alarm Outweighs The Title Rule.** En una pantalla de trabajo, lo que está sin resolver pesa más que el título de la página: más color, más contraste y el bloque entero cambia, aunque el título siga siendo más grande en px.

## Layout

El panel tiene un menú lateral fijo y el contenido a la derecha, con márgenes que se achican con la pantalla: 40 px en monitores grandes, 32 en laptops (de 1280 a 1535 px) y 24 por debajo de 1280. Tiene que funcionar bien desde 1024 px de ancho; por debajo se puede usar, pero no se cuida.

- **Menú lateral:** 248 px con nombres desde 1280 px. Por debajo se pliega a una columna de íconos de 80 px; los nombres siguen en `title` y `aria-label`.
- **Pantallas de listado** (Flota, Personal, Incidentes, Traslados): encabezado y tabla que crece con su contenido; la página scrollea.
- **Pantallas de consola** (Centro de control): ocupan justo el alto de la ventana y no scrollean. Arriba lo que está sin resolver, a la izquierda la tabla y a la derecha el mapa con la bitácora. Los paneles reparten el alto con flex y cada uno scrollea por dentro.
- **Tablas:** columnas de ancho fijo para lo que se compara y una flexible con ancho mínimo. Si la tabla no entra, scrollea de costado; nunca se cortan las celdas. Las columnas que se deducen de otra o están en el detalle se esconden por debajo de 1280 px.
- **Ritmo:** 24 px entre bloques de una página, 16 entre paneles de una consola, 8 y 12 dentro de un panel. Las filas de tabla miden al menos 60 px, con 24 px de relleno lateral hasta el texto.

### Named Rules
**The Never Clip Data Rule.** Si no entra, se scrollea o se esconde una columna prescindible, a propósito. Un dato no puede desaparecer porque se achicó la ventana.

## Elevation & Depth

Plano en reposo. La profundidad se marca con bordes de 1 px y con el cambio entre fondo y superficie, no con sombras. Solo lo que flota encima del contenido tiene sombra: los diálogos (con la elevación de Tamagui) y los menús de acciones (`0 4px 16px rgba(15, 23, 42, 0.18)`).

### Named Rules
**The Only Floaters Cast Shadows Rule.** Si un elemento no tapa a otro, no lleva sombra. Las tarjetas y los paneles se separan con borde.

## Shapes

Esquinas apenas redondeadas y una escala corta según el tamaño del elemento: 8 px para controles (botones, contadores, ítems del menú), 10 px para opciones elegibles y avisos dentro de diálogos, 12 px para paneles y tablas, y 14 px para diálogos. Las insignias de estado y los puntos de color son píldoras (999 px). Bordes de 1 px en todo.

## Components

### Buttons
- **Shape:** esquinas de control (8px), 36 px de alto.
- **Primary:** relleno rojo de alerta con texto blanco; uno solo por pantalla o diálogo, para la acción principal.
- **Hover / Focus:** el primario pasa a rojo presionado; el foco con teclado se ve como contorno.
- **Contorno:** superficie con borde y texto normal. Es el botón de casi todas las acciones de fila: Ver, Enviar unidad, Asignar.

### Chips
- **Style:** los contadores de la franja son también filtros: superficie con borde, punto de color de estado, número en semibold y etiqueta en secundario.
- **State:** el activo va invertido (fondo de texto, letras de superficie), para que se note de lejos que la tabla está filtrada. Son `<button>` reales.

### Cards / Containers
- **Corner Style:** panel (12px).
- **Background:** superficie sobre el fondo de la página.
- **Shadow Strategy:** ninguna; ver Elevation & Depth.
- **Border:** 1 px de borde; en alarma, 1 px de rojo de alerta con el encabezado en tinte.
- **Internal Padding:** 16 px a los lados, 10 a 12 arriba y abajo.

### Inputs / Fields
- **Style:** el Input de Tamagui en tamaño $4, con el tema del panel; los códigos y placas en monoespaciada.
- **Error / Disabled:** el mensaje de campo va debajo, en texto de alerta, con `role="alert"`.

### Navigation
- **Style:** columna lateral con ícono y nombre, 40 px de alto por ítem. El activo con tinte de alerta y texto de alerta en semibold. Plegada por debajo de 1280 px: solo íconos, centrados.

### Franja de problemas
La pieza que define el sistema. Arriba, el titular de la situación y los contadores. Debajo, una fila por problema con columnas fijas: tipo, tiempo y descripción (lo único que se corta), y las acciones a la derecha. Del que más espera al que menos. En alarma cambia la franja entera (borde rojo y encabezado en tinte) y su titular se anuncia a los lectores de pantalla.

## Do's and Don'ts

### Do:
- **Do** reservar el rojo de alerta para lo que pide una decisión, y usar `primarioTinteTexto` para texto rojo en los dos temas.
- **Do** mostrar el tiempo de lo urgente al principio de la fila y en monoespaciada.
- **Do** usar los íconos del panel (`shared/ui/iconos.tsx`) en vez de caracteres como ⚠ o ✓.
- **Do** dar a cada control interactivo un elemento real (`<button>`, `<a>`) y foco visible con teclado.
- **Do** probar cada pantalla a 1024 y 1280 px, en claro y en oscuro.

### Don't:
- **Don't** usar los comandos `bolder`, `delight`, `overdrive`, `animate` ni `colorize` de Impeccable: es un sistema para emergencias.
- **Don't** poner enlaces ni teléfonos en rojo: van en texto normal o secundario, subrayados.
- **Don't** usar `textoTenue` para algo que haya que leer: no llega a 4,5:1.
- **Don't** agregar sombras a paneles o tarjetas, ni gradientes, ni bordes de color de más de 1 px a un costado.
- **Don't** dejar que una tabla corte celdas: scroll lateral o columna escondida a propósito.
