/**
 * Script para determinar con precisión la fecha más reciente 
 * con datos disponibles en la API de AEMET
 */

import { Aemet } from './aemet';

// Creamos una instancia de Aemet con tu API key
const apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NDg0ODFAdW5pemFyLmVzIiwianRpIjoiYmE5ZWY3NmEtYjBiMC00MWE1LTkxNjAtMmUxMTFmMjM0ZjlmIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NDI1NzEzODksInVzZXJJZCI6ImJhOWVmNzZhLWIwYjAtNDFhNS05MTYwLTJlMTExZjIzNGY5ZiIsInJvbGUiOiIifQ.uTR2vmhfRLnyk1oE1mBsq3PhXm7qQGzu3xP80ERTNak"; // Reemplaza con tu API key
const aemet = new Aemet(apiKey);


async function buscarUltimaFechaDisponible() {
  
  console.log('=== BÚSQUEDA SISTEMÁTICA DE DATOS CLIMATOLÓGICOS DISPONIBLES ===');
  
  // Empezamos por el año actual y vamos retrocediendo
  const añoActual = new Date().getFullYear();
  
  // Array para almacenar resultados
  const resultados = [];
  
  // Probamos cada mes del año actual y el anterior
  for (let año = añoActual; año >= añoActual - 1; año--) {
    for (let mes = 11; mes >= 0; mes--) {
      // Si estamos en el año actual, solo probamos hasta el mes actual
      if (año === añoActual && mes > new Date().getMonth()) {
        continue;
      }
      
      try {
        // Creamos un rango del 1 al 15 de cada mes
        const fechaInicio = new Date(año, mes, 1);
        const fechaFin = new Date(año, mes, 15);
        
        console.log(`\nProbando del 1 al 15 de ${mes + 1}/${año}...`);
        
        const datos = await aemet.getClimateValues({
          startDate: fechaInicio.toISOString().split('T')[0],
          endDate: fechaFin.toISOString().split('T')[0]
        });
        
        if (datos.values && datos.values.length > 0) {
          console.log(`✅ DATOS ENCONTRADOS para ${mes + 1}/${año}`);
          console.log(`Total días con datos: ${datos.values.length}`);
          
          // Ordenamos por fecha (más reciente primero)
          const fechasMasRecientes = [...datos.values]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 3);
          
          console.log('Fechas más recientes disponibles:');
          fechasMasRecientes.forEach(valor => {
            console.log(`- ${valor.fecha}: Tmáx=${valor.tmax}°C, Tmín=${valor.tmin}°C`);
          });
          
          resultados.push({
            año,
            mes: mes + 1,
            fechasMasRecientes: fechasMasRecientes.map(v => v.fecha)
          });
          
          // Si encontramos datos para este mes, vamos al siguiente mes
          break;
        } else {
          console.log(`❌ No hay datos para ${mes + 1}/${año}`);
        }
      } catch (error) {
        console.error(`Error para ${mes + 1}/${año}:`, error instanceof Error ? error.message : error);
      }
      
      // Probamos ahora del 16 al último día del mes
      try {
        const fechaInicio = new Date(año, mes, 16);
        const ultimoDia = new Date(año, mes + 1, 0).getDate(); // Último día del mes
        const fechaFin = new Date(año, mes, ultimoDia);
        
        console.log(`\nProbando del 16 al ${ultimoDia} de ${mes + 1}/${año}...`);
        
        const datos = await aemet.getClimateValues({
          startDate: fechaInicio.toISOString().split('T')[0],
          endDate: fechaFin.toISOString().split('T')[0]
        });
        
        if (datos.values && datos.values.length > 0) {
          console.log(`✅ DATOS ENCONTRADOS para ${mes + 1}/${año} (segunda quincena)`);
          console.log(`Total días con datos: ${datos.values.length}`);
          
          // Ordenamos por fecha (más reciente primero)
          const fechasMasRecientes = [...datos.values]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 3);
          
          console.log('Fechas más recientes disponibles:');
          fechasMasRecientes.forEach(valor => {
            console.log(`- ${valor.fecha}: Tmáx=${valor.tmax}°C, Tmín=${valor.tmin}°C`);
          });
          
          resultados.push({
            año,
            mes: mes + 1,
            segundaQuincena: true,
            fechasMasRecientes: fechasMasRecientes.map(v => v.fecha)
          });
          
          // Si encontramos datos para este mes, vamos al siguiente mes
          break;
        } else {
          console.log(`❌ No hay datos para ${mes + 1}/${año} (segunda quincena)`);
        }
      } catch (error) {
        console.error(`Error para ${mes + 1}/${año} (segunda quincena):`, error instanceof Error ? error.message : error);
      }
    }
    
    // Si hemos encontrado al menos 3 meses con datos, es suficiente
    if (resultados.length >= 3) {
      break;
    }
  }
  
  // Mostramos resumen de resultados
  console.log('\n=== RESUMEN DE DISPONIBILIDAD DE DATOS ===');
  if (resultados.length > 0) {
    console.log('Fechas más recientes con datos disponibles:');
    resultados.sort((a, b) => {
      if (a.año !== b.año) return b.año - a.año;
      if (a.mes !== b.mes) return b.mes - a.mes;
      return (b.segundaQuincena ? 1 : 0) - (a.segundaQuincena ? 1 : 0);
    });
    
    resultados.forEach((resultado, index) => {
      console.log(`${index + 1}. ${resultado.mes}/${resultado.año}${resultado.segundaQuincena ? ' (segunda quincena)' : ' (primera quincena)'}`);
      console.log(`   Fechas disponibles: ${resultado.fechasMasRecientes.join(', ')}`);
    });
    
    console.log(`\n➡️ Fecha más reciente con datos: ${resultados[0].fechasMasRecientes[0]}`);
  } else {
    console.log('❌ No se encontraron datos en el período analizado.');
    console.log('Intenta probar con años anteriores o con otra estación meteorológica.');
  }
}

// Ejecutamos la búsqueda
buscarUltimaFechaDisponible().catch(err => {
  console.error('Error en la ejecución:', err);
}); 