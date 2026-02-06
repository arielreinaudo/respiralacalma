
# Emyti Holistic Healing - Entrenador de Respiración

Una aplicación web prolija y funcional para guiar sesiones de respiración controlada, diseñada con principios de UX para promover la calma y el enfoque.

## Características
- **Visualización Sincronizada**: Círculo de respiración y onda sinusoidal reactiva.
- **Audio de Apoyo**: Click suave de segundero para mantener el ritmo.
- **Modo Calibración**: Ajuste dinámico del ritmo antes de iniciar la sesión.
- **Presets Especializados**: Calmar, Enfocar, Dormir, Recuperar.
- **Historial Local**: Seguimiento de las últimas 10 sesiones.
- **Accesibilidad**: Soporte para Modo Oscuro, Modo Día y Reducción de Movimiento.

## Desarrollo Local
Para ejecutar este proyecto localmente:
1. Asegúrate de tener un servidor web simple (ej. `npx serve .` o Live Server de VS Code).
2. Abre `index.html` en tu navegador.

*Nota técnica: Este proyecto utiliza React con TypeScript y Tailwind CSS vía CDN para una experiencia sin configuraciones pesadas de build.*

## Despliegue en Netlify
Este repositorio está listo para ser desplegado automáticamente en Netlify:
- **Publish directory**: `.` (raíz)
- **Build command**: (vacío)

## Estructura de Archivos
- `index.html`: Punto de entrada con Tailwind.
- `App.tsx`: Lógica principal del entrenador.
- `components/`: Componentes visuales (Círculo, Canvas).
- `services/AudioService.ts`: Lógica de síntesis de sonido.
- `constants.ts`: Presets y microtips.
- `types.ts`: Definiciones de TypeScript.
