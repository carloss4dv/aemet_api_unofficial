const https = require('https');

// API Key de AEMET 
const apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4NDg0ODFAdW5pemFyLmVzIiwianRpIjoiYmE5ZWY3NmEtYjBiMC00MWE1LTkxNjAtMmUxMTFmMjM0ZjlmIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3NDI1NzEzODksInVzZXJJZCI6ImJhOWVmNzZhLWIwYjAtNDFhNS05MTYwLTJlMTExZjIzNGY5ZiIsInJvbGUiOiIifQ.uTR2vmhfRLnyk1oE1mBsq3PhXm7qQGzu3xP80ERTNak";

// URL del endpoint de estaciones
const stationsUrl = 'https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/';

// Función para realizar la petición HTTP
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'api_key': apiKey,
        'Accept': 'application/json'
      }
    };

    console.log('Realizando petición a:', url);
    
    https.get(url, options, (res) => {
      let data = '';
      
      console.log('Código de estado:', res.statusCode);
      console.log('Cabeceras de respuesta:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Respuesta completa recibida');
        
        if (data.length > 0) {
          try {
            // Intentar parsear como JSON
            const jsonData = JSON.parse(data);
            console.log('Datos parseados como JSON correctamente');
            resolve(jsonData);
          } catch (e) {
            console.log('No se pudo parsear como JSON. Error:', e.message);
            console.log('Primeros 500 caracteres de los datos:', data.substring(0, 500));
            resolve(data);
          }
        } else {
          console.log('La respuesta no contiene datos');
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error('Error en la petición HTTP:', e.message);
      reject(e);
    });
  });
}

async function main() {
  try {
    console.log('=== PROBANDO ENDPOINT DE ESTACIONES METEOROLÓGICAS ===');
    
    // Primera petición para obtener las URLs
    console.log('\n1. Obteniendo URL de datos:');
    const apiResponse = await httpGet(stationsUrl);
    
    if (!apiResponse) {
      console.log('No se recibió respuesta válida del endpoint principal');
      return;
    }
    
    console.log('\nRespuesta de la API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    if (apiResponse.estado === 200 && apiResponse.datos) {
      // Segunda petición para obtener los datos reales
      console.log('\n2. Obteniendo datos desde la URL proporcionada:');
      const dataUrl = apiResponse.datos;
      
      console.log('URL de datos:', dataUrl);
      const stationsData = await httpGet(dataUrl);
      
      if (stationsData) {
        if (Array.isArray(stationsData)) {
          console.log(`\nSe encontraron ${stationsData.length} estaciones`);
          console.log('Primeras 3 estaciones:');
          console.log(JSON.stringify(stationsData.slice(0, 3), null, 2));
        } else {
          console.log('\nLos datos no son un array. Tipo:', typeof stationsData);
          if (typeof stationsData === 'object') {
            console.log(JSON.stringify(stationsData, null, 2));
          }
        }
      } else {
        console.log('No se obtuvieron datos de estaciones');
      }
    } else {
      console.log('La API no devolvió un estado 200 o no contiene URL de datos');
    }
  } catch (error) {
    console.error('Error en la ejecución:', error);
  }
}

// Ejecutar el programa
main(); 