import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* 1. Muestra el grupo de pestañas (tabs) */}
      <Stack.Screen 
        name="(tabs)" // Apunta a la carpeta (tabs)
        options={{ headerShown: false }} // Oculta el título "tabs"
      />

      {/* 2. Define la pantalla de crear equipo */}
      <Stack.Screen 
        name="crear-equipo" // Apunta a app/crear-equipo.tsx
        options={{ title: 'Registrar Equipo' }} 
      />
    </Stack>
  );
}