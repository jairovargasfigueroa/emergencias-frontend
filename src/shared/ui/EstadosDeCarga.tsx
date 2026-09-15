import { Button, Paragraph, Spinner, XStack, YStack } from 'tamagui'
import { mensajeDeError } from '../api/cliente'

export function Cargando({ texto }: { texto: string }) {
  return (
    <XStack items="center" justify="center" gap={10} py={48}>
      <Spinner size="small" color="$primario" />
      <Paragraph color="$textoSecundario" fontSize={14}>
        {texto}
      </Paragraph>
    </XStack>
  )
}

export function ErrorAlCargar({ error, onReintentar }: { error: unknown; onReintentar: () => void }) {
  return (
    <YStack items="center" gap={12} py={48} px={24}>
      <Paragraph color="$texto" fontSize={15} fontWeight="500" text="center">
        {mensajeDeError(error)}
      </Paragraph>
      <Button size="$3" variant="outlined" onPress={onReintentar}>
        Reintentar
      </Button>
    </YStack>
  )
}

/** Junta los errores de un campo de TanStack Form: con Zod llegan como objetos con `message`. */
export function textoDeErrores(errores: readonly unknown[]): string | null {
  const mensajes = errores
    .map((error) => {
      if (typeof error === 'string') {
        return error
      }
      if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message)
      }
      return null
    })
    .filter((mensaje): mensaje is string => Boolean(mensaje))
  return mensajes.length > 0 ? mensajes.join(' ') : null
}

export function MensajeDeCampo({ texto }: { texto: string | null }) {
  if (!texto) {
    return null
  }
  return (
    <Paragraph role="alert" color="$primarioPresionado" fontSize={12} lineHeight={16}>
      {texto}
    </Paragraph>
  )
}
