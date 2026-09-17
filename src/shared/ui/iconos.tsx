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

export function IconoCheck(props: PropsIcono) {
  return (
    <Icono {...props}>
      <path d="M6 12.5l4 4L18 8.5" />
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
