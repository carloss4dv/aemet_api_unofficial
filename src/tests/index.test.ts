import aemetClient from '../index';
import { Aemet } from '../aemet';

describe('Función principal', () => {
  it('debe exportar una función que devuelve una instancia de Aemet', () => {
    const apiKey = 'api-key-de-prueba';
    const client = aemetClient(apiKey);
    
    expect(client).toBeInstanceOf(Aemet);
  });
  
  it('debe pasar correctamente la API key al constructor', () => {
    const apiKey = 'api-key-de-prueba';
    const client = aemetClient(apiKey);
    
    // Verificamos que se creó una instancia de Aemet con la API key correcta
    expect(client).toBeInstanceOf(Aemet);
    expect((client as any).apiKey).toBe(apiKey);
  });
  
  it('debe permitir pasar opciones al constructor', () => {
    const apiKey = 'api-key-de-prueba';
    const options = {
      baseUrl: 'https://custom-api.aemet.es',
      timeout: 5000
    };
    
    const client = aemetClient(apiKey, options);
    
    expect(client).toBeInstanceOf(Aemet);
    expect((client as any).baseUrl).toBe(options.baseUrl);
    expect((client as any).timeout).toBe(options.timeout);
  });
}); 