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
  const MAX_RETRIES = 6;
  let intentos = 1;
  let lastError: Error | null = null;

  while (intentos <= MAX_RETRIES) {
    try {
      console.log(`Intento ${intentos} - Realizando petición a: ${url}`);
      
      // Realizamos la petición inicial para obtener los URLs de datos y metadatos
      const apiResponse = await axios.get(url, {
        headers: {
          'api_key': apiKey,
          'accept': 'application/json'
        },
        timeout,
        responseType: 'text', // Para manejar tanto JSON como texto plano
      });


      console.log('Respuesta recibida. Estado:', apiResponse.status);
      console.log('Tipo de contenido:', apiResponse.headers['content-type']);
      
      // Manejamos el caso especial de AEMET que puede devolver 200 con cuerpo vacío
      if (apiResponse.status === 200 && (!apiResponse.data || (typeof apiResponse.data === 'string' && apiResponse.data.trim() === ""))) {
        console.log('Respuesta vacía recibida con estado 200.');
        // En lugar de simular una respuesta, lanzamos un error para manejar este caso
        throw new Error('La API devolvió una respuesta vacía. Verifique que la URL y la API key sean correctas.');
      }
      
      // Si la respuesta es texto plano pero parece contener JSON, intentamos parsearlo
      let responseData = apiResponse.data;
      if (typeof apiResponse.data === 'string' && 
          apiResponse.headers['content-type']?.includes('text/plain') &&
          apiResponse.data.trim().startsWith('{')) {
        try {
          console.log('Intentando parsear respuesta de texto plano como JSON...');
          responseData = JSON.parse(apiResponse.data);
          console.log('Parseo exitoso, respuesta convertida a objeto JSON');
        } catch (parseError) {
          console.error('Error al parsear respuesta como JSON:', parseError);
          console.log('Contenido de la respuesta:', apiResponse.data);
        }
      }
      
      responseData = JSON.parse(responseData);
      // Verificar si es un objeto y mostrarlo para depuración
      console.log('Tipo de respuesta:', typeof responseData);
      console.log('Contenido de la respuesta:', responseData);
      console.log('Contenido de la respuesta:', JSON.stringify(responseData));
      

      // Valores climatológicos: AEMET devuelve estado = 0 como indicador de éxito
      // El formato es: { "descripcion": "exito", "estado": 200, "datos": URL, "metadatos": URL }
      if (responseData) {
        // Para el caso específico donde la descripción sea "Éxito" y estado sea 0
        // esto corresponde a los valores climatológicos con periodicidad diaria
        if (responseData.estado === 200 && responseData.descripcion === "exito") {
          console.log("Respuesta exitosa de valores climatológicos con estado 0");
        }
        
        const dataUrl = responseData.datos;
        console.log('URL de datos:', dataUrl);
        if (!dataUrl) {
          throw new Error('URL de datos no disponible en la respuesta de la API');
        }
        
        // Si datos es una URL, la descargamos
        if (typeof dataUrl === 'string' && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://'))) {
          console.log(`Descargando datos desde: ${dataUrl}`);
          try {
            const response = await axios.get(dataUrl, { 
              timeout,
              headers: {
                'accept': 'application/json'
              },
              responseType: 'text' // Para manejar tanto JSON como texto plano
            });
            
            console.log('Datos obtenidos correctamente. Tipo de contenido:', response.headers['content-type']);
            
            // Intentar parsear si es texto plano pero parece ser JSON
            let data = response.data;
            if (typeof response.data === 'string' && 
                response.headers['content-type']?.includes('text/plain') &&
                (response.data.trim().startsWith('[') || response.data.trim().startsWith('{'))) {
              try {
                console.log('Intentando parsear datos de texto plano como JSON...');
                data = JSON.parse(response.data);
                console.log('Parseo exitoso, datos convertidos a objeto JSON');
              } catch (parseError) {
                console.error('Error al parsear datos como JSON:', parseError);
              }
            }

            console.log('Datos obtenidos:', data);
            
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
            console.error('Error al obtener los datos:', dataError);
            if (axios.isAxiosError(dataError) && dataError.response) {
              console.error('Detalles de error en datos:', dataError.response.status, JSON.stringify(dataError.response.data));
            }
            throw new Error(`Error al acceder a la URL de datos: ${dataError instanceof Error ? dataError.message : 'Error desconocido'}`);
          }
        } else {
          // Si datos no es una URL sino directamente la información
          console.log('El campo "datos" contiene directamente la información, no una URL');
          // Añadir el número de intentos al objeto de respuesta
          responseData.intentos = intentos;
          return responseData; // Devolver el objeto completo con { "descripcion": "Éxito", "estado": 0, "datos": ..., "metadatos": ..., "intentos": ... }
        }
      } else {
        console.error('Error en la respuesta:', JSON.stringify(responseData));
        throw new Error(`Error en la respuesta de la API: ${responseData?.descripcion || 'Sin descripción'} (Estado: ${responseData?.estado || apiResponse.status})`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      
      // Verificar si el error es "socket hang up" para reintentar
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const isSocketHangUp = errorMessage.includes('socket hang up');
      
      if (isSocketHangUp && intentos < MAX_RETRIES) {
        console.log(`Error "socket hang up" detectado. Reintentando (${intentos}/${MAX_RETRIES})...`);
        // Esperar un tiempo antes de reintentar (tiempo exponencial)
        const retryDelay = Math.min(1000 * Math.pow(2, intentos - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        intentos++;
        continue;
      }
      
      if (axios.isAxiosError(error)) {
        console.error('Error de Axios:', error.message);
        
        if (error.response) {
          console.error('Respuesta de error:', error.response.status, JSON.stringify(error.response.data));
          
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
            throw new Error(`Error en la petición a la API: ${error.response.status} - ${JSON.stringify(error.response.data) || 'Sin datos'}`);
          }
        } else if (error.request) {
          console.error('No se recibió respuesta');
          throw new Error(`No se recibió respuesta de la API: ${error.message}`);
        } else {
          console.error('Error al configurar la petición');
          throw new Error(`Error al configurar la petición a la API: ${error.message}`);
        }
      }
      console.error('Error desconocido:', error);
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