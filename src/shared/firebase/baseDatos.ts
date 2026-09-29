import { getApp, getApps, initializeApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

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
