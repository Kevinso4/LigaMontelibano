import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="crear-equipo"
        options={{ title: 'Registrar Equipo' }}
      />
      <Stack.Screen 
        name="crear-partido"
        options={{ title: 'Nuevo Partido' }}
      />
      <Stack.Screen 
        name="registrar-resultado"
        options={{ title: 'Registrar Resultado' }}
      />
      <Stack.Screen 
        name="editar-equipo/[id]"
        options={{ title: 'Editar Equipo' }}
      />
      <Stack.Screen 
        name="equipo/[id]/jugadores"
        options={{ title: 'Jugadores del Equipo' }}
      />
      <Stack.Screen 
        name="generar-fixture"
        options={{ title: 'Generar Fixture' }}
      />
    </Stack>
  );
}