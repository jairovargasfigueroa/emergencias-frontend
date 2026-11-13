import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Text } from 'tamagui'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { Insignia } from '../../shared/ui/Insignia'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { ciudadanosConFalsasAlarmasQuery } from './queries'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Ciudadano' },
  { titulo: 'Teléfono', ancho: 160 },
  { titulo: 'Falsas alarmas', ancho: 130, alinearDerecha: true },
  { titulo: 'La última', ancho: 160, ocultarEnPantallaChica: true },
  { titulo: 'Cuenta', ancho: 130 },
]

/**
 * PB-23: quiénes tienen falsas alarmas verificadas. Solo cuentan los incidentes que la central cerró como falsa
 * alarma con su fundamento: retirar un pedido o una atención sin traslado no lo son.
 */
export function MalUsoPage() {
  const ciudadanos = useQuery(ciudadanosConFalsasAlarmasQuery())

  return (
    <>
      <EncabezadoPagina
        titulo="Mal uso"
        descripcion="Ciudadanos con falsas alarmas verificadas por la central. Abre uno para ver el fundamento de cada una y decidir sobre su cuenta."
      />

      {ciudadanos.isPending ? (
        <Cargando texto="Cargando…" />
      ) : ciudadanos.isError ? (
        <ErrorAlCargar error={ciudadanos.error} onReintentar={() => ciudadanos.refetch()} />
      ) : (
        <Tabla columnas={COLUMNAS}>
          {ciudadanos.data.length === 0 ? (
            <TablaVacia>Nadie tiene falsas alarmas verificadas.</TablaVacia>
          ) : (
            ciudadanos.data.map((ciudadano) => (
              <Link
                key={ciudadano.id}
                to="/mal-uso/$ciudadanoId"
                params={{ ciudadanoId: ciudadano.id }}
                style={{ textDecoration: 'none' }}
              >
                <FilaTabla columnas={COLUMNAS} interactiva atenuada={!ciudadano.activo}>
                  <Text fontSize={14} fontWeight="500" color="$texto" numberOfLines={1}>
                    {ciudadano.nombre}
                  </Text>
                  <Text fontFamily="$mono" fontSize={13} color="$texto">
                    {ciudadano.telefono}
                  </Text>
                  <Text fontFamily="$mono" fontSize={14} fontWeight="600" color="$texto" text="right">
                    {ciudadano.falsasAlarmas}
                  </Text>
                  <Text fontSize={14} color="$textoSecundario">
                    {fechaHoraCorta(ciudadano.ultimaFalsaAlarma)}
                  </Text>
                  {ciudadano.activo ? (
                    <Text fontSize={14} color="$texto">
                      Activa
                    </Text>
                  ) : (
                    <Insignia tono="rojo">Desactivada</Insignia>
                  )}
                </FilaTabla>
              </Link>
            ))
          )}
        </Tabla>
      )}
    </>
  )
}
