import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Button, H2, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { comoDia, fechaHora, tiempoDeSegundos } from '../../shared/formato/fechas'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar, MensajeDeCampo } from '../../shared/ui/EstadosDeCarga'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { TEXTO_ESTADO_INCIDENTE } from '../incidentes/textos'
import { TEXTO_ESTADO_TRASLADO } from '../traslados/textos'
import type { Medida, ReporteDeOperacion } from './api'
import { descargarCsv } from './csv'
import { reporteDeOperacionQuery } from './queries'

const COLUMNAS_DIA: ColumnaTabla[] = [
  { titulo: 'Día' },
  { titulo: 'Emergencias', ancho: 130, alinearDerecha: true },
  { titulo: 'Traslados', ancho: 130, alinearDerecha: true },
]

const COLUMNAS_UNIDAD: ColumnaTabla[] = [
  { titulo: 'Unidad' },
  { titulo: 'Emergencias', ancho: 120, alinearDerecha: true },
  { titulo: 'Traslados', ancho: 120, alinearDerecha: true },
  { titulo: 'Toma a llegada (mediana)', ancho: 200, alinearDerecha: true },
]

type Periodo = { desde: string; hasta: string }

function haceDias(dias: number) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return comoDia(fecha)
}

const ATAJOS: { etiqueta: string; periodo: () => Periodo }[] = [
  { etiqueta: 'Hoy', periodo: () => ({ desde: haceDias(0), hasta: haceDias(0) }) },
  { etiqueta: 'Últimos 7 días', periodo: () => ({ desde: haceDias(6), hasta: haceDias(0) }) },
  { etiqueta: 'Últimos 30 días', periodo: () => ({ desde: haceDias(29), hasta: haceDias(0) }) },
  {
    etiqueta: 'Este mes',
    periodo: () => {
      const hoy = new Date()
      return { desde: comoDia(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: comoDia(hoy) }
    },
  },
]

function tiempo(segundos: number | null) {
  return segundos === null ? '—' : tiempoDeSegundos(segundos)
}

/** PB-22: cómo anduvo la operación en un período, con lo que se exporta a CSV. */
export function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>(ATAJOS[1].periodo())
  const alReves = periodo.desde > periodo.hasta
  const consulta = useQuery({
    ...reporteDeOperacionQuery(periodo.desde, periodo.hasta),
    enabled: Boolean(periodo.desde && periodo.hasta) && !alReves,
  })

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Emergencias y traslados de un período, con sus estados finales, tiempos de respuesta y lo que hizo cada unidad."
        accion={
          <Button
            size="$4"
            variant="outlined"
            disabled={!consulta.data || consulta.isPlaceholderData}
            onPress={() => consulta.data && descargarCsv(consulta.data)}
          >
            Exportar CSV
          </Button>
        }
      />

      <YStack gap={16}>
        <XStack gap={12} items="flex-end" flexWrap="wrap">
          <CampoFecha etiqueta="Desde" valor={periodo.desde} onCambiar={(desde) => setPeriodo((p) => ({ ...p, desde }))} />
          <CampoFecha etiqueta="Hasta" valor={periodo.hasta} onCambiar={(hasta) => setPeriodo((p) => ({ ...p, hasta }))} />
          <XStack gap={6} flexWrap="wrap">
            {ATAJOS.map((atajo) => (
              <Button key={atajo.etiqueta} size="$3" chromeless onPress={() => setPeriodo(atajo.periodo())}>
                <Button.Text fontSize={13} color="$primarioPresionado" fontWeight="600">
                  {atajo.etiqueta}
                </Button.Text>
              </Button>
            ))}
          </XStack>
          {consulta.isFetching ? <Spinner size="small" color="$textoSecundario" /> : null}
        </XStack>
        {alReves ? <MensajeDeCampo texto="La fecha final no puede ser anterior a la inicial." /> : null}

        {consulta.isPending ? (
          alReves ? null : <Cargando texto="Armando el reporte…" />
        ) : consulta.isError ? (
          <ErrorAlCargar error={consulta.error} onReintentar={() => consulta.refetch()} />
        ) : (
          <Contenido reporte={consulta.data} />
        )}
      </YStack>
    </>
  )
}

function Contenido({ reporte }: { reporte: ReporteDeOperacion }) {
  const t = reporte.tiemposDeEmergencia
  const p = reporte.puntualidadDeTraslados
  return (
    <YStack gap={16}>
      <Text fontSize={12} color="$textoSecundario">
        Del {reporte.desde} al {reporte.hasta} · generado el {fechaHora(reporte.generadoEn)}
      </Text>

      <XStack gap={12} flexWrap="wrap">
        <Cifra titulo="Emergencias" valor={String(reporte.emergencias.total)} />
        <Cifra titulo="Traslados" valor={String(reporte.traslados.total)} />
        <Cifra
          titulo="Tiempo de respuesta (mediana)"
          valor={tiempo(t.hastaLaLlegada.medianaSegundos)}
          nota={notaDeMedida(t.hastaLaLlegada)}
        />
        <Cifra
          titulo="Traslados a tiempo"
          valor={p.aTiempo + p.tarde === 0 ? '—' : `${p.aTiempo} de ${p.aTiempo + p.tarde}`}
          nota={p.sinDato ? `${p.sinDato} sin llegada registrada` : undefined}
        />
      </XStack>

      <XStack gap={16} flexWrap="wrap">
        <Seccion titulo="Emergencias por estado">
          {Object.entries(reporte.emergencias.porEstado).map(([estado, n]) => (
            <Renglon key={estado} etiqueta={TEXTO_ESTADO_INCIDENTE[estado as keyof typeof TEXTO_ESTADO_INCIDENTE]} valor={n} />
          ))}
        </Seccion>
        <Seccion titulo="Traslados por estado">
          {Object.entries(reporte.traslados.porEstado).map(([estado, n]) => (
            <Renglon key={estado} etiqueta={TEXTO_ESTADO_TRASLADO[estado as keyof typeof TEXTO_ESTADO_TRASLADO]} valor={n} />
          ))}
        </Seccion>
        <Seccion titulo="Tiempos de emergencia">
          <Renglon etiqueta="Hasta que una unidad lo tomó" valor={`${tiempo(t.hastaLaToma.medianaSegundos)} (mediana)`} />
          <Renglon etiqueta="Hasta la llegada, promedio" valor={tiempo(t.hastaLaLlegada.promedioSegundos)} />
          <Renglon etiqueta="Hasta la llegada, mediana" valor={tiempo(t.hastaLaLlegada.medianaSegundos)} />
          <Renglon etiqueta="Sin unidad" valor={t.sinUnidad} />
          <Renglon etiqueta="Sin llegada registrada" valor={t.sinLlegada} />
        </Seccion>
      </XStack>

      <Seccion titulo="Por día">
        <Tabla columnas={COLUMNAS_DIA}>
          {reporte.porDia.map((dia) => (
            <FilaTabla key={dia.dia} columnas={COLUMNAS_DIA} alto={44}>
              <Text fontFamily="$mono" fontSize={13} color="$texto">
                {dia.dia}
              </Text>
              <Numero valor={dia.emergencias} />
              <Numero valor={dia.traslados} />
            </FilaTabla>
          ))}
        </Tabla>
      </Seccion>

      <Seccion titulo="Por unidad">
        <Tabla columnas={COLUMNAS_UNIDAD}>
          {reporte.porUnidad.length === 0 ? (
            <TablaVacia>Ninguna unidad atendió servicios en este período.</TablaVacia>
          ) : (
            reporte.porUnidad.map((unidad) => (
              <FilaTabla key={unidad.placa} columnas={COLUMNAS_UNIDAD} alto={44}>
                <Text fontFamily="$mono" fontSize={13} fontWeight="500" color="$texto">
                  {unidad.placa}
                </Text>
                <Numero valor={unidad.emergencias} />
                <Numero valor={unidad.traslados} />
                <Text fontSize={14} color="$texto" text="right">
                  {tiempo(unidad.hastaLaLlegada.medianaSegundos)}
                </Text>
              </FilaTabla>
            ))
          )}
        </Tabla>
      </Seccion>

      <Seccion titulo="Cómo se calculó">
        {reporte.criterio.map((frase) => (
          <Paragraph key={frase} fontSize={13} lineHeight={19} color="$textoSecundario">
            {frase}
          </Paragraph>
        ))}
      </Seccion>
    </YStack>
  )
}

function notaDeMedida(medida: Medida) {
  return medida.medidos === 0 ? 'Ningún caso con llegada registrada' : `Sobre ${medida.medidos} con llegada registrada`
}

function CampoFecha({ etiqueta, valor, onCambiar }: { etiqueta: string; valor: string; onCambiar: (valor: string) => void }) {
  const id = `fecha-${etiqueta.toLowerCase()}`
  return (
    <YStack gap={4}>
      <Text render="label" htmlFor={id} fontSize={12} fontWeight="500" color="$textoSecundario">
        {etiqueta}
      </Text>
      <input
        id={id}
        type="date"
        value={valor}
        onChange={(e) => onCambiar(e.currentTarget.value)}
        style={{
          height: 40,
          padding: '0 10px',
          borderRadius: 8,
          border: '1px solid var(--bordeFuerte)',
          background: 'var(--superficie)',
          color: 'var(--texto)',
          font: 'inherit',
          fontSize: 14,
        }}
      />
    </YStack>
  )
}

function Cifra({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <YStack flex={1} minW={200} gap={4} p={16} rounded={12} bg="$superficie" borderWidth={1} borderColor="$borde">
      <Text fontSize={12} fontWeight="500" color="$textoSecundario">
        {titulo}
      </Text>
      <Text fontSize={26} lineHeight={32} fontWeight="700" color="$texto">
        {valor}
      </Text>
      {nota ? (
        <Text fontSize={12} color="$textoSecundario">
          {nota}
        </Text>
      ) : null}
    </YStack>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack flex={1} minW={260} gap={10} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12} p={20}>
      <H2 color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
        {titulo}
      </H2>
      <YStack gap={6}>{children}</YStack>
    </YStack>
  )
}

function Renglon({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <XStack justify="space-between" gap={12}>
      <Text fontSize={14} color="$texto">
        {etiqueta}
      </Text>
      <Text fontFamily="$mono" fontSize={14} fontWeight="600" color="$texto">
        {valor}
      </Text>
    </XStack>
  )
}

function Numero({ valor }: { valor: number }) {
  return (
    <Text fontFamily="$mono" fontSize={14} color={valor === 0 ? '$textoTenue' : '$texto'} text="right">
      {valor}
    </Text>
  )
}
