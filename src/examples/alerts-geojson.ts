/**
 * Ejemplo de uso del método getAlertsGeoJSON para obtener alertas meteorológicas en formato GeoJSON
 * 
 * Para ejecutar este ejemplo:
 * 1. Configura tu API key en un archivo .env en la raíz del proyecto
 * 2. Ejecuta: npx ts-node src/examples/alerts-geojson.ts
 */

import { Aemet, AlertsGeoJSON } from '../aemet';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Recuperar la API key desde las variables de entorno
const apiKey = process.env.AEMET_API_KEY;

if (!apiKey) {
  console.error('Error: No se ha encontrado la API key de AEMET.');
  console.error('Crea un archivo .env en la raíz del proyecto con el siguiente contenido:');
  console.error('AEMET_API_KEY=tu_api_key');
  process.exit(1);
}

// Inicializar el cliente de AEMET
const aemet = new Aemet(apiKey);

/**
 * Función principal para obtener y procesar las alertas
 */
async function obtenerAlertasMeteorologicas() {
  try {
    console.log('Obteniendo alertas meteorológicas en formato GeoJSON...');
    const alertas: AlertsGeoJSON = await aemet.getAlertsGeoJSON();
    
    console.log(`\n✅ Se han encontrado ${alertas.features.length} alertas meteorológicas.`);
    
    // Mostrar información sobre las alertas
    console.log('\n📊 Resumen de alertas:');
    
    // Contadores por nivel de alerta
    const contadoresNivel = {
      amarillo: 0,
      naranja: 0,
      rojo: 0,
      desconocido: 0
    };
    
    // Contadores por tipo de fenómeno
    const fenomenos = new Map<string, number>();
    
    // Procesar cada alerta
    alertas.features.forEach((feature) => {
      // Incrementar contador de nivel
      const nivel = feature.properties.nivel.toLowerCase();
      if (nivel === 'amarillo' || nivel === 'naranja' || nivel === 'rojo') {
        contadoresNivel[nivel]++;
      } else {
        contadoresNivel.desconocido++;
      }
      
      // Extraer tipo de fenómeno (la primera parte antes del ';')
      const fenomeno = feature.properties.fenomeno.split(';')[0];
      if (fenomeno) {
        fenomenos.set(fenomeno, (fenomenos.get(fenomeno) || 0) + 1);
      }
    });
    
    // Mostrar contadores por nivel
    console.log('\n🚨 Alertas por nivel:');
    console.log(`  - Nivel rojo: ${contadoresNivel.rojo}`);
    console.log(`  - Nivel naranja: ${contadoresNivel.naranja}`);
    console.log(`  - Nivel amarillo: ${contadoresNivel.amarillo}`);
    if (contadoresNivel.desconocido > 0) {
      console.log(`  - Nivel desconocido: ${contadoresNivel.desconocido}`);
    }
    
    // Mostrar contadores por fenómeno
    console.log('\n🌩️ Alertas por fenómeno:');
    fenomenos.forEach((count, fenomeno) => {
      console.log(`  - ${fenomeno}: ${count}`);
    });
    
    // Mostrar detalles de alertas de nivel rojo o naranja (las más graves)
    const alertasGraves = alertas.features.filter(
      feature => ['rojo', 'naranja'].includes(feature.properties.nivel.toLowerCase())
    );
    
    if (alertasGraves.length > 0) {
      console.log('\n⚠️ Detalles de alertas graves (nivel rojo o naranja):');
      alertasGraves.forEach((alerta, index) => {
        console.log(`\n[${index + 1}] Alerta ${alerta.properties.nivel.toUpperCase()}`);
        console.log(`  - Fenómeno: ${alerta.properties.fenomeno}`);
        console.log(`  - Área: ${alerta.properties.areaDesc || 'No especificada'}`);
        console.log(`  - Descripción: ${alerta.properties.descripcion || 'No disponible'}`);
        console.log(`  - Probabilidad: ${alerta.properties.probabilidad || 'No especificada'}`);
        
        // Formatear fechas si están disponibles
        if (alerta.properties.onset) {
          const inicio = new Date(alerta.properties.onset);
          console.log(`  - Inicio: ${inicio.toLocaleString('es-ES')}`);
        }
        
        if (alerta.properties.expires) {
          const fin = new Date(alerta.properties.expires);
          console.log(`  - Fin: ${fin.toLocaleString('es-ES')}`);
        }
      });
    } else {
      console.log('\n✅ No hay alertas de nivel rojo o naranja actualmente.');
    }
    
  } catch (error) {
    console.error('❌ Error al obtener las alertas meteorológicas:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
obtenerAlertasMeteorologicas(); 