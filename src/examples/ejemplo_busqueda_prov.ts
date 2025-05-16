/**
 * Script para determinar con precisión la fecha más reciente 
 * con datos disponibles en la API de AEMET
 */

import { Aemet } from '../aemet';

// Creamos una instancia de Aemet con tu API key
const apiKey = "YOUR_API_KEY"; // Reemplaza con tu API key
const aemet = new Aemet(apiKey);

async function buscarProvincia(){
    console.log('=== BÚSQUEDA DE PROVINCIA ===');
    
    // Buscamos la provincia de Asturias
    const params = { 
      startDate: '2023-01-01', 
      endDate: '2023-01-15',
      stationId: '1249X' // Estación de Oviedo como ejemplo
    }; 
    const provincia = await aemet.getClimateSummaryByProvincia(params, 'Asturias');
    
    console.log('Provincia encontrada:', provincia);
}

buscarProvincia().catch(err => {
    console.error('Error en la ejecución:', err);
  }); 