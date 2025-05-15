import { Aemet } from '../aemet';

async function main() {
  // Inicializar el cliente de AEMET
  const aemet = new Aemet('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NDg0ODFAdW5pemFyLmVzIiwianRpIjoiOTZkNjQ1YmItZDAwYi00ZmQ5LWFkMmEtYjg4OTQ2NmFkMzYwIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NDQ4MjExMzUsInVzZXJJZCI6Ijk2ZDY0NWJiLWQwMGItNGZkOS1hZDJhLWI4ODk0NjZhZDM2MCIsInJvbGUiOiIifQ.xdtMRcilXabDMIrC8rjxPqY-5M6S3q2sID0YMs-Z360'); // Reemplaza con tu API key real

  try {
    // Ejemplo con Madrid (coordenadas aproximadas del centro)
    const latitud = 40.4168;
    const longitud = -3.7038;

    console.log('Obteniendo datos meteorológicos para:');
    console.log(`- Coordenadas: ${latitud}, ${longitud}`);
    console.log('----------------------------------------');

    const datos = await aemet.getWeatherByCoordinates(
      latitud,
      longitud
    );

    console.log('Datos del municipio:');
    console.log(`- Código: ${datos.municipalityCode}`);
    console.log(`- Nombre: ${datos.name}`);
    console.log(`- Provincia: ${datos.province}`);
    console.log(`- Distancia: ${datos.distancia.toFixed(2)}km`);
    console.log('----------------------------------------');

    console.log('Datos meteorológicos:');
    console.log(`- Fecha: ${datos.weatherData.fecha}`);
    console.log(`- Periodo: ${datos.weatherData.periodo}h`);
    console.log(`- Estado del cielo: ${datos.weatherData.estadoCielo.descripcion} (${datos.weatherData.estadoCielo.value})`);
    console.log(`- Temperatura: ${datos.weatherData.temperatura}°C`);
    console.log(`- Sensación térmica: ${datos.weatherData.sensTermica}°C`);
    console.log(`- Precipitación: ${datos.weatherData.precipitacion}mm`);
    console.log(`- Probabilidad precipitación: ${datos.weatherData.probPrecipitacion}%`);
    console.log(`- Probabilidad tormenta: ${datos.weatherData.probTormenta}%`);
    console.log(`- Nieve: ${datos.weatherData.nieve}mm`);
    console.log(`- Probabilidad nieve: ${datos.weatherData.probNieve}%`);
    console.log(`- Humedad relativa: ${datos.weatherData.humedadRelativa}%`);
    console.log(`- Viento: ${datos.weatherData.viento.velocidad}m/s dirección ${datos.weatherData.viento.direccion}`);
    if (datos.weatherData.viento.rachaMax) {
      console.log(`- Racha máxima: ${datos.weatherData.viento.rachaMax}m/s`);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Error desconocido');
  }
}

main(); 