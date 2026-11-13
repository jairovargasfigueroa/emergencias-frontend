import { fechaHora } from '../../shared/formato/fechas'
import { TEXTO_ESTADO_INCIDENTE } from '../incidentes/textos'
import { TEXTO_ESTADO_TRASLADO } from '../traslados/textos'
import type { Medida, ReporteDeOperacion } from './api'

/** Excel en español separa con punto y coma; así el archivo se abre en columnas sin importar nada. */
const SEPARADOR = ';'

function celda(valor: string | number | null) {
  if (valor === null) {
    return ''
  }
  const texto = String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

function fila(...valores: (string | number | null)[]) {
  return valores.map(celda).join(SEPARADOR)
}

/** Minutos con un decimal: es lo que se lee en una planilla. Vacío si no hubo casos. */
function minutos(segundos: number | null) {
  return segundos === null ? null : (segundos / 60).toFixed(1).replace('.', ',')
}

function medida(nombre: string, m: Medida) {
  return fila(nombre, m.medidos, minutos(m.promedioSegundos), minutos(m.medianaSegundos))
}

/**
 * PB-22: el reporte en CSV, con el período y la fecha de generación arriba, y el criterio de cálculo al final para
 * que quien lo abra sepa cómo se contó.
 */
export function reporteComoCsv(r: ReporteDeOperacion): string {
  const lineas = [
    fila('Reporte de operación'),
    fila('Período', `${r.desde} a ${r.hasta}`),
    fila('Zona horaria', r.zona),
    fila('Generado', fechaHora(r.generadoEn)),
    '',
    fila('Emergencias por estado', 'Cantidad'),
    ...Object.entries(r.emergencias.porEstado).map(([estado, n]) =>
      fila(TEXTO_ESTADO_INCIDENTE[estado as keyof typeof TEXTO_ESTADO_INCIDENTE], n),
    ),
    fila('Total', r.emergencias.total),
    '',
    fila('Traslados por estado', 'Cantidad'),
    ...Object.entries(r.traslados.porEstado).map(([estado, n]) =>
      fila(TEXTO_ESTADO_TRASLADO[estado as keyof typeof TEXTO_ESTADO_TRASLADO], n),
    ),
    fila('Total', r.traslados.total),
    '',
    fila('Tiempos de emergencia', 'Casos medidos', 'Promedio (min)', 'Mediana (min)'),
    medida('Hasta que una unidad lo tomó', r.tiemposDeEmergencia.hastaLaToma),
    medida('Tiempo de respuesta (hasta la llegada)', r.tiemposDeEmergencia.hastaLaLlegada),
    fila('Sin unidad', r.tiemposDeEmergencia.sinUnidad),
    fila('Sin llegada registrada', r.tiemposDeEmergencia.sinLlegada),
    '',
    fila('Puntualidad de traslados', 'Cantidad'),
    fila('A tiempo', r.puntualidadDeTraslados.aTiempo),
    fila('Tarde', r.puntualidadDeTraslados.tarde),
    fila('Sin dato', r.puntualidadDeTraslados.sinDato),
    '',
    fila('Día', 'Emergencias', 'Traslados'),
    ...r.porDia.map((d) => fila(d.dia, d.emergencias, d.traslados)),
    '',
    fila('Unidad', 'Emergencias', 'Traslados', 'Toma a llegada: casos', 'Promedio (min)', 'Mediana (min)'),
    ...r.porUnidad.map((u) =>
      fila(
        u.placa,
        u.emergencias,
        u.traslados,
        u.hastaLaLlegada.medidos,
        minutos(u.hastaLaLlegada.promedioSegundos),
        minutos(u.hastaLaLlegada.medianaSegundos),
      ),
    ),
    '',
    fila('Cómo se calculó'),
    ...r.criterio.map((frase) => fila(frase)),
  ]
  // El BOM hace que Excel lea bien las tildes.
  return '﻿' + lineas.join('\r\n')
}

export function descargarCsv(r: ReporteDeOperacion) {
  const archivo = new Blob([reporteComoCsv(r)], { type: 'text/csv;charset=utf-8' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(archivo)
  enlace.download = `reporte-operacion_${r.desde}_${r.hasta}.csv`
  enlace.click()
  // Se libera después: si se suelta en el acto, algunos navegadores cortan la descarga.
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1_000)
}
