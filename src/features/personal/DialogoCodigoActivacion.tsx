import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Paragraph, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { IconoCheck, IconoCopiar } from '../../shared/ui/iconos'
import type { Paramedico } from './api'
import { generarCodigoActivacionMutation, personalKeys } from './queries'

type Props = {
  paramedico: Paramedico
  onCerrar: () => void
}

/**
 * El código con que el paramédico activa su app: la primera vez, en un teléfono nuevo o cuando olvidó su PIN o se le
 * bloqueó. La central se lo entrega en persona, como la credencial a quien entra a trabajar, y él lo usa una sola vez
 * para crear el PIN que le piden al iniciar cada turno.
 *
 * Se genera al confirmar y no al abrir el diálogo, porque cada código nuevo anula al anterior que no haya usado. Y
 * solo se ve acá: el servidor lo guarda cifrado y no lo puede volver a mostrar.
 *
 * Se monta solo al abrirlo, así cada vez arranca sin código.
 */
export function DialogoCodigoActivacion({ paramedico, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const generar = useMutation(generarCodigoActivacionMutation())
  const [copiado, setCopiado] = useState(false)

  const codigo = generar.data
  const primerNombre = paramedico.nombreCompleto.split(/\s+/)[0] ?? paramedico.nombreCompleto

  // La lista se recarga al cerrar y no apenas sale el código: su fila no cambia hasta que él lo usa, y puede estar
  // usándolo mientras se le dicta. Al cerrar ya se ve cómo quedó.
  function cerrar() {
    void queryClient.invalidateQueries({ queryKey: personalKeys.todos })
    onCerrar()
  }

  function generarCodigo() {
    generar.mutate(paramedico.id, {
      onError: (error) => {
        // El backend dice qué lo frena, por ejemplo que lo acaban de desactivar: se muestra tal cual, y al cerrar la
        // lista se recarga con cómo está.
        cerrar()
        toast.show('No se pudo generar el código', { message: mensajeDeError(error) })
      },
    })
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      // Sin acceso al portapapeles el código sigue a la vista: se puede seleccionar a mano o dictar.
      toast.show('No se pudo copiar el código', { message: 'Selecciónalo en la pantalla o díctaselo.' })
    }
  }

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : cerrar())}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={440}
          maxW="92%"
          p={24}
          gap={20}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -12, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: 8, scale: 0.97 }}
        >
          <YStack gap={6}>
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              Código de activación para {paramedico.nombreCompleto}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={21}>
              {codigo
                ? 'Entrégaselo en persona o díctaselo por teléfono. Sirve una sola vez. Si pierde el teléfono u olvida su PIN, genera uno nuevo.'
                : `Con el código, ${primerNombre} activa su app y crea el PIN que le van a pedir al iniciar cada turno. Si le habías dado otro que todavía no usó, ese deja de servir.`}
            </Dialog.Description>
          </YStack>

          {codigo ? (
            <>
              <YStack items="center" gap={6} py={20} px={16} rounded={12} bg="$fondo">
                {/* Un clic lo selecciona entero, por si hay que copiarlo a mano. */}
                <Text
                  fontFamily="$mono"
                  fontSize={36}
                  lineHeight={44}
                  fontWeight="600"
                  letterSpacing={4}
                  color="$texto"
                  userSelect="all"
                >
                  {codigo.codigo}
                </Text>
                <Text fontSize={13} lineHeight={18} color="$textoSecundario">
                  Vence el {fechaHoraCorta(codigo.venceEn)}
                </Text>
              </YStack>

              <XStack gap={8} justify="flex-end">
                <Button
                  size="$4"
                  variant="outlined"
                  icon={copiado ? <IconoCheck size={16} /> : <IconoCopiar size={16} />}
                  onPress={() => {
                    void copiar(codigo.codigo)
                  }}
                >
                  {copiado ? 'Copiado' : 'Copiar código'}
                </Button>
                <BotonPrimario size="$4" onPress={cerrar}>
                  <Button.Text color="$primarioTexto">Listo</Button.Text>
                </BotonPrimario>
              </XStack>
            </>
          ) : (
            <>
              {/* Solo quien ya activó su app tiene un teléfono que puede quedar afuera. */}
              {paramedico.activado ? (
                <XStack px={12} py={10} rounded={10} bg="$enAtencionTinte">
                  <Paragraph fontSize={13} lineHeight={19} color="$enAtencionTexto">
                    {primerNombre} ya activó su app. Un código nuevo sirve para un teléfono nuevo o un PIN olvidado.
                    Cuando lo use, su app va a funcionar solo en el teléfono donde lo ingrese: si es otro, el que tiene
                    ahora deja de servir.
                  </Paragraph>
                </XStack>
              ) : null}

              <XStack gap={8} justify="flex-end">
                <Button size="$4" variant="outlined" disabled={generar.isPending} onPress={cerrar}>
                  Cancelar
                </Button>
                <BotonPrimario
                  size="$4"
                  disabled={generar.isPending}
                  opacity={generar.isPending ? 0.6 : 1}
                  icon={generar.isPending ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                  onPress={generarCodigo}
                >
                  <Button.Text color="$primarioTexto">Generar código</Button.Text>
                </BotonPrimario>
              </XStack>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
