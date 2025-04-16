import { Aemet } from '../aemet';

async function main() {
  // Inicializar el cliente de AEMET
  const aemet = new Aemet('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NDg0ODFAdW5pemFyLmVzIiwianRpIjoiOTZkNjQ1YmItZDAwYi00ZmQ5LWFkMmEtYjg4OTQ2NmFkMzYwIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NDQ4MjExMzUsInVzZXJJZCI6Ijk2ZDY0NWJiLWQwMGItNGZkOS1hZDJhLWI4ODk0NjZhZDM2MCIsInJvbGUiOiIifQ.xdtMRcilXabDMIrC8rjxPqY-5M6S3q2sID0YMs-Z360'); // Reemplaza con tu API key real

  try {
    // Ejemplo con Madrid (coordenadas aproximadas del centro)
    const latitud = 40.4168;
    const longitud = -3.7038;
    const provincia = 'MADRID';

    console.log('Obteniendo datos meteorológicos para:');
    console.log(`- Coordenadas: ${latitud}, ${longitud}`);
    console.log(`- Provincia: ${provincia}`);
    console.log('----------------------------------------');

    const datos = await aemet.getWeatherByCoordinates(
      latitud,
      longitud,
      provincia
    );

    console.log('Datos de la estación:');
    console.log(`- Nombre: ${datos.station.nombre}`);
    console.log(`- Provincia: ${datos.station.provincia}`);
    console.log(`- Altitud: ${datos.station.altitud}m`);
    console.log(`- Distancia: ${datos.distancia.toFixed(2)}km`);
    console.log('----------------------------------------');

    console.log('Datos meteorológicos:');
    console.log(`- Fecha: ${datos.weatherData.fecha}`);
    console.log(`- Temperatura máxima: ${datos.weatherData.tmax}°C (${datos.weatherData.horatmax})`);
    console.log(`- Temperatura mínima: ${datos.weatherData.tmin}°C (${datos.weatherData.horatmin})`);
    console.log(`- Temperatura media: ${datos.weatherData.tm}°C`);
    console.log(`- Precipitación: ${datos.weatherData.prec}mm`);
    console.log(`- Presión máxima: ${datos.weatherData.presMax}hPa`);
    console.log(`- Presión mínima: ${datos.weatherData.presMin}hPa`);
    console.log(`- Viento medio: ${datos.weatherData.velmedia}m/s`);
    console.log(`- Racha máxima: ${datos.weatherData.racha}m/s`);
    console.log(`- Dirección viento: ${datos.weatherData.dir}°`);
    console.log(`- Insolación: ${datos.weatherData.inso} horas`);
    console.log(`- Nieve: ${datos.weatherData.nieve === 1 ? 'Sí' : 'No'}`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Error desconocido');
  }
}

main(); 