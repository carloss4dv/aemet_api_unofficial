/**
 * Ejemplo de uso de valores climatológicos
 * 
 * Este ejemplo muestra cómo:
 * 1. Obtener la lista de estaciones meteorológicas
 * 2. Buscar estaciones por nombre o provincia
 * 3. Obtener los valores climatológicos diarios para una estación
 * 4. Obtener un resumen climatológico para un periodo
 */

import { Aemet } from '../aemet';
import dotenv from 'dotenv';

// Cargamos variables de entorno desde archivo .env
dotenv.config();

// Obtenemos la API key desde variables de entorno
const apiKey = process.env.AEMET_API_KEY;

if (!apiKey) {
  console.error('Error: No se ha configurado la API key de AEMET.');
  console.error('Por favor, cree un archivo .env con la variable AEMET_API_KEY=su_api_key');
  process.exit(1);
}

// Creamos una instancia del cliente de AEMET
const aemet = new Aemet(apiKey);

async function main() {
  try {
    console.log('1. Buscando estaciones meteorológicas en Madrid...');
    const stations = await aemet.searchWeatherStations('Madrid');
    
    console.log(`Se encontraron ${stations.length} estaciones:`);
    stations.slice(0, 5).forEach(station => {
      console.log(`- ${station.nombre} (${station.indicativo}) - Provincia: ${station.provincia}, Altitud: ${station.altitud}m`);
    });
    
    if (stations.length === 0) {
      console.log('No se encontraron estaciones. Finalizando ejemplo.');
      return;
    }
    
    // Seleccionamos la primera estación para el ejemplo
    const selectedStation = stations[0];
    console.log(`\n2. Seleccionada estación: ${selectedStation.nombre} (${selectedStation.indicativo})`);
    
    // Definimos el período para consultar (último mes)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    const endDate = today.toISOString().split('T')[0];
    const startDate = lastMonth.toISOString().split('T')[0];
    
    console.log(`\n3. Obteniendo valores climatológicos desde ${startDate} hasta ${endDate}...`);
    
    const climateValues = await aemet.getClimateValues({
      stationId: selectedStation.indicativo,
      startDate,
      endDate
    });
    
    console.log(`Se obtuvieron ${climateValues.values.length} registros.`);
    
    if (climateValues.values.length > 0) {
      console.log('\nPrimeros 3 registros:');
      climateValues.values.slice(0, 3).forEach(value => {
        console.log(`- Fecha: ${value.fecha}, Temp. Máx: ${value.tmax}°C, Temp. Mín: ${value.tmin}°C, Precipitación: ${value.prec}mm`);
      });
      
      console.log('\n4. Generando resumen climatológico...');
      const summary = await aemet.getClimateSummary({
        stationId: selectedStation.indicativo,
        startDate,
        endDate
      });
      
      console.log('\nResumen climatológico:');
      console.log(`- Estación: ${summary.station.nombre} (${summary.station.indicativo})`);
      console.log(`- Período: ${summary.period.start} a ${summary.period.end} (${summary.period.totalDays} días)`);
      console.log(`- Temperatura máxima: ${summary.temperature.max.value}°C (${summary.temperature.max.date})`);
      console.log(`- Temperatura mínima: ${summary.temperature.min.value}°C (${summary.temperature.min.date})`);
      console.log(`- Temperatura media: ${summary.temperature.avg.toFixed(1)}°C`);
      console.log(`- Precipitación total: ${summary.precipitation.total.toFixed(1)}mm`);
      console.log(`- Días con precipitación: ${summary.precipitation.daysWithPrecipitation}`);
      console.log(`- Velocidad media del viento: ${summary.wind.avgSpeed.toFixed(1)}m/s`);
      console.log(`- Racha máxima: ${summary.wind.maxSpeed.value}m/s (${summary.wind.maxSpeed.date})`);
    } else {
      console.log('No se encontraron datos para el período especificado.');
    }
    
  } catch (error) {
    console.error('Error al ejecutar el ejemplo:');
    console.error(error);
  }
}

// Ejecutamos el programa principal
main().then(() => console.log('\nPrograma finalizado.')); 