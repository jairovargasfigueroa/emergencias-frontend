import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { Button, H2, Paragraph, Text, XStack, YStack } from 'tamagui'
import { ErrorApi } from '../../shared/api/cliente'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoAnterior } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { TEXTO_ESTADO_ALERTA, TEXTO_ESTADO_INCIDENTE, TEXTO_MOTIVO_CANCELACION_ALERTA } from '../incidentes/textos'
import type { HistorialDeCiudadano, OtraAlerta } from './api'
import { DialogoDecisionCuenta } from './DialogoDecisionCuenta'
import { historialDeCiudadanoQuery } from './queries'

const rutaApi = getRouteApi('/protegida/mal-uso/$ciudadanoId')

/** PB-23: lo que la central revisa antes de decidir sobre una cuenta, y la decisión. */
export function HistorialCiudadanoPage() {
  const { ciudadanoId } = rutaApi.useParams()
  const idValido = Number.isInteger(ciudadanoId) && ciudadanoId > 0
  const consulta = useQuery({ ...historialDeCiudadanoQuery(ciudadanoId), enabled: idValido })
  const noExiste = !idValido || (consulta.error instanceof ErrorApi && consulta.error.status === 404)

  return (
    <>
      <Link to="/mal-uso" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
        <XStack items="center" gap={6}>
          <IconoAnterior size={16} color="var(--textoSecundario)" />
          <Text fontSize={13} fontWeight="500" color="$textoSecundario">
            Mal uso
          </Text>
        </XStack>
      </Link>

      {noExiste ? (
        <EncabezadoPagina titulo="Ciudadano no encontrado" descripcion="El enlace está mal o no es una cuenta de la app." />
      ) : consulta.isPending ? (
        <Cargando texto="Cargando el historial…" />
      ) : consulta.isError ? (
        <ErrorAlCargar error={consulta.error} onReintentar={() => consulta.refetch()} />
      ) : (
        <Contenido ciudadano={consulta.data} />
      )}
    </>
  )
}

function Contenido({ ciudadano }: { ciudadano: HistorialDeCiudadano }) {
  const [decidiendo, setDecidiendo] = useState(false)

  return (
    <>
      <EncabezadoPagina
        titulo={ciudadano.nombre}
        descripcion={`Teléfono ${ciudadano.telefono}. ${ciudadano.activo ? 'Cuenta activa.' : 'Cuenta desactivada.'}`}
        accion={
          ciudadano.activo ? (
            <BotonPrimario size="$4" onPress={() => setDecidiendo(true)}>
              <Button.Text color="$primarioTexto">Desactivar la cuenta</Button.Text>
            </BotonPrimario>
          ) : (
            <Button size="$4" variant="outlined" onPress={() => setDecidiendo(true)}>
              Reactivar la cuenta
            </Button>
          )
        }
      />

      <YStack gap={16}>
        <Seccion
          titulo={`Falsas alarmas verificadas (${ciudadano.falsasAlarmas.length})`}
          ayuda="Incidentes que la central cerró como falsa alarma, con cómo lo verificó."
        >
          {ciudadano.falsasAlarmas.length === 0 ? (
            <Vacio>Ninguna.</Vacio>
          ) : (
            ciudadano.falsasAlarmas.map((falsa) => (
              <Renglon key={falsa.alertaId}>
                <XStack gap={10} items="center" flexWrap="wrap">
                  <Text fontSize={14} fontWeight="600" color="$texto">
                    {fechaHoraCorta(falsa.fechaHora)}
                  </Text>
                  <EnlaceIncidente id={falsa.incidenteId} />
                  {falsa.retiradaComo ? (
                    <Insignia tono="gris">También la retiró: {TEXTO_MOTIVO_CANCELACION_ALERTA[falsa.retiradaComo]}</Insignia>
                  ) : null}
                </XStack>
                <Paragraph fontSize={14} lineHeight={20} color="$texto">
                  {falsa.fundamento ?? 'Sin fundamento escrito.'}
                </Paragraph>
                <Text fontSize={12} color="$textoSecundario">
                  Verificó {falsa.verificadaPor}
                  {falsa.fechaCierre ? ` · ${fechaHoraCorta(falsa.fechaCierre)}` : ''}
                </Text>
              </Renglon>
            ))
          )}
        </Seccion>

        <Seccion
          titulo={`Otras alertas (${ciudadano.otrasAlertas.length})`}
          ayuda="Atendidas, retiradas por el propio ciudadano o cerradas por otra causa. Ninguna cuenta como falsa alarma."
        >
          {ciudadano.otrasAlertas.length === 0 ? (
            <Vacio>Ninguna.</Vacio>
          ) : (
            ciudadano.otrasAlertas.map((alerta) => (
              <Renglon key={alerta.alertaId}>
                <XStack gap={10} items="center" flexWrap="wrap">
                  <Text fontSize={14} fontWeight="600" color="$texto">
                    {fechaHoraCorta(alerta.fechaHora)}
                  </Text>
                  <EnlaceIncidente id={alerta.incidenteId} />
                </XStack>
                <Text fontSize={13} color="$textoSecundario">
                  {queFueDeLaAlerta(alerta)}
                </Text>
              </Renglon>
            ))
          )}
        </Seccion>

        <Seccion titulo="Historial de la cuenta" ayuda="Cada desactivación y reactivación, con su motivo.">
          {ciudadano.sanciones.length === 0 ? (
            <Vacio>Nunca se desactivó.</Vacio>
          ) : (
            ciudadano.sanciones.map((sancion, i) => (
              <Renglon key={`${sancion.fechaHora}-${i}`}>
                <XStack gap={10} items="center" flexWrap="wrap">
                  <Insignia tono={sancion.tipo === 'DESACTIVACION' ? 'rojo' : 'verde'}>
                    {sancion.tipo === 'DESACTIVACION' ? 'Desactivada' : 'Reactivada'}
                  </Insignia>
                  <Text fontSize={13} color="$textoSecundario">
                    {fechaHoraCorta(sancion.fechaHora)} · {sancion.administrador}
                  </Text>
                </XStack>
                <Paragraph fontSize={14} lineHeight={20} color="$texto">
                  {sancion.motivo}
                </Paragraph>
              </Renglon>
            ))
          )}
        </Seccion>
      </YStack>

      {decidiendo ? <DialogoDecisionCuenta ciudadano={ciudadano} onCerrar={() => setDecidiendo(false)} /> : null}
    </>
  )
}

function queFueDeLaAlerta(alerta: OtraAlerta) {
  if (alerta.motivoRetiro) {
    return `La retiró: ${TEXTO_MOTIVO_CANCELACION_ALERTA[alerta.motivoRetiro]}. Incidente: ${TEXTO_ESTADO_INCIDENTE[alerta.estadoIncidente].toLowerCase()}.`
  }
  return `Alerta ${TEXTO_ESTADO_ALERTA[alerta.estado].toLowerCase()}. Incidente: ${TEXTO_ESTADO_INCIDENTE[alerta.estadoIncidente].toLowerCase()}.`
}

function EnlaceIncidente({ id }: { id: number }) {
  return (
    <Link to="/incidentes/$incidenteId" params={{ incidenteId: id }} search={{}} style={{ textDecoration: 'none' }}>
      <Text fontFamily="$mono" fontSize={13} fontWeight="500" color="$primarioPresionado">
        Incidente #{id}
      </Text>
    </Link>
  )
}

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda: string; children: ReactNode }) {
  return (
    <YStack gap={12} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12} p={20}>
      <YStack gap={4}>
        <H2 color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
          {titulo}
        </H2>
        <Text fontSize={13} color="$textoSecundario">
          {ayuda}
        </Text>
      </YStack>
      <YStack>{children}</YStack>
    </YStack>
  )
}

function Renglon({ children }: { children: ReactNode }) {
  return (
    <YStack gap={6} py={12} borderTopWidth={1} borderColor="$borde">
      {children}
    </YStack>
  )
}

function Vacio({ children }: { children: ReactNode }) {
  return (
    <Text fontSize={14} color="$textoTenue">
      {children}
    </Text>
  )
}
