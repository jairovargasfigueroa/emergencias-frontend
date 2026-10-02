import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase, ref, type Database, type DatabaseReference, type Unsubscribe } from 'firebase/database'

/** Configuración de la app web del proyecto de Firebase. Se completa en .env.local. */
const configuracion = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Realtime Database. El panel solo escucha: el único que escribe es el servidor. */
export function baseDatosFirebase(): Database {
  const app = getApps().length > 0 ? getApp() : initializeApp(configuracion)
  return getDatabase(app)
}

/** Lo que devuelve una escucha que no llegó a empezar: no hay nada que cortar. */
export const SIN_ESCUCHA: Unsubscribe = () => {}

/**
 * Sin la configuración de Firebase en .env.local no hay a qué conectarse y el SDK lanza al pedir la base. Se
 * devuelve null en vez de dejar que reviente: cada pantalla se sostiene con lo que llega por REST y avisa, si le
 * importa, que lo en vivo no está llegando.
 */
export function referenciaA(ruta: string): DatabaseReference | null {
  try {
    return ref(baseDatosFirebase(), ruta)
  } catch {
    return null
  }
}
