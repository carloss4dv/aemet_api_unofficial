const https = require('https');

// API Key de AEMET - Es posible que esta clave ya no sea válida o esté caducada
const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYWJsb2FtLnNvZnR3YXJlQGdtYWlsLmNvbSIsImp0aSI6IjliYjcyNTUxLWQxZmEtNGM3ZC05ZWViLTNkOWMyYWJmMDAzZiIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNjc5MzA0MzU1LCJ1c2VySWQiOiI5YmI3MjU1MS1kMWZhLTRjN2QtOWVlYi0zZDljMmFiZjAwM2YiLCJyb2xlIjoiIn0.MIl47Cxt6JXFv76-jAQv5d9P5qfD4E53aJCQO_JYCBo';

// Función para hacer peticiones HTTP
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'api_key': apiKey,
        'Accept': 'application/json'
      }
    };

    console.log('Realizando petición a:', url);
    console.log('Con API key:', apiKey);

    https.get(url, options, (res) => {
      let data = '';
      
      // Mostrar información sobre redirección
      console.log('Código de estado:', res.statusCode);
      console.log('Cabeceras de respuesta:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 401) {
            console.log('Error de autenticación: La API key parece ser inválida o ha expirado');
            resolve(null);
            return;
          }
          
          if (res.statusCode === 404) {
            console.log('Recurso no encontrado. Verifica la URL:', url);
            resolve(null);
            return;
          }
          
          // Intentar parsear como JSON
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (e) {
            console.log('No se pudo parsear como JSON, devolviendo datos crudos');
            console.log('Primeros 200 caracteres de los datos:', data.substring(0, 200));
            resolve(data);
          }
        } catch (e) {
          console.log('Error al procesar respuesta:', e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error('Error de red:', e.message);
      reject(e);
    });
  });
}

// Función para obtener datos de URL
async function fetchAemetData(url) {
  try {
    console.log('Consultando URL:', url);
    const response = await httpGet(url);
    
    // Si no hay respuesta o hay un error
    if (!response) {
      console.log('No se recibió una respuesta válida');
      return null;
    }
    
    // Si es una respuesta de la API que contiene URL de datos
    if (response && response.datos) {
      console.log('URL de datos:', response.datos);
      console.log('URL de metadatos:', response.metadatos);
      
      // Obtenemos los datos de la URL proporcionada
      console.log('\nObteniendo datos de la URL...');
      const data = await httpGet(response.datos);
      return data;
    }
    
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Función principal
async function main() {
  try {
    console.log('NOTA: Es posible que la API key esté caducada o sea inválida.');
    console.log('Si los tests fallan, necesitarás obtener una nueva API key de AEMET.\n');
    
    // 1. Probar con Swagger UI URL para verificar el formato
    console.log('=== VERIFICANDO FORMATO DE RESPUESTA CON SWAGGER UI ===');
    console.log('La documentación de AEMET indica que primero se obtiene una URL de redirección');
    console.log('y luego hay que hacer una segunda petición a esa URL para obtener los datos reales.\n');
    
    // 2. Obtener estaciones
    console.log('=== OBTENIENDO LISTADO DE ESTACIONES ===');
    const stationsUrl = 'https://opendata.aemet.es/opendata/api/valores/climatologicos/inventarioestaciones/todasestaciones/';
    const stations = await fetchAemetData(stationsUrl);
    
    if (stations && Array.isArray(stations)) {
      console.log(`Se encontraron ${stations.length} estaciones.`);
      console.log('Primeras 2 estaciones:', JSON.stringify(stations.slice(0, 2), null, 2));
    }
    
    // 3. Obtener valores climatológicos usando una estación real
    console.log('\n=== OBTENIENDO VALORES CLIMATOLÓGICOS DIARIOS ===');
    // Estación de Madrid Retiro (3195)
    const climateUrl = 'https://opendata.aemet.es/opendata/api/valores/climatologicos/diarios/datos?estacion=3195&fechaini=2023-01-01T00:00:00UTC&fechafin=2023-01-31T23:59:59UTC';
    const climateData = await fetchAemetData(climateUrl);
    
    if (climateData && Array.isArray(climateData)) {
      console.log(`Se encontraron ${climateData.length} registros.`);
      console.log('Primeros 2 registros:', JSON.stringify(climateData.slice(0, 2), null, 2));
    }
  } catch (error) {
    console.error('Error en el programa principal:', error);
  }
}

// Ejecutar el programa
main(); 