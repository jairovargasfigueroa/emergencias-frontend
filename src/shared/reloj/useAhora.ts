import { useEffect, useState } from 'react'

/**
 * La hora actual, renovada cada `intervaloMs`. Es para los textos que tienen que envejecer solos, como "hace 4 min":
 * sin esto se quedarían clavados hasta la próxima consulta.
 */
export function useAhora(intervaloMs = 1000) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => window.clearInterval(reloj)
  }, [intervaloMs])

  return ahora
}
