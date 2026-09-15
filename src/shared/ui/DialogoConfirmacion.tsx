import type { ReactNode } from 'react'
import { AlertDialog, Button, Spinner, XStack, YStack } from 'tamagui'
import { BotonPrimario } from './botones'
import { IconoApagar, IconoAviso } from './iconos'

type Props = {
  abierto: boolean
  onCambiarAbierto: (abierto: boolean) => void
  titulo: string
  descripcion: ReactNode
  textoConfirmar: string
  onConfirmar: () => void
  pendiente?: boolean
  /** `peligro` para bajas; `aviso` para cambios que conviene revisar, como una reasignación. */
  tono?: 'peligro' | 'aviso'
}

/**
 * Confirmación de una acción asíncrona. El botón de confirmar no cierra el diálogo por su cuenta: lo cierra quien lo
 * usa cuando la acción termina bien.
 */
export function DialogoConfirmacion({
  abierto,
  onCambiarAbierto,
  titulo,
  descripcion,
  textoConfirmar,
  onConfirmar,
  pendiente = false,
  tono = 'peligro',
}: Props) {
  return (
    <AlertDialog open={abierto} onOpenChange={onCambiarAbierto}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          bg="$velo"
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <AlertDialog.Content
          key="content"
          width={420}
          maxW="92%"
          p={24}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -12, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: 8, scale: 0.97 }}
        >
          <YStack gap={20}>
            <XStack
              width={40}
              height={40}
              rounded={999}
              items="center"
              justify="center"
              bg={tono === 'peligro' ? '$primarioTinte' : '$enAtencionTinte'}
            >
              {tono === 'peligro' ? (
                <XStack>
                  <IconoApagar size={20} color="var(--primarioPresionado)" />
                </XStack>
              ) : (
                <XStack>
                  <IconoAviso size={20} color="var(--enAtencionTexto)" />
                </XStack>
              )}
            </XStack>
            <YStack gap={6}>
              <AlertDialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
                {titulo}
              </AlertDialog.Title>
              <AlertDialog.Description color="$textoSecundario" fontSize={14} lineHeight={21}>
                {descripcion}
              </AlertDialog.Description>
            </YStack>
            <XStack gap={8} justify="flex-end">
              <AlertDialog.Cancel asChild>
                <Button size="$3" variant="outlined" disabled={pendiente}>
                  Cancelar
                </Button>
              </AlertDialog.Cancel>
              <BotonPrimario
                size="$3"
                disabled={pendiente}
                opacity={pendiente ? 0.6 : 1}
                icon={pendiente ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                onPress={onConfirmar}
              >
                <Button.Text color="$primarioTexto">{textoConfirmar}</Button.Text>
              </BotonPrimario>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}
