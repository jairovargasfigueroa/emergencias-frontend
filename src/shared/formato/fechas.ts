const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function dosDigitos(numero: number) {
  return String(numero).padStart(2, '0')
}

/** "10 sep 2026, 19:00" en la hora local del navegador. */
export function fechaHora(iso: string): string {
  const fecha = new Date(iso)
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}, ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

/** "12 sep, 08:30" si es del año en curso; si no, con el año. */
export function fechaHoraCorta(iso: string): string {
  const fecha = new Date(iso)
  if (fecha.getFullYear() !== new Date().getFullYear()) {
    return fechaHora(iso)
  }
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]}, ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

/** Solo la hora, "09:20". Para tablas donde la fecha ya está en el encabezado. */
export function hora(iso: string): string {
  const fecha = new Date(iso)
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

/** "2026-09-29" en la hora local: es como el backend espera el día de la tabla. */
export function comoDia(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

/** "5 s", "4 min", "2 h", "3 d" a partir de segundos ya contados, para cuando los segundos todavía importan. */
export function tiempoDeSegundos(segundos: number): string {
  if (segundos < 60) {
    return `${segundos} s`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  return horas < 24 ? `${horas} h` : `${Math.floor(horas / 24)} d`
}

/** Tiempo desde `iso` hasta `ahora` (en milisegundos): "menos de 1 min", "25 min", "3 h 10 min" o "2 d 5 h". */
export function tiempoTranscurrido(iso: string, ahora: number): string {
  const minutos = Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / 60_000))
  if (minutos < 1) {
    return 'menos de 1 min'
  }
  if (minutos < 60) {
    return `${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    return minutos % 60 === 0 ? `${horas} h` : `${horas} h ${minutos % 60} min`
  }
  const dias = Math.floor(horas / 24)
  return horas % 24 === 0 ? `${dias} d` : `${dias} d ${horas % 24} h`
}
