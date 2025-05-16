import nock from 'nock';
import { fetchAemetData } from '../lib/utils';

describe('API AEMET', () => {
  const apiKey = 'api-key-de-prueba';
  const baseUrl = 'https://opendata.aemet.es/opendata/api';
  const endpoint = '/test/endpoint';
  const dataUrl = 'https://opendata.aemet.es/opendata/datos/test-data';
  
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchAemetData', () => {
    it('debe hacer la petición correcta y devolver los datos', async () => {
      // Simulamos la primera petición a la API
      nock(baseUrl)
        .get(endpoint)
        .matchHeader('api_key', apiKey)
        .reply(200, {
          descripcion: 'Respuesta correcta',
          estado: 200,
          datos: dataUrl,
          metadatos: 'https://opendata.aemet.es/opendata/metadatos/test-metadata'
        });

      // Simulamos la segunda petición al URL de datos
      nock('https://opendata.aemet.es')
        .get('/opendata/datos/test-data')
        .reply(200, '{"testData":"datos de ejemplo"}', {
          'Content-Type': 'text/plain'
        });

      const result = await fetchAemetData(`${baseUrl}${endpoint}`, apiKey, 10000);
      
      // Aceptamos cualquiera de los dos formatos posibles
      if (result.data) {
        expect(result).toEqual({ data: '{"testData":"datos de ejemplo"}', intentos: 1 });
      } else {
        expect(result).toEqual({ testData: 'datos de ejemplo', intentos: 1 });
      }
    });

    it('debe manejar errores en la primera petición', async () => {
      nock(baseUrl)
        .get(endpoint)
        .matchHeader('api_key', apiKey)
        .reply(401, {
          descripcion: 'API key inválida',
          estado: 401
        });

      await expect(fetchAemetData(`${baseUrl}${endpoint}`, apiKey, 10000))
        .rejects.toThrow(/Error en la petición a la API/);
    });

    it('debe manejar errores en la segunda petición', async () => {
      // Primera petición exitosa
      nock(baseUrl)
        .get(endpoint)
        .matchHeader('api_key', apiKey)
        .reply(200, {
          descripcion: 'Respuesta correcta',
          estado: 200,
          datos: dataUrl,
          metadatos: 'https://opendata.aemet.es/opendata/metadatos/test-metadata'
        });

      // Segunda petición con error
      nock('https://opendata.aemet.es')
        .get('/opendata/datos/test-data')
        .reply(500, 'Error interno del servidor');

      await expect(fetchAemetData(`${baseUrl}${endpoint}`, apiKey, 10000))
        .rejects.toThrow(/Error al acceder a la URL de datos/);
    });

    it('debe manejar timeouts', async () => {
      // Simulamos un timeout
      nock(baseUrl)
        .get(endpoint)
        .matchHeader('api_key', apiKey)
        .delayConnection(2000) // Retrasamos la respuesta
        .reply(200, {
          descripcion: 'Respuesta correcta',
          estado: 200,
          datos: dataUrl
        });

      await expect(fetchAemetData(`${baseUrl}${endpoint}`, apiKey, 1000)) // Timeout más corto que el retraso
        .rejects.toThrow(/timeout/i);
    });

    it('debe manejar respuestas vacías con estado 200', async () => {
      nock(baseUrl)
        .get(endpoint)
        .matchHeader('api_key', apiKey)
        .reply(200, ''); // Cuerpo de respuesta vacío

      // Ahora la función lanza un error en lugar de simular una respuesta
      await expect(fetchAemetData(`${baseUrl}${endpoint}`, apiKey, 10000))
        .rejects.toThrow(/La API devolvió una respuesta vacía/);
    });

    it('debe manejar falta del URL de datos en la respuesta', async () => {
      nock(baseUrl)
        .get(endpoint)
        .matchHeader('api_key', apiKey)
        .reply(200, {
          descripcion: 'Respuesta sin URL de datos',
          estado: 200,
          // No hay datos URL
          metadatos: 'https://opendata.aemet.es/opendata/metadatos/test-metadata'
        });

      await expect(fetchAemetData(`${baseUrl}${endpoint}`, apiKey, 10000))
        .rejects.toThrow(/URL de datos no disponible/);
    });
  });
}); 