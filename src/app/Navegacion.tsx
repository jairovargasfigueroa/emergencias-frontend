import { Link } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { IconoAmbulancia, IconoIncidentes, IconoPersonas, type PropsIcono } from '../shared/ui/iconos'

type Seccion = {
  to: '/flota' | '/personal' | '/incidentes'
  etiqueta: string
  Icono: ComponentType<PropsIcono>
}

/** Para sumar una sección: crear su ruta en `rutas/`, registrarla en `router.tsx` y agregarla aquí. */
const SECCIONES: Seccion[] = [
  { to: '/flota', etiqueta: 'Flota', Icono: IconoAmbulancia },
  { to: '/personal', etiqueta: 'Personal', Icono: IconoPersonas },
  { to: '/incidentes', etiqueta: 'Incidentes', Icono: IconoIncidentes },
]

export function Navegacion() {
  return (
    <YStack render="nav" aria-label="Secciones del panel" gap={2}>
      {SECCIONES.map(({ to, etiqueta, Icono }) => (
        <Link key={to} to={to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <XStack
              items="center"
              gap={10}
              height={40}
              px={12}
              rounded={8}
              bg={isActive ? '$primarioTinte' : 'transparent'}
              hoverStyle={{ bg: isActive ? '$primarioTinte' : '$fondo' }}
            >
              <Icono size={18} color={isActive ? 'var(--primarioPresionado)' : 'var(--textoSecundario)'} />
              <Text fontSize={14} fontWeight={isActive ? '600' : '500'} color={isActive ? '$primarioPresionado' : '$texto'}>
                {etiqueta}
              </Text>
            </XStack>
          )}
        </Link>
      ))}
    </YStack>
  )
}
