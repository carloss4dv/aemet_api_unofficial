/**
 * Ejemplo de uso del endpoint de predicción horaria por municipio
 */
import { Aemet } from '../aemet';

// Inicializar cliente con tu API key
// IMPORTANTE: Sustituye 'TU_API_KEY' por tu clave API real de AEMET
const aemet = new Aemet('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NDg0ODFAdW5pemFyLmVzIiwianRpIjoiYmE5ZWY3NmEtYjBiMC00MWE1LTkxNjAtMmUxMTFmMjM0ZjlmIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NDI1NzEzODksInVzZXJJZCI6ImJhOWVmNzZhLWIwYjAtNDFhNS05MTYwLTJlMTExZjIzNGY5ZiIsInJvbGUiOiIifQ.uTR2vmhfRLnyk1oE1mBsq3PhXm7qQGzu3xP80ERTNak');

// Ejemplo 1: Obtener predicción horaria por municipio usando getClimateValues
async function ejemploPrediccionHoraria() {
  try {
    const params = {
      startDate: new Date().toISOString().split('T')[0], // Fecha actual
      endDate: new Date().toISOString().split('T')[0],   // Fecha actual
      municipalityCode: '28079' // Madrid
    };
    
    console.log('Obteniendo predicción horaria para Madrid...');
    const resultado = await aemet.getClimateValues(params);
    
    console.log('Nombre del municipio:', resultado.station.nombre);
    console.log('Provincia:', resultado.station.provincia);
    console.log('Número de registros:', resultado.values.length);
    
    // Mostrar los datos crudos para explorar la estructura
    console.log('Estructura completa de datos crudos:');
    console.log(JSON.stringify(resultado.rawData, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejemplo 2: Obtener predicción horaria usando getWeatherByCoordinates con código de municipio
async function ejemploPrediccionPorCoordenadas() {
  try {
    console.log('Obteniendo predicción por coordenadas con código de municipio...');
    // Las coordenadas se ignoran cuando se proporciona un código de municipio
    const resultado = await aemet.getWeatherByCoordinates(
      40.4165, // latitud (se ignora si se proporciona municipalityCode)
      -3.7026, // longitud (se ignora si se proporciona municipalityCode)
      '28079'  // Madrid
    );
    
    console.log('Estación:', resultado.station.nombre);
    console.log('Datos meteorológicos:', resultado.weatherData);
    
    // Mostrar los datos crudos para explorar la estructura
    console.log('Estructura completa de datos crudos:');
    console.log(JSON.stringify(resultado.rawData, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar los ejemplos
(async () => {
  console.log('=== EJEMPLO 1: PREDICCIÓN HORARIA POR MUNICIPIO ===');
  await ejemploPrediccionHoraria();
  
  console.log('\n=== EJEMPLO 2: PREDICCIÓN POR COORDENADAS CON CÓDIGO DE MUNICIPIO ===');
  await ejemploPrediccionPorCoordenadas();
})(); 