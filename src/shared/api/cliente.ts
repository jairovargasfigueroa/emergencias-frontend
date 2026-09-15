/** Error de validación de un campo, tal como lo envía el backend. */
export type ErrorDeCampo = {
  campo: string
  mensaje: string
}

/** Cuerpo de error del backend: Problem Details con `codigo` y datos extra según el caso. */
export type CuerpoError = {
  status: number
  detail?: string
  codigo?: string
  errores?: ErrorDeCampo[]
  [propiedad: string]: unknown
}

export class ErrorApi extends Error {
  readonly status: number
  readonly codigo: string | undefined
  readonly cuerpo: CuerpoError

  constructor(cuerpo: CuerpoError) {
    super(cuerpo.detail ?? 'Ocurrió un error inesperado.')
    this.name = 'ErrorApi'
    this.status = cuerpo.status
    this.codigo = cuerpo.codigo
    this.cuerpo = cuerpo
  }
}

/** En desarrollo el proxy de Vite reenvía `/api` al backend. */
const URL_BASE: string = import.meta.env.VITE_API_URL ?? '/api'

type Metodo = 'GET' | 'POST'

type OpcionesPedido = {
  metodo?: Metodo
  cuerpo?: unknown
  signal?: AbortSignal
}

async function pedir<T>(ruta: string, { metodo = 'GET', cuerpo, signal }: OpcionesPedido = {}): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers:
        cuerpo === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ErrorApi({ status: 0, detail: 'No se pudo conectar con el servidor.' })
  }

  if (!respuesta.ok) {
    throw new ErrorApi(await leerCuerpoError(respuesta))
  }
  if (respuesta.status === 204) {
    return undefined as T
  }
  return (await respuesta.json()) as T
}

async function leerCuerpoError(respuesta: Response): Promise<CuerpoError> {
  try {
    const cuerpo = (await respuesta.json()) as Partial<CuerpoError>
    return { ...cuerpo, status: respuesta.status }
  } catch {
    return { status: respuesta.status, detail: 'El servidor respondió con un error.' }
  }
}

export const api = {
  get: <T>(ruta: string, signal?: AbortSignal) => pedir<T>(ruta, { signal }),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>(ruta, { metodo: 'POST', cuerpo }),
}

/** Devuelve el código del error de la API, si lo tiene. */
export function codigoDeError(error: unknown): string | undefined {
  return error instanceof ErrorApi ? error.codigo : undefined
}

/** Mensaje listo para mostrar al usuario a partir de cualquier error. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) {
    return error.message
  }
  return 'Ocurrió un error inesperado.'
}
