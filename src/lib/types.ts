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
  /**
   * Número de intentos realizados para obtener la respuesta
   */
  intentos?: number;
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
  /**
   * Número de intentos realizados para obtener la respuesta
   */
  intentos?: number;
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

  /**
   * Código INE del municipio (5 dígitos)
   * Si se especifica, se usará el endpoint de predicción horaria por municipio
   */
  municipalityCode?: string;
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
  
  /**
   * Datos crudos de la respuesta (para exploración)
   */
  rawData?: any;

  /**
   * Número de intentos realizados para obtener la respuesta
   */
  intentos?: number;
}

/**
 * Respuesta con datos meteorológicos para una ubicación y hora específicas
 */
export interface WeatherByCoordinatesResponse {
  /**
   * Código del municipio
   */
  municipalityCode: string;
  
  /**
   * Nombre del municipio
   */
  name: string;
  
  /**
   * Provincia del municipio
   */
  province: string;
  
  /**
   * Datos meteorológicos del periodo más cercano a la hora actual
   */
  weatherData: {
    /**
     * Fecha y hora del periodo
     */
    fecha: string;
    
    /**
     * Periodo horario (HH)
     */
    periodo: string;
    
    /**
     * Estado del cielo
     */
    estadoCielo: {
      value: string;
      descripcion: string;
    };
    
    /**
     * Precipitación (mm)
     */
    precipitacion: number;
    
    /**
     * Probabilidad de precipitación (%)
     */
    probPrecipitacion: number;
    
    /**
     * Probabilidad de tormenta (%)
     */
    probTormenta: number;
    
    /**
     * Nieve (mm)
     */
    nieve: number;
    
    /**
     * Probabilidad de nieve (%)
     */
    probNieve: number;
    
    /**
     * Temperatura (°C)
     */
    temperatura: number;
    
    /**
     * Sensación térmica (°C)
     */
    sensTermica: number;
    
    /**
     * Humedad relativa (%)
     */
    humedadRelativa: number;
    
    /**
     * Viento
     */
    viento: {
      direccion: string;
      velocidad: number;
      rachaMax?: number;
    };
  };
  
  /**
   * Distancia en kilómetros al municipio más cercano
   */
  distancia: number;

  /**
   * Número de intentos realizados para obtener la respuesta
   */
  intentos?: number;
} 