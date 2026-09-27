import { onValue, ref, type Unsubscribe } from 'firebase/database'
import { baseDatosFirebase } from '../../shared/firebase/baseDatos'

/** Nodo que publica el servidor: un hijo por ambulancia que alguna vez reportó, con su id como clave. */
const NODO_POSICIONES = 'posiciones'

/** Nodo de los incidentes abiertos. Acá solo interesa que cambió, no lo que dice. */
const NODO_INCIDENTES_ABIERTOS = 'incidentes-abiertos'

const SIN_ESCUCHA: Unsubscribe = () => {}

/**
 * Sin la configuración de Firebase en .env.local no hay a qué conectarse y el SDK lanza al pedir la base. Se
 * devuelve null en vez de dejar que reviente: la pantalla se sostiene con lo que llega por REST, que es el
 * estado de cada unidad, y avisa que las posiciones no están llegando.
 */
function referenciaA(ruta: string) {
  try {
    return ref(baseDatosFirebase(), ruta)
  } catch {
    return null
  }
}

/**
 * Lo que el servidor escribe en `posiciones/{ambulanciaId}`. `en` es ISO-8601 y puede faltar: la publicación
 * lo omite cuando la posición llegó sin momento.
 */
export type PosicionPublicada = {
  latitud: number
  longitud: number
  en?: string
}

/** Última posición conocida de cada ambulancia, por su id. */
export type PosicionesPorAmbulancia = Record<number, PosicionPublicada>

/**
 * Escucha el nodo completo de posiciones.
 *
 * Ojo: el nodo nunca se limpia. Guarda la última posición de toda ambulancia que alguna vez reportó, incluso
 * de las que hace semanas cerraron turno. Por eso lo que sale de acá no se pinta tal cual: manda la lista de
 * `/ambulancias` y esto solo responde "dónde estaba la unidad tal" (ver `cruzarConLaFlota`).
 */
export function escucharPosiciones(
  alRecibir: (posiciones: PosicionesPorAmbulancia) => void,
  alFallar: () => void,
): Unsubscribe {
  const nodo = referenciaA(NODO_POSICIONES)
  if (!nodo) {
    alFallar()
    return SIN_ESCUCHA
  }

  return onValue(
    nodo,
    (snapshot) => {
      const posiciones: PosicionesPorAmbulancia = {}
      // Los hijos tienen ids numéricos como clave: se recorren con forEach para no recibir un arreglo con huecos.
      snapshot.forEach((hijo) => {
        const id = Number(hijo.key)
        const valor = hijo.val() as Partial<PosicionPublicada> | null
        if (Number.isInteger(id) && esPosicion(valor)) {
          posiciones[id] = valor
        }
      })
      alRecibir(posiciones)
    },
    alFallar,
  )
}

/** Un hijo a medio escribir o de una versión vieja no debe terminar como un pin en el medio del océano. */
function esPosicion(valor: Partial<PosicionPublicada> | null): valor is PosicionPublicada {
  return (
    valor !== null &&
    typeof valor.latitud === 'number' &&
    typeof valor.longitud === 'number' &&
    Math.abs(valor.latitud) <= 90 &&
    Math.abs(valor.longitud) <= 180
  )
}

/**
 * Avisa cuando se mueve el nodo de incidentes abiertos, sin leer lo que trae: que aparezca, cambie o se cierre
 * un incidente es señal casi segura de que alguna unidad cambió de estado, y el estado no viaja por Firebase.
 * Sirve para adelantarse al refresco periódico de `/ambulancias`.
 *
 * La primera respuesta no se cuenta: Firebase entrega el valor actual al suscribirse y eso no es un cambio.
 */
export function escucharAvisoDeIncidentes(alCambiar: () => void): Unsubscribe {
  const nodo = referenciaA(NODO_INCIDENTES_ABIERTOS)
  if (!nodo) {
    return SIN_ESCUCHA
  }

  let primera = true
  return onValue(nodo, () => {
    if (primera) {
      primera = false
      return
    }
    alCambiar()
  })
}
