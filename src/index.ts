// Punto de entrada principal para la librería
import { Aemet, AemetOptions } from './aemet';

/**
 * Función para inicializar el cliente de AEMET con una API key
 * @param {string} apiKey - API key de AEMET OpenData
 * @param {AemetOptions} options - Opciones adicionales
 * @returns {Aemet} - Cliente de AEMET
 */
export default function(apiKey: string, options: AemetOptions = {}): Aemet {
  return new Aemet(apiKey, options);
}

// Exportamos también los tipos y la clase directamente
export * from './aemet';
export * from './lib/types';
export * from './lib/constants'; 