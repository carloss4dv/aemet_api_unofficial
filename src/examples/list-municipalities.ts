/**
 * Ejemplo de uso de la API de AEMET para listar los municipios disponibles
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

async function main() {
  try {
    console.log('Obteniendo lista de municipios...');
    
    // Obtenemos la lista de municipios
    const municipalities = await aemet.getMunicipalities();
    
    // Mostramos la cantidad total de municipios
    console.log(`\nTotal de municipios: ${municipalities.length}`);
    
    // Mostramos los primeros 5 municipios como ejemplo
    console.log('\nPrimeros 5 municipios:');
    municipalities.slice(0, 5).forEach(muni => {
      console.log(`  - ${muni.nombre} (${muni.provincia}), Código: ${muni.id}`);
    });
    
  } catch (error) {
    console.error('Error al obtener los municipios:', error);
  }
}

// Ejecutamos el programa
main(); 