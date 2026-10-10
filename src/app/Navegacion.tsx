import { Link } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import {
  IconoAmbulancia,
  IconoIncidentes,
  IconoMonitoreo,
  IconoPersonas,
  IconoTraslados,
  type PropsIcono,
} from '../shared/ui/iconos'

type Seccion = {
  to: '/flota' | '/personal' | '/incidentes' | '/traslados' | '/centro-de-control'
  etiqueta: string
  Icono: ComponentType<PropsIcono>
}

/** Para sumar una sección: crear su ruta en `rutas/`, registrarla en `router.tsx` y agregarla aquí. */
const SECCIONES: Seccion[] = [
  { to: '/flota', etiqueta: 'Flota', Icono: IconoAmbulancia },
  { to: '/personal', etiqueta: 'Personal', Icono: IconoPersonas },
  { to: '/incidentes', etiqueta: 'Incidentes', Icono: IconoIncidentes },
  { to: '/traslados', etiqueta: 'Traslados', Icono: IconoTraslados },
  { to: '/centro-de-control', etiqueta: 'Centro de control', Icono: IconoMonitoreo },
]

export function Navegacion() {
  return (
    <YStack render="nav" aria-label="Secciones del panel" gap={2}>
      {/* Con el menú plegado queda solo el ícono: el nombre sigue en `title`, que aparece al pasar el mouse, y en
          `aria-label`, que es lo que lee el lector de pantalla cuando el texto no se ve. */}
      {SECCIONES.map(({ to, etiqueta, Icono }) => (
        <Link key={to} to={to} title={etiqueta} aria-label={etiqueta} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <XStack
              items="center"
              gap={10}
              height={40}
              px={12}
              rounded={8}
              bg={isActive ? '$primarioTinte' : 'transparent'}
              hoverStyle={{ bg: isActive ? '$primarioTinte' : '$fondo' }}
              $max-xl={{ justify: 'center', px: 0 }}
            >
              <Icono size={18} color={isActive ? 'var(--primarioTinteTexto)' : 'var(--textoSecundario)'} />
              <Text
                fontSize={14}
                fontWeight={isActive ? '600' : '500'}
                color={isActive ? '$primarioTinteTexto' : '$texto'}
                $max-xl={{ display: 'none' }}
              >
                {etiqueta}
              </Text>
            </XStack>
          )}
        </Link>
      ))}
    </YStack>
  )
}
