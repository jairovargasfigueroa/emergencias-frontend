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
