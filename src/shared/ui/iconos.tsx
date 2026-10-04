import type { ReactNode } from 'react'

export type PropsIcono = {
  size?: number
  /** Color CSS. Si se omite, el ícono toma el color del texto que lo rodea. */
  color?: string
}

function Icono({ size = 16, color, children }: PropsIcono & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={color ? { color } : undefined}
    >
      {children}
    </svg>
  )
}

export function IconoAmbulancia(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M2.5 7h11v9.5h-11z" />
      <path d="M13.5 10.5h4l3 3v3h-7" />
      <circle cx="6.5" cy="17.5" r="1.75" />
      <circle cx="16.5" cy="17.5" r="1.75" />
      <path d="M8 9.5v4.5M5.75 11.75h4.5" />
    </Icono>
  )
}

export function IconoPersonas(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17.6 14.3c1.6.7 2.6 2.3 2.9 4.7" />
    </Icono>
  )
}

export function IconoIncidentes(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M7 17v-5a5 5 0 0 1 10 0v5" />
      <path d="M5 17h14v3.5H5z" />
      <path d="M12 2.5v2M3.5 6l1.5 1.5M20.5 6L19 7.5" />
    </Icono>
  )
}

/** Un punto de origen, un recorrido y un destino: el traslado de un lado al otro. */
export function IconoTraslados(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="5.5" r="2.5" />
      <path d="M8 18.5h5a3.5 3.5 0 0 0 0-7h-2a3.5 3.5 0 0 1 0-7h5" />
    </Icono>
  )
}

/** Una unidad emitiendo: la señal en vivo que mira el centro de control. */
export function IconoMonitoreo(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="1.8" />
      <path d="M8.82 15.18a4.5 4.5 0 0 1 0-6.36" />
      <path d="M15.18 8.82a4.5 4.5 0 0 1 0 6.36" />
      <path d="M6.34 17.66a8 8 0 0 1 0-11.32" />
      <path d="M17.66 6.34a8 8 0 0 1 0 11.32" />
    </Icono>
  )
}

export function IconoMas(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icono>
  )
}

export function IconoHistorial(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </Icono>
  )
}

export function IconoLlave(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
    </Icono>
  )
}

export function IconoReactivar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </Icono>
  )
}

export function IconoApagar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M12 3v8" />
      <path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
    </Icono>
  )
}

/** Una puerta y una flecha que sale: el turno que se termina. */
export function IconoFinDeTurno(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </Icono>
  )
}

export function IconoReasignar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M7 7h12l-3.5-3.5" />
      <path d="M17 17H5l3.5 3.5" />
    </Icono>
  )
}

export function IconoAsignar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" />
      <path d="M18.5 8v6M15.5 11h6" />
    </Icono>
  )
}

/** Los tres puntos que abren el menú de acciones de una fila. */
export function IconoAcciones(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Icono>
  )
}

export function IconoEditar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </Icono>
  )
}

/** El contrario de IconoAsignar: la misma persona, pero restándole la unidad. */
export function IconoQuitar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" />
      <path d="M15.5 11h6" />
    </Icono>
  )
}

/**
 * Una llave de puerta: el código con que el paramédico activa su app en un teléfono. `IconoLlave` es otra: la llave
 * de taller de "Fuera de servicio".
 */
export function IconoAcceso(props: PropsIcono) {
  return (
    <Icono {...props}>
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8L20 3" />
      <path d="M17 6l2.5 2.5" />
      <path d="M14.5 8.5l2 2" />
    </Icono>
  )
}

export function IconoCerrar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icono>
  )
}

export function IconoAviso(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Icono>
  )
}

/** Auricular de teléfono: llamar a la tripulación. */
export function IconoTelefono(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M5 4h3.5l1.75 4.5-2.25 1.5a11 11 0 0 0 6 6l1.5-2.25L20 15.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4z" />
    </Icono>
  )
}

export function IconoCheck(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M6 12.5l4 4L18 8.5" />
    </Icono>
  )
}

/** Dos hojas encimadas: copiar al portapapeles. */
export function IconoCopiar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </Icono>
  )
}

export function IconoActualizar(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M21.35 5.2v5.1h-5.1M2.65 18.8v-5.1h5.1" />
      <path d="M4.8 9.45a7.65 7.65 0 0 1 12.6-2.85l3.95 3.7M2.65 13.7l3.95 3.7a7.65 7.65 0 0 0 12.6-2.85" />
    </Icono>
  )
}

export function IconoAnterior(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Icono>
  )
}

export function IconoSiguiente(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icono>
  )
}

/** Una hoja con renglones y un destello: el resumen que arma la IA. Sin color propio, para no sugerir gravedad. */
export function IconoResumenIa(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M13 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V11" />
      <path d="M8 12.5h8M8 16h5" />
      <path d="M18 2.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </Icono>
  )
}
