/**
 * Ejemplo de uso de la API de AEMET para obtener la predicción simplificada
 */

import * as dotenv from 'dotenv';
import aemetClient from '../index';
import { Aemet } from '../aemet';

// Cargamos las variables de entorno desde .env
dotenv.config();

// Obtenemos la API key desde las variables de entorno
const API_KEY = process.env.AEMET_API_KEY;

if (!API_KEY) {
  console.error('Error: No se ha encontrado la API key. Asegúrate de tener un archivo .env con la variable AEMET_API_KEY.');
  process.exit(1);
}

// Inicializamos el cliente
const aemet: Aemet = aemetClient(API_KEY);

// Código del municipio de Madrid
const MUNICIPALITY_CODE = '28079';

async function main() {
  try {
    console.log(`Obteniendo predicción para el municipio ${MUNICIPALITY_CODE}...`);
    
    // Obtenemos la predicción simplificada
    const forecast = await aemet.getSimpleForecast(MUNICIPALITY_CODE);
    
    // Mostramos la información
    console.log('\nPredicción meteorológica para:', forecast.name, `(${forecast.province})`);
    
    console.log('\nHoy:');
    console.log(`  Estado: ${forecast.today.descripcion}`);
    console.log(`  Temperatura mínima: ${forecast.today.tmp.min}°C`);
    console.log(`  Temperatura máxima: ${forecast.today.tmp.max}°C`);
    
    console.log('\nMañana:');
    console.log(`  Estado: ${forecast.tomorrow.descripcion}`);
    console.log(`  Temperatura mínima: ${forecast.tomorrow.tmp.min}°C`);
    console.log(`  Temperatura máxima: ${forecast.tomorrow.tmp.max}°C`);
    
    console.log('\nPasado mañana:');
    console.log(`  Estado: ${forecast.next2.descripcion}`);
    console.log(`  Temperatura mínima: ${forecast.next2.tmp.min}°C`);
    console.log(`  Temperatura máxima: ${forecast.next2.tmp.max}°C`);
    
  } catch (error) {
    console.error('Error al obtener la predicción:', error);
  }
}

// Ejecutamos el programa
main(); 