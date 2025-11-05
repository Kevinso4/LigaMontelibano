# ⚽ Liga Montelíbano - Sistema de Gestión de Liga de Fútbol

![Liga Montelíbano](https://placehold.co/800x200/FFC700/064E3B?text=Liga+Montel%C3%ADbano)

**Liga Montelíbano** es una aplicación web completa y moderna para la gestión integral de una liga de fútbol local. Desarrollada con React y Firebase, proporciona herramientas en tiempo real para administradores, equipos y jugadores.

## 📋 Descripción del Proyecto

Este sistema permite la gestión completa de una liga de fútbol, incluyendo:

- **Gestión de Equipos**: Registro de equipos, entrenadores y plantillas de jugadores
- **Perfiles de Jugadores**: Cada jugador tiene un perfil personalizable con estadísticas, foto y biografía
- **Calendario de Partidos**: Programación y seguimiento de partidos en diferentes canchas
- **Marcador en Vivo**: Sistema de actualización de marcadores en tiempo real durante los partidos
- **Tabla de Posiciones**: Clasificación automática basada en puntos, diferencia de goles y goles a favor
- **Ranking de Goleadores**: Top 10 de máximos anotadores de la liga
- **Sistema de Tarjetas y Suspensiones**: Control automático de tarjetas amarillas y rojas con puntos de suspensión
- **Noticias y Comunicados**: Publicación de noticias y anuncios oficiales
- **Gestión de Canchas**: Registro de sedes y lugares donde se juegan los partidos
- **Patrocinadores**: Galería de socios y patrocinadores de la liga
- **Vista de Campo**: Visualización táctica de la formación de cada equipo

## 🌟 Características Principales

### Para Administradores
- **Panel de Control Completo**: Acceso protegido por contraseña para gestionar todos los aspectos de la liga
- **Gestión de Partidos en Vivo**: Registro de goles, tarjetas amarillas y rojas durante los partidos
- **Control de Estados**: Cambio de estado de partidos (Programado, En Vivo, Descanso, Finalizado)
- **Gestión de Equipos y Jugadores**: CRUD completo de equipos, jugadores, canchas y patrocinadores

### Para Jugadores
- **Perfil Personal**: Acceso mediante ID único para ver y editar su perfil
- **Actualización de Datos**: Modificación de número de camiseta, foto de perfil y biografía
- **Visualización de Estadísticas**: Ver goles, tarjetas y estado de suspensión

### Para Espectadores
- **Dashboard Informativo**: Métricas clave de la liga (equipos, partidos, goleadores)
- **Partidos en Vivo**: Visualización de marcadores en tiempo real
- **Tabla de Posiciones**: Clasificación actualizada automáticamente
- **Historial de Partidos**: Resultados de todos los partidos finalizados

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18.2.0**: Biblioteca principal para la construcción de la interfaz
- **Lucide React**: Iconos modernos y consistentes
- **Tailwind CSS 3.4.3**: Framework de utilidades CSS para diseño responsive

### Backend y Base de Datos
- **Firebase 12.4.0**: 
  - **Firebase Authentication**: Autenticación anónima y con tokens personalizados
  - **Cloud Firestore**: Base de datos en tiempo real NoSQL
  - **Real-time Listeners**: Sincronización automática de datos

### Herramientas de Desarrollo
- **React Scripts 5.0.1**: Configuración y scripts de desarrollo
- **PostCSS & Autoprefixer**: Procesamiento de CSS

## 📁 Estructura del Proyecto

```
LigaMontelibano/
├── public/
│   └── index.html              # Página HTML principal
├── src/
│   ├── index.js                # Punto de entrada de React
│   └── TeamsApp.jsx            # Componente principal de la aplicación
├── package.json                # Dependencias y scripts
├── package-lock.json           # Lockfile de dependencias
├── tailwind.config.js          # Configuración de Tailwind CSS
├── postcss.config.js           # Configuración de PostCSS
├── .gitignore                  # Archivos ignorados por Git
├── install.cmd                 # Script de instalación para Windows
└── RunMobileScript.sh          # Script para ejecutar en móvil

```

## 🚀 Instalación y Configuración

### Prerequisitos
- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Firebase (para configuración)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Kevinso4/LigaMontelibano.git
cd LigaMontelibano
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase** (opcional, ya viene configurado)
   - El proyecto ya tiene una configuración de Firebase en `src/TeamsApp.jsx`
   - Si deseas usar tu propia instancia:
     - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
     - Habilita Firestore Database
     - Copia las credenciales y reemplaza `firebaseConfig` en `TeamsApp.jsx`

4. **Iniciar el servidor de desarrollo**
```bash
npm start
```

La aplicación se abrirá en `http://localhost:3000`

## 📱 Scripts Disponibles

- **`npm start`**: Inicia el servidor de desarrollo
- **`npm run build`**: Crea una versión optimizada para producción
- **`npm test`**: Ejecuta las pruebas (si están configuradas)

## 🎮 Uso de la Aplicación

### Acceso como Administrador
1. Hacer clic en el botón "Acceso Admin" en la esquina superior derecha
2. Introducir la contraseña: `montelibano2025`
3. Una vez autenticado, tendrás acceso a todas las funciones de administración

### Acceso como Jugador
1. Ir a la pestaña "Equipos"
2. Hacer clic en "Acceder a mi Perfil de Jugador"
3. Introducir tu ID de jugador (proporcionado por el administrador)
4. Ver y editar tu perfil personal

### Navegación
La aplicación tiene 8 secciones principales:

1. **Inicio**: Dashboard con métricas clave y partidos recientes
2. **Equipos**: Gestión de equipos, plantillas y perfiles de jugadores
3. **Noticias**: Comunicados y anuncios oficiales
4. **Partidos**: Calendario, programación y marcadores en vivo
5. **Clasificación**: Tabla de posiciones y ranking de goleadores
6. **Canchas**: Gestión de sedes y lugares de juego
7. **Socios**: Galería de patrocinadores
8. **Contacto**: Información de contacto y soporte

## 🎯 Funcionalidades Detalladas

### Sistema de Puntos y Clasificación
- **Victoria**: 3 puntos
- **Empate**: 1 punto
- **Derrota**: 0 puntos
- **Criterios de desempate**:
  1. Puntos totales
  2. Diferencia de goles
  3. Goles a favor

### Sistema de Suspensiones
- **Tarjeta Amarilla**: +1 punto de suspensión
- **Tarjeta Roja**: +3 puntos de suspensión
- **Umbral de Suspensión**: 5 puntos = Jugador suspendido

### Registro de Eventos en Vivo
Durante un partido activo, el administrador puede:
- Registrar goles (actualiza automáticamente el marcador y estadísticas del jugador)
- Registrar tarjetas amarillas y rojas
- Cambiar el estado del partido (Programado → En Vivo → Descanso → Finalizado)

## 🎨 Características de Diseño

- **Diseño Responsive**: Optimizado para móviles, tablets y escritorio
- **Tema Oscuro**: Interfaz moderna con colores oscuros y acentos amarillos/verdes
- **Tiempo Real**: Actualización automática de datos sin recargar la página
- **Animaciones**: Transiciones suaves y efectos visuales atractivos
- **Accesibilidad**: Estructura clara y navegación intuitiva

## 🔐 Seguridad

- Autenticación de administradores mediante contraseña
- Validación de acceso mediante ID de jugador
- Datos almacenados en colección pública de Firebase con reglas de seguridad
- Tokens de autenticación gestionados por Firebase

## 🗄️ Estructura de Datos (Firestore)

La aplicación utiliza las siguientes colecciones:

- **`teams`**: Información de equipos y plantillas
- **`matches`**: Partidos programados y finalizados
- **`news`**: Noticias y comunicados
- **`venues`**: Canchas y sedes
- **`sponsors`**: Patrocinadores y socios

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código privado. Contacta con el propietario para más información sobre uso y licencia.

## 👨‍💻 Desarrollador

**Kevin Soto**
- GitHub: [@Kevinso4](https://github.com/Kevinso4)
- Proyecto: Liga Montelíbano

## 📞 Soporte y Contacto

### Sede de la Liga
- **Dirección**: Carrera 1 # 10-20, Montelíbano, Córdoba
- **Teléfono**: (57) 4 762 1000
- **Email**: contacto@ligamontelibano.co

### Soporte Técnico
- **Desarrollador**: Kevin
- **Contacto**: soporte@mi-app.dev

## 🎉 Agradecimientos

Gracias a todos los equipos, jugadores y aficionados que hacen posible la Liga Montelíbano.

---

**¡Que gane el mejor equipo! ⚽🏆**
