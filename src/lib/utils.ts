/**
 * Utilidades para la librería de AEMET
 */

import axios from 'axios';
import { SKY_STATES } from './constants';

/**
 * Realizar una petición GET a la API de AEMET y descargar los datos
 * @param url - URL del endpoint de la API
 * @param apiKey - Clave de API AEMET
 * @param timeout - Timeout para la petición en milisegundos
 * @returns - Datos procesados de la respuesta con número de intentos realizados
 */
export async function fetchAemetData(url: string, apiKey: string, timeout: number = 10000): Promise<any> {
  const MAX_RETRIES = 12;
  let intentos = 1;
  let lastError: Error | null = null;

  while (intentos <= MAX_RETRIES) {
    try {
      console.log(`Intento ${intentos} - Petición a: ${url}`);
      
      // Realizamos la petición inicial para obtener los URLs de datos y metadatos
      const apiResponse = await axios.get(url, {
        headers: {
          'api_key': apiKey,
          'accept': 'application/json'
        },
        timeout,
        responseType: 'text', // Para manejar tanto JSON como texto plano
      });

      // Manejamos el caso especial de AEMET que puede devolver 200 con cuerpo vacío
      if (apiResponse.status === 200 && (!apiResponse.data || (typeof apiResponse.data === 'string' && apiResponse.data.trim() === ""))) {
        throw new Error('La API devolvió una respuesta vacía. Verifique que la URL y la API key sean correctas.');
      }
      
      // Si la respuesta es texto plano pero parece contener JSON, intentamos parsearlo
      let responseData = apiResponse.data;
      if (typeof apiResponse.data === 'string' && 
          apiResponse.headers['content-type']?.includes('text/plain') &&
          apiResponse.data.trim().startsWith('{')) {
        try {
          responseData = JSON.parse(apiResponse.data);
        } catch (parseError) {
          console.error('Error al parsear respuesta como JSON');
        }
      }
      
      responseData = JSON.parse(responseData);

      // Valores climatológicos: AEMET devuelve estado = 0 como indicador de éxito
      // El formato es: { "descripcion": "exito", "estado": 200, "datos": URL, "metadatos": URL }
      if (responseData) {
        const dataUrl = responseData.datos;
        if (!dataUrl) {
          throw new Error('URL de datos no disponible en la respuesta de la API');
        }
        
        // Si datos es una URL, la descargamos
        if (typeof dataUrl === 'string' && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://'))) {
          console.log(`Descargando datos desde URL`);
          try {
            const response = await axios.get(dataUrl, { 
              timeout,
              headers: {
                'accept': 'application/json'
              },
              responseType: 'text' // Para manejar tanto JSON como texto plano
            });
            
            // Intentar parsear si es texto plano pero parece ser JSON
            let data = response.data;
            if (typeof response.data === 'string' && 
                response.headers['content-type']?.includes('text/plain') &&
                (response.data.trim().startsWith('[') || response.data.trim().startsWith('{'))) {
              try {
                data = JSON.parse(response.data);
              } catch (parseError) {
                console.error('Error al parsear datos como JSON');
              }
            }
            
            // Añadir el número de intentos realizados a los datos
            if (typeof data === 'object' && data !== null) {
              data.intentos = intentos;
            } else if (Array.isArray(data)) {
              // Si es un array, añadimos los intentos a cada elemento si son objetos
              data = data.map(item => {
                if (typeof item === 'object' && item !== null) {
                  return { ...item, intentos };
                }
                return item;
              });
            } else {
              // Si no es un objeto ni un array, envolvemos el resultado
              data = { data, intentos };
            }
            
            return data;
          } catch (dataError) {
            console.error('Error al obtener los datos');
            if (axios.isAxiosError(dataError) && dataError.response) {
              console.error(`Error: ${dataError.response.status}`);
            }
            throw new Error(`Error al acceder a la URL de datos: ${dataError instanceof Error ? dataError.message : 'Error desconocido'}`);
          }
        } else {
          // Si datos no es una URL sino directamente la información
          responseData.intentos = intentos;
          return responseData; // Devolver el objeto completo con { "descripcion": "Éxito", "estado": 0, "datos": ..., "metadatos": ..., "intentos": ... }
        }
      } else {
        throw new Error(`Error en la respuesta de la API: ${responseData?.descripcion || 'Sin descripción'} (Estado: ${responseData?.estado || apiResponse.status})`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      
      // Verificar si el error es "socket hang up" para reintentar
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const isSocketHangUp = errorMessage.includes('socket hang up');
      
      if (isSocketHangUp && intentos < MAX_RETRIES) {
        console.log(`Error "socket hang up". Reintentando (${intentos}/${MAX_RETRIES})...`);
        // Esperar un tiempo antes de reintentar (tiempo exponencial)
        const retryDelay = Math.min(1000 * Math.pow(2, intentos - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        intentos++;
        continue;
      }
      
      if (axios.isAxiosError(error)) {
        console.error('Error de Axios:', error.message);
        
        if (error.response) {
          // Verificar si la respuesta es un HTML (error de Tomcat)
          const contentType = error.response.headers['content-type'];
          if (contentType && contentType.includes('text/html')) {
            // En caso de respuesta HTML, proporcionar un mensaje más claro
            if (error.response.status === 404) {
              throw new Error(`Recurso no encontrado (404). Verifique que los parámetros sean correctos y que no esté solicitando datos futuros.`);
            } else {
              throw new Error(`Error del servidor (${error.response.status}). Intente más tarde.`);
            }
          } else {
            throw new Error(`Error en la petición a la API: ${error.response.status}`);
          }
        } else if (error.request) {
          throw new Error(`No se recibió respuesta de la API: ${error.message}`);
        } else {
          throw new Error(`Error al configurar la petición a la API: ${error.message}`);
        }
      }
      throw lastError;
    }
  }
  
  // Si llegamos aquí, es porque se agotaron los reintentos
  throw new Error(`Se agotaron los reintentos (${MAX_RETRIES}). Último error: ${lastError?.message || 'Desconocido'}`);
}

/**
 * Obtener descripción del estado del cielo a partir de su código
 * @param code - Código del estado del cielo
 * @returns - Descripción del estado del cielo
 */
export function getSkyStateDescription(code: string): string {
  return SKY_STATES[code] || 'Desconocido';
}

/**
 * Formatea una fecha como YYYY-MM-DD
 * @param date - Fecha a formatear
 * @returns - Fecha formateada
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Extrae la predicción para un día específico
 * @param forecast - Datos completos de la predicción
 * @param date - Fecha para la que se quiere la predicción (o 0 para hoy, 1 para mañana, 2 para pasado mañana)
 * @returns - Predicción para el día especificado
 */
export function getDayForecast(forecast: any[], date: Date | number): any {
  if (typeof date === 'number') {
    const today = new Date();
    today.setDate(today.getDate() + date);
    date = today;
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  const dateStr = formatDate(date);
  
  if (!forecast || !Array.isArray(forecast)) {
    throw new Error('El forecast no es un array válido');
  }
  
  return forecast.find((day) => day && day.fecha === dateStr);
}

/**
 * Descargar un archivo binario desde la API de AEMET
 * Especialmente útil para archivos como .tar que no son JSON
 * @param url - URL del endpoint de la API
 * @param apiKey - Clave de API AEMET
 * @param timeout - Timeout para la petición en milisegundos
 * @returns - Buffer con los datos binarios del archivo y número de intentos realizados
 */
export async function fetchAemetBinaryFile(url: string, apiKey: string, timeout: number = 10000): Promise<{data: Buffer, intentos: number}> {
  const MAX_RETRIES = 12;
  let intentos = 1;
  let lastError: Error | null = null;

  while (intentos <= MAX_RETRIES) {
    try {
      console.log(`Intento ${intentos} - Petición a: ${url}`);
      
      // Realizamos la petición inicial para obtener la URL de datos
      const apiResponse = await axios.get(url, {
        headers: {
          'api_key': apiKey,
          'accept': 'application/json'
        },
        timeout: 15000, // Aumentamos el timeout para la petición inicial
        responseType: 'json'
      });

      // Verificar la respuesta
      if (!apiResponse.data || !apiResponse.data.datos) {
        throw new Error('URL de datos no disponible en la respuesta de la API');
      }
      
      const dataUrl = apiResponse.data.datos;
      console.log(`Descargando archivo binario desde URL: ${dataUrl}`);
      
      // Descargar el archivo binario
      try {
        const response = await axios.get(dataUrl, {
          responseType: 'arraybuffer',
          timeout: timeout,
          // No establecemos headers de 'accept' porque queremos los datos binarios tal cual
        });
        
        // Verificar que los datos recibidos no estén vacíos
        if (!response.data || response.data.byteLength === 0) {
          throw new Error('Se recibió un archivo vacío');
        }
        
        const contentType = response.headers['content-type'];
        console.log(`Archivo descargado correctamente. Content-Type: ${contentType}, Tamaño: ${response.data.byteLength} bytes`);
        
        // Devolver los datos binarios como Buffer
        return {
          data: Buffer.from(response.data),
          intentos
        };
      } catch (downloadError) {
        console.error('Error al descargar el archivo binario:', downloadError);
        
        if (intentos < MAX_RETRIES) {
          const retryDelay = Math.min(1000 * Math.pow(2, intentos - 1), 10000);
          console.log(`Reintentando la descarga en ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          intentos++;
          continue;
        }
        
        throw downloadError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      
      // Verificar si el error es "socket hang up" para reintentar
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const isSocketHangUp = errorMessage.includes('socket hang up') || errorMessage.includes('timeout');
      
      if (isSocketHangUp && intentos < MAX_RETRIES) {
        console.log(`Error "${errorMessage}". Reintentando (${intentos}/${MAX_RETRIES})...`);
        // Esperar un tiempo antes de reintentar (tiempo exponencial)
        const retryDelay = Math.min(1000 * Math.pow(2, intentos - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        intentos++;
        continue;
      }
      
      if (axios.isAxiosError(error)) {
        console.error('Error de Axios:', error.message);
        
        if (error.response) {
          // Verificar si la respuesta es un HTML (error de Tomcat)
          const contentType = error.response.headers['content-type'];
          if (contentType && contentType.includes('text/html')) {
            // En caso de respuesta HTML, proporcionar un mensaje más claro
            if (error.response.status === 404) {
              throw new Error(`Recurso no encontrado (404). Verifique que los parámetros sean correctos.`);
            } else {
              throw new Error(`Error del servidor (${error.response.status}). Intente más tarde.`);
            }
          } else {
            throw new Error(`Error en la petición a la API: ${error.response.status}`);
          }
        } else if (error.request) {
          throw new Error(`No se recibió respuesta de la API: ${error.message}`);
        } else {
          throw new Error(`Error al configurar la petición a la API: ${error.message}`);
        }
      }
      throw lastError;
    }
  }
  
  // Si llegamos aquí, es porque se agotaron los reintentos
  throw new Error(`Se agotaron los reintentos (${MAX_RETRIES}). Último error: ${lastError?.message || 'Desconocido'}`);
} 