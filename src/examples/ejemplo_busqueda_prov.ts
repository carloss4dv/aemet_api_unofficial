/**
 * Script para determinar con precisión la fecha más reciente 
 * con datos disponibles en la API de AEMET
 */

import { Aemet } from '../aemet';

// Creamos una instancia de Aemet con tu API key
const apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NDg0ODFAdW5pemFyLmVzIiwianRpIjoiYmE5ZWY3NmEtYjBiMC00MWE1LTkxNjAtMmUxMTFmMjM0ZjlmIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NDI1NzEzODksInVzZXJJZCI6ImJhOWVmNzZhLWIwYjAtNDFhNS05MTYwLTJlMTExZjIzNGY5ZiIsInJvbGUiOiIifQ.uTR2vmhfRLnyk1oE1mBsq3PhXm7qQGzu3xP80ERTNak"; // Reemplaza con tu API key
const aemet = new Aemet(apiKey);

async function buscarProvincia(){
    console.log('=== BÚSQUEDA DE PROVINCIA ===');
    
    // Buscamos la provincia de Cádiz
    const params = { startDate: '2023-01-01', endDate: '2023-01-15' }; // Define appropriate params
    const provincia = await aemet.getClimateSummaryByProvincia(params, 'Asturias');
    
    console.log('Provincia encontrada:', provincia);
}

buscarProvincia().catch(err => {
    console.error('Error en la ejecución:', err);
  }); 