import { api } from '../../shared/api/cliente'
import type { SesionAdmin } from '../../shared/sesion/almacen'

/** `IngresoAdminRequest` del backend. */
export type Credenciales = {
  correo: string
  clave: string
}

export const sesionApi = {
  /** Única ruta abierta del panel: se llama sin token porque todavía no hay ninguno. */
  ingresar: (credenciales: Credenciales) => api.post<SesionAdmin>('/auth/admin', credenciales, { sinToken: true }),
}
