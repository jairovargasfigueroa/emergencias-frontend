/**
 * "850 m" por debajo de un kilómetro; "1,2 km" o "15 km" por encima. Con la coma decimal y el mismo redondeo que
 * las apps, para que una distancia se lea igual en todas partes.
 */
export function textoDistancia(metros: number): string {
  const redondeados = Math.round(metros / 10) * 10
  if (redondeados < 1000) {
    return `${redondeados} m`
  }
  const kilometros = metros / 1000
  return kilometros < 10 ? `${kilometros.toFixed(1).replace('.', ',')} km` : `${Math.round(kilometros)} km`
}
