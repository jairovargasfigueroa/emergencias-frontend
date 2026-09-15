import { Text, XStack, YStack } from 'tamagui'

export function MarcaSga() {
  return (
    <XStack items="center" gap={12} px={8} py={4}>
      <XStack width={34} height={34} rounded={9} bg="$primario" items="center" justify="center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </XStack>
      <YStack>
        <Text color="$texto" fontSize={15} lineHeight={20} fontWeight="600">
          SGA
        </Text>
        <Text color="$textoSecundario" fontSize={12} lineHeight={16}>
          Gestión de ambulancias
        </Text>
      </YStack>
    </XStack>
  )
}
