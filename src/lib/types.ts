// Tipos para la librería

/**
 * Opciones para inicializar el cliente de AEMET
 */
export interface AemetOptions {
  /**
   * URL base de la API de AEMET. Por defecto: https://opendata.aemet.es/opendata/api
   */
  baseUrl?: string;
  
  /**
   * Timeout para las peticiones en milisegundos. Por defecto: 10000 (10 segundos)
   */
  timeout?: number;
}

/**
 * Respuesta genérica de la API de AEMET
 */
export interface AemetResponse {
  descripcion: string;
  estado: number;
  datos: string;
  metadatos: string;
}

/**
 * Información de predicción diaria simplificada
 */
export interface SimpleForecast {
  value: string;
  descripcion: string;
  tmp: {
    min: number;
    max: number;
  };
}

/**
 * Respuesta de la predicción meteorológica simplificada
 */
export interface SimpleForecastResponse {
  name: string;
  province: string;
  today: SimpleForecast;
  tomorrow: SimpleForecast;
  next2: SimpleForecast;
}

/**
 * Respuesta completa de la predicción meteorológica
 */
export interface ForecastResponse extends SimpleForecastResponse {
  forecast: any[]; // array con los datos completos de la API
}

/**
 * Estados del cielo para la predicción
 */
export type SkyState = {
  [key: string]: string;
};

/**
 * Parámetros para solicitar valores climatológicos diarios
 */
export interface ClimateValuesParams {
  
  /**
   * Fecha de inicio para la consulta (formato: AAAA-MM-DD)
   */
  startDate: string;
  
  /**
   * Fecha de fin para la consulta (formato: AAAA-MM-DD)
   */
  endDate: string;
}

/**
 * Estación meteorológica
 */
export interface WeatherStation {
  /**
   * Indicativo de la estación
   */
  indicativo: string;
  
  /**
   * Nombre de la estación
   */
  nombre: string;
  
  /**
   * Provincia donde se encuentra la estación
   */
  provincia: string;
  
  /**
   * Altitud de la estación (en metros)
   */
  altitud: number;
  
  /**
   * Coordenadas geográficas (latitud y longitud)
   */
  geoposicion?: {
    latitud: number;
    longitud: number;
  };
}

/**
 * Valor climatológico diario
 */
export interface ClimateValue {
  /**
   * Fecha de observación
   */
  fecha: string;
  
  /**
   * Indicativo de la estación
   */
  indicativo: string;
  
  /**
   * Nombre de la estación
   */
  nombre: string;
  
  /**
   * Provincia
   */
  provincia: string;
  
  /**
   * Altitud (metros)
   */
  altitud: number;
  
  /**
   * Temperatura máxima (°C)
   */
  tmax?: number;
  
  /**
   * Hora de la temperatura máxima (HHMM)
   */
  horatmax?: string;
  
  /**
   * Temperatura mínima (°C)
   */
  tmin?: number;
  
  /**
   * Hora de la temperatura mínima (HHMM)
   */
  horatmin?: string;
  
  /**
   * Temperatura media (°C)
   */
  tm?: number;
  
  /**
   * Precipitación diaria (mm)
   */
  prec?: number;
  
  /**
   * Presión máxima al nivel de la estación (hPa)
   */
  presMax?: number;
  
  /**
   * Presión mínima al nivel de la estación (hPa)
   */
  presMin?: number;
  
  /**
   * Velocidad media del viento (m/s)
   */
  velmedia?: number;
  
  /**
   * Velocidad máxima del viento (m/s)
   */
  racha?: number;
  
  /**
   * Dirección del viento (grados)
   */
  dir?: number;
  
  /**
   * Insolación diaria (horas)
   */
  inso?: number;
  
  /**
   * Presencia de niebla durante el día (0/1)
   */
  nieve?: number;
}

/**
 * Respuesta con los valores climatológicos diarios
 */
export interface ClimateValuesResponse {
  /**
   * Información de la estación
   */
  station: WeatherStation;
  
  /**
   * Valores climatológicos diarios
   */
  values: ClimateValue[];
}

/**
 * Respuesta con datos meteorológicos para una ubicación y hora específicas
 */
export interface WeatherByCoordinatesResponse {
  /**
   * Información de la estación más cercana
   */
  station: WeatherStation;
  
  /**
   * Datos meteorológicos más cercanos a la hora solicitada
   */
  weatherData: {
    /**
     * Fecha de la observación
     */
    fecha: string;
    
    /**
     * Temperatura máxima (°C)
     */
    tmax?: number;
    
    /**
     * Hora de la temperatura máxima (HHMM)
     */
    horatmax?: string;
    
    /**
     * Temperatura mínima (°C)
     */
    tmin?: number;
    
    /**
     * Hora de la temperatura mínima (HHMM)
     */
    horatmin?: string;
    
    /**
     * Temperatura media (°C)
     */
    tm?: number;
    
    /**
     * Precipitación diaria (mm)
     */
    prec?: number;
    
    /**
     * Presión máxima al nivel de la estación (hPa)
     */
    presMax?: number;
    
    /**
     * Presión mínima al nivel de la estación (hPa)
     */
    presMin?: number;
    
    /**
     * Velocidad media del viento (m/s)
     */
    velmedia?: number;
    
    /**
     * Velocidad máxima del viento (m/s)
     */
    racha?: number;
    
    /**
     * Dirección del viento (grados)
     */
    dir?: number;
    
    /**
     * Insolación diaria (horas)
     */
    inso?: number;
    
    /**
     * Presencia de niebla durante el día (0/1)
     */
    nieve?: number;
  };
  
  /**
   * Distancia en kilómetros a la estación más cercana
   */
  distancia: number;
} 