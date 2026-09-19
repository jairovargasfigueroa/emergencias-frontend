/** `SesionResponse.Admin` del backend: el token con el que se llama a la API y quién entró. */
export type SesionAdmin = {
  token: string
  id: number
  nombreCompleto: string
  correo: string
}

const CLAVE_SESION = 'sga.sesion'

/** Administrador con sesión abierta en este navegador, o `null`. */
export function leerSesion(): SesionAdmin | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION)
    return guardada ? (JSON.parse(guardada) as SesionAdmin) : null
  } catch {
    // En modo privado el navegador puede negar el almacenamiento: se trabaja sin sesión recordada.
    return null
  }
}

export function guardarSesion(sesion: SesionAdmin) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  } catch {
    // Sin almacenamiento la sesión dura lo que la pestaña.
  }
}

export function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Nada que borrar.
  }
}

/** Token de la sesión abierta. Lo lee el cliente HTTP en cada petición. */
export function tokenActual(): string | null {
  return leerSesion()?.token ?? null
}
