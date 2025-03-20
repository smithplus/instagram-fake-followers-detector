# Instagram Fake Followers Detector

> 🔗 **Acceso directo:** [https://smithplus.github.io/instagram-fake-followers-detector/](https://smithplus.github.io/instagram-fake-followers-detector/)

> ⚠️ **Nota:** Este proyecto es un fork mejorado de [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) creado por [@davidarroyo1234](https://github.com/davidarroyo1234).

## 📝 Descripción
Herramienta para detectar seguidores potencialmente falsos en Instagram. Analiza perfiles en busca de patrones sospechosos y proporciona un informe detallado.

## ✨ Características
- Detección automática de cuentas sospechosas
- Interfaz intuitiva y fácil de usar
- Parámetros de detección personalizables
- Exportación de resultados a CSV
- Capacidad de pausar y reanudar el análisis
- Análisis en tiempo real con barra de progreso

## 📋 Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Acceso a Instagram
- Inicio de sesión en Instagram desde el navegador (requerido para acceder a la API de Instagram)
- JavaScript habilitado en el navegador

## 🚀 Instrucciones de Uso

### 1. Preparación
1. Asegúrate de estar iniciado sesión en Instagram en tu navegador
2. Navega al perfil de Instagram que deseas analizar

### 2. Abrir la Consola del Navegador
Hay varias formas de abrir la consola del navegador:

**Método 1 - Atajos de teclado:**
- Windows/Linux: `Ctrl + Shift + J` (Chrome) o `Ctrl + Shift + K` (Firefox)
- Mac: `Cmd + Option + J` (Chrome) o `Cmd + Option + K` (Firefox)

**Método 2 - Menú del navegador:**
- Chrome: 
  1. Haz clic en los tres puntos (⋮) en la esquina superior derecha
  2. Ve a "Más herramientas" > "Herramientas para desarrolladores"
  3. Selecciona la pestaña "Console"
- Firefox:
  1. Haz clic en el menú (☰) en la esquina superior derecha
  2. Ve a "Más herramientas" > "Herramientas para desarrolladores"
  3. Selecciona la pestaña "Console"

### 3. Ejecutar el Detector
1. Ve a [https://smithplus.github.io/instagram-fake-followers-detector/](https://smithplus.github.io/instagram-fake-followers-detector/)
2. Haz clic en el botón "Copiar código"
3. Vuelve a la pestaña de Instagram
4. Pega el código en la consola del navegador
5. Presiona Enter para ejecutar el detector

### 4. Análisis
- El detector comenzará a analizar los seguidores del perfil
- Verás una barra de progreso en la consola
- Puedes pausar el análisis en cualquier momento
- Los resultados se mostrarán en la consola y podrás exportarlos a CSV

### 5. Resultados
- Cuentas sospechosas detectadas
- Estadísticas detalladas
- Opción para exportar resultados a CSV
- Recomendaciones basadas en el análisis

## ⚙️ Configuración
Puedes ajustar los parámetros de detección en la consola antes de ejecutar el análisis:

```javascript
const config = {
    followersFollowingRatio: 2.0,    // Ratio seguidores/seguidos
    minPostsPerMonth: 2,            // Mínimo de publicaciones por mes
    minEngagementRate: 0.01,        // Tasa mínima de engagement
    minAccountAge: 30,              // Edad mínima de la cuenta en días
    requireProfilePic: true,        // Requerir foto de perfil
    requireBio: true,               // Requerir biografía
    batchSize: 50                   // Tamaño del lote de análisis
};
```

## 🔒 Privacidad y Seguridad
- No se almacena ninguna información personal
- El análisis se realiza localmente en tu navegador
- No se requiere acceso a tu cuenta de Instagram
- No se comparte información con terceros

## 📄 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## ⚠️ Descargo Legal
Esta herramienta es solo para fines educativos y de investigación. No nos hacemos responsables del uso indebido de la misma. 