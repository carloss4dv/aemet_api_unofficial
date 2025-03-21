/**
 * Prueba básica de conectividad con la API de AEMET
 */

import * as dotenv from 'dotenv';
import axios from 'axios';

// Cargamos las variables de entorno desde .env
dotenv.config();

// Obtenemos la API key desde las variables de entorno
const API_KEY = process.env.AEMET_API_KEY || '';

if (!API_KEY) {
  console.error('Error: No se ha encontrado la API key.');
  process.exit(1);
}

async function testApiConnection() {
  try {
    // URL base de la API de AEMET
    const baseUrl = 'https://opendata.aemet.es/opendata/api';
    
    console.log('Probando la conexión a la API de AEMET...');
    console.log('API Key (primeros 10 caracteres):', API_KEY.substring(0, 10) + '...');
    
    // Intentamos hacer una petición simple para comprobar la conectividad
    const response = await axios.get(`${baseUrl}/maestro/municipios/`, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json'
      },
      timeout: 30000,
      validateStatus: () => true // Aceptamos cualquier código de estado para ver el resultado
    });
    
    console.log('Código de estado HTTP:', response.status);
    console.log('Cabeceras de respuesta:', JSON.stringify(response.headers, null, 2));
    console.log('Datos de respuesta:', JSON.stringify(response.data, null, 2));
    
    // También probamos el endpoint de información de la API
    console.log('\nProbando endpoint de información de la API...');
    const infoResponse = await axios.get(`${baseUrl}/swagger.json`, {
      validateStatus: () => true
    });
    
    console.log('Código de estado HTTP (info):', infoResponse.status);
    if (infoResponse.status === 200) {
      console.log('La documentación de la API está disponible');
    } else {
      console.log('Error al acceder a la documentación de la API');
    }
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error de conexión:', error.message);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
      }
    } else {
      console.error('Error desconocido:', error);
    }
  }
}

// Ejecutamos la prueba
testApiConnection(); 