/**
 * Clase principal de la API de AEMET
 */

import { 
  AemetOptions, 
  SimpleForecastResponse, 
  ForecastResponse,
  SimpleForecast,
  ClimateValuesParams,
  WeatherStation,
  ClimateValuesResponse,
  ClimateValue,
  WeatherByCoordinatesResponse
} from './lib/types';
import { 
  DEFAULT_BASE_URL, 
  DEFAULT_TIMEOUT, 
  ENDPOINTS,
  PROVINCE_MAPPING
} from './lib/constants';
import { 
  fetchAemetData, 
  getSkyStateDescription, 
  getDayForecast
} from './lib/utils';

/**
 * Cliente para la API de AEMET (Agencia Estatal de Meteorología)
 */
export class Aemet {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private provinciaIndex: { [key: string]: any[] } = {};
  private municipios: any[] = [];

  /**
   * Inicializa un nuevo cliente de AEMET
   * @param apiKey - Clave API para acceder a la API de AEMET
   * @param options - Opciones adicionales
   */
  constructor(apiKey: string, options: AemetOptions = {}) {
    if (!apiKey) {
      throw new Error('La API key es obligatoria');
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Obtener la predicción simplificada para un municipio
   * @param municipalityCode - Código INE del municipio (5 dígitos)
   * @returns Predicción simplificada para los próximos 3 días
   */
  async getSimpleForecast(municipalityCode: string): Promise<SimpleForecastResponse> {
    if (!municipalityCode || municipalityCode.length !== 5) {
      throw new Error('El código de municipio debe tener 5 dígitos');
    }

    try {
      const url = `${this.baseUrl}${ENDPOINTS.FORECAST_MUNICIPALITY}${municipalityCode}`;
      const data = await fetchAemetData(url, this.apiKey, this.timeout);
      
      // Obtenemos el nombre del municipio y la provincia
      const name = data?.nombre || '';
      const province = data?.provincia || '';
      
      // Obtenemos las predicciones para hoy, mañana y pasado mañana
      const today = this.extractDayForecast(data, 0);
      const tomorrow = this.extractDayForecast(data, 1);
      const next2 = this.extractDayForecast(data, 2);
      
      // Extraemos el número de intentos si existe
      const intentos = data?.intentos;
      
      return {
        name,
        province,
        today,
        tomorrow,
        next2,
        intentos
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener la predicción: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener la predicción');
    }
  }

  /**
   * Obtener la predicción completa para un municipio
   * @param municipalityCode - Código INE del municipio (5 dígitos)
   * @returns Predicción completa con los datos crudos
   */
  async getForecast(municipalityCode: string): Promise<ForecastResponse> {
    if (!municipalityCode || municipalityCode.length !== 5) {
      throw new Error('El código de municipio debe tener 5 dígitos');
    }
    
    try {
      const url = `${this.baseUrl}${ENDPOINTS.FORECAST_MUNICIPALITY}${municipalityCode}`;
      const data = await fetchAemetData(url, this.apiKey, this.timeout);
      
      // Obtenemos el nombre del municipio y la provincia
      const name = data?.nombre || '';
      const province = data?.provincia || '';
      
      // Obtenemos las predicciones para hoy, mañana y pasado mañana
      const today = this.extractDayForecast(data, 0);
      const tomorrow = this.extractDayForecast(data, 1);
      const next2 = this.extractDayForecast(data, 2);
      
      // Incluimos el forecast completo original
      const forecast = data?.prediccion?.dia || [];
      
      // Extraemos el número de intentos si existe
      const intentos = data?.intentos;
      
      return {
        name,
        province,
        today,
        tomorrow,
        next2,
        forecast,
        intentos
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener la predicción completa: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener la predicción completa');
    }
  }

  /**
   * Obtener la lista de municipios disponibles
   * @returns Lista de municipios con sus códigos
   */
  async getMunicipalities(): Promise<any[]> {
    try {
      const url = `${this.baseUrl}${ENDPOINTS.MUNICIPALITIES}`;
      return await fetchAemetData(url, this.apiKey, this.timeout);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener los municipios: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener los municipios');
    }
  }

  /**
   * Obtener la lista de provincias disponibles
   * @returns Lista de provincias
   */
  async getProvinces(): Promise<any[]> {
    try {
      const url = `${this.baseUrl}${ENDPOINTS.PROVINCES}`;
      return await fetchAemetData(url, this.apiKey, this.timeout);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener las provincias: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener las provincias');
    }
  }

  /**
   * Obtener avisos meteorológicos para el día actual
   * @returns Avisos meteorológicos para hoy
   */
  async getAlertsToday(): Promise<any> {
    try {
      const url = `${this.baseUrl}${ENDPOINTS.ALERTS_TODAY}`;
      return await fetchAemetData(url, this.apiKey, this.timeout);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener los avisos para hoy: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener los avisos para hoy');
    }
  }

  /**
   * Obtener avisos meteorológicos para el día siguiente
   * @returns Avisos meteorológicos para mañana
   */
  async getAlertsTomorrow(): Promise<any> {
    try {
      const url = `${this.baseUrl}${ENDPOINTS.ALERTS_TOMORROW}`;
      return await fetchAemetData(url, this.apiKey, this.timeout);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener los avisos para mañana: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener los avisos para mañana');
    }
  }

  /**
   * Método privado para extraer la predicción de un día específico
   * @param data - Datos completos de la predicción
   * @param dayOffset - Offset del día (0: hoy, 1: mañana, 2: pasado mañana)
   * @returns Predicción simplificada para el día especificado
   */
  private extractDayForecast(data: any, dayOffset: number): SimpleForecast {
    try {
      // Si no hay datos de predicción, devolvemos un objeto vacío
      if (!data || !data.prediccion || !data.prediccion.dia || !data.prediccion.dia.length) {
        throw new Error('No hay datos de predicción disponibles');
      }

      const dayData = getDayForecast(data.prediccion.dia, dayOffset);
      
      if (!dayData) {
        throw new Error(`No hay datos para el día con offset ${dayOffset}`);
      }

      // Obtenemos el estado del cielo predominante
      const skyState = this.getPredominantSkyState(dayData.estadoCielo);
      
      // Obtenemos las temperaturas mínima y máxima
      let minTemp = 0;
      let maxTemp = 0;

      if (dayData.temperatura) {
        // Aseguramos que los valores sean números
        minTemp = typeof dayData.temperatura.minima === 'string' 
          ? parseFloat(dayData.temperatura.minima) 
          : (typeof dayData.temperatura.minima === 'number' 
              ? dayData.temperatura.minima 
              : 0);
        
        maxTemp = typeof dayData.temperatura.maxima === 'string' 
          ? parseFloat(dayData.temperatura.maxima) 
          : (typeof dayData.temperatura.maxima === 'number' 
              ? dayData.temperatura.maxima 
              : 0);
      }

      return {
        value: skyState,
        descripcion: getSkyStateDescription(skyState),
        tmp: {
          min: minTemp,
          max: maxTemp
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error al extraer la predicción del día: ${error.message}`);
      } else {
        console.error('Error desconocido al extraer la predicción del día');
      }
      
      // Devolvemos un objeto con valores por defecto
      return {
        value: '11',
        descripcion: 'Desconocido',
        tmp: {
          min: 0,
          max: 0
        }
      };
    }
  }

  /**
   * Método privado para obtener el estado del cielo predominante durante el día
   * @param skyStates - Array de estados del cielo
   * @returns Valor del estado del cielo predominante
   */
  private getPredominantSkyState(skyStates: any[]): string {
    if (!skyStates || !Array.isArray(skyStates) || skyStates.length === 0) {
      return '11'; // Por defecto "Despejado"
    }

    // Nos centramos en los estados del cielo durante horas diurnas (período de 12pm a 6pm)
    const daytimeStates = skyStates.filter(state => {
      const periodo = state.periodo ? parseInt(state.periodo, 10) : NaN;
      return !isNaN(periodo) && periodo >= 12 && periodo <= 18;
    });

    // Si hay estados diurnos, tomamos el más frecuente
    if (daytimeStates.length > 0) {
      // Contamos las ocurrencias de cada estado
      const stateCount: Record<string, number> = {};
      
      daytimeStates.forEach(state => {
        if (state.value) {
          stateCount[state.value] = (stateCount[state.value] || 0) + 1;
        }
      });

      // Encontramos el estado más frecuente
      let mostFrequent = '11';
      let maxCount = 0;

      Object.entries(stateCount).forEach(([value, count]) => {
        if (count > maxCount) {
          mostFrequent = value;
          maxCount = count;
        }
      });

      return mostFrequent;
    }

    // Si no hay estados diurnos, tomamos el primero disponible con valor
    for (const state of skyStates) {
      if (state.value) {
        return state.value;
      }
    }
    
    return '11'; // Valor por defecto si no hay ningún estado con valor
  }

  /**
   * Obtener todas las estaciones meteorológicas disponibles
   * @returns Lista de estaciones meteorológicas
   */
  async getWeatherStations(): Promise<WeatherStation[]> {
    try {
      const url = `${this.baseUrl}${ENDPOINTS.CLIMATE_STATIONS}`;
      const data = await fetchAemetData(url, this.apiKey, this.timeout);
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de datos inesperado. Se esperaba un array de estaciones.');
      }
      
      return data.map((station: any) => {
        // Normalizar coordenadas desde formatos como "394924N" a números decimales
        const latitudNormalizada = this.normalizeCoordinate(station.latitud);
        const longitudNormalizada = this.normalizeCoordinate(station.longitud);
        
        return {
          indicativo: station.indicativo || '',
          nombre: station.nombre || '',
          provincia: this.normalizeProvince(station.provincia) || '',
          altitud: parseFloat(station.altitud) || 0,
          geoposicion: {
            latitud: latitudNormalizada,
            longitud: longitudNormalizada
          }
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener las estaciones: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener las estaciones');
    }
  }

  /**
   * Normaliza coordenadas desde formato AEMET (ej: "394924N") a decimales
   * @param coord - Coordenada en formato AEMET
   * @returns - Coordenada en formato decimal
   */
  private normalizeCoordinate(coord: string): number {
    if (!coord || typeof coord !== 'string') {
      return 0;
    }
    
    try {
      // Para el caso de los tests donde ya vienen como números decimales
      if (coord.includes('.')) {
        return parseFloat(coord);
      }
      
      // Formato esperado: "GGMMSS[N|S|E|W]" (grados, minutos, segundos, dirección)
      const direction = coord.slice(-1);
      const numeric = coord.slice(0, -1);
      
      if (numeric.length !== 6) {
        return parseFloat(coord) || 0;
      }
      
      const degrees = parseInt(numeric.slice(0, 2), 10);
      const minutes = parseInt(numeric.slice(2, 4), 10);
      const seconds = parseInt(numeric.slice(4, 6), 10);
      
      // Convertir a grados decimales
      let decimal = degrees + (minutes / 60) + (seconds / 3600);
      
      // Ajustar signo según dirección
      if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
      }
      
      return decimal;
    } catch (e) {
      console.warn('Error al normalizar coordenada:', coord, e);
      return 0;
    }
  }

  /**
   * Busca estaciones por nombre o provincia
   * @param query - Texto a buscar en el nombre o provincia de la estación
   * @returns Lista de estaciones filtradas
   */
  async searchWeatherStations(query: string): Promise<WeatherStation[]> {
    try {
      const stations = await this.getWeatherStations();
      const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      return stations.filter(station => {
        const normalizedName = station.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedProvince = station.provincia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        return normalizedName.includes(normalizedQuery) || normalizedProvince.includes(normalizedQuery);
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al buscar estaciones: ${error.message}`);
      }
      throw new Error('Error desconocido al buscar estaciones');
    }
  }

  /**
   * Obtener valores climatológicos diarios para una estación y período específicos
   * @param params - Parámetros para obtener valores climatológicos
   * @returns Valores climatológicos diarios
   */
  async getClimateValues(params: ClimateValuesParams): Promise<ClimateValuesResponse> {
    if (!params.startDate || !params.endDate) {
      throw new Error('Se requieren los parámetros: startDate y endDate');
    }
    
    // Si se ha proporcionado un código de municipio, usar el endpoint de predicción horaria
    if (params.municipalityCode) {
      if (params.municipalityCode.length !== 5) {
        throw new Error('El código de municipio debe tener 5 dígitos');
      }
      
      try {
        const url = `${this.baseUrl}${ENDPOINTS.FORECAST_MUNICIPALITY_HOURLY}${params.municipalityCode}`;
        const data = await fetchAemetData(url, this.apiKey, this.timeout);
        
        // Verificar si los datos son un array y tomar el primer elemento
        const municipioData = Array.isArray(data) ? data[0] : data;
        
        if (!municipioData || !municipioData.nombre || !municipioData.provincia || !municipioData.prediccion) {
          throw new Error('Error en la API de AEMET');
        }
        
        // Creamos una estación virtual para el municipio
        const station: WeatherStation = {
          indicativo: params.municipalityCode,
          nombre: municipioData.nombre || 'Municipio',
          provincia: municipioData.provincia || 'Desconocida',
          altitud: 0
        };
        
        // Adaptamos los datos al formato de respuesta esperado
        const values: ClimateValue[] = [];
        
        // Si hay predicciones, procesamos cada día
        if (municipioData.prediccion?.dia && Array.isArray(municipioData.prediccion.dia)) {
          for (const dia of municipioData.prediccion.dia) {
            // Para cada día, procesamos cada periodo horario
            if (dia.estadoCielo && Array.isArray(dia.estadoCielo)) {
              for (const estado of dia.estadoCielo) {
                if (!estado.periodo) continue;

                // Recopilamos todos los datos para este periodo
                const precipitacion = dia.precipitacion?.find((p: any) => p.periodo === estado.periodo)?.value || 0;
                const temperatura = dia.temperatura?.find((t: any) => t.periodo === estado.periodo)?.value;
                const viento = dia.vientoAndRachaMax?.find((v: any) => v.periodo === estado.periodo);

                values.push({
                  fecha: `${dia.fecha.split('T')[0]}T${estado.periodo.padStart(2, '0')}:00:00`,
                  indicativo: params.municipalityCode,
                  nombre: municipioData.nombre || 'Municipio',
                  provincia: municipioData.provincia || 'Desconocida',
                  altitud: 0,
                  tmax: parseFloat(temperatura) || undefined,
                  tmin: parseFloat(temperatura) || undefined,
                  tm: parseFloat(temperatura) || undefined,
                  prec: parseFloat(precipitacion) || undefined,
                  velmedia: viento?.velocidad?.[0] ? parseFloat(viento.velocidad[0]) : undefined,
                  racha: viento?.value ? parseFloat(viento.value) : undefined,
                  dir: viento?.direccion?.[0] === 'N' ? 0 :
                       viento?.direccion?.[0] === 'NE' ? 45 :
                       viento?.direccion?.[0] === 'E' ? 90 :
                       viento?.direccion?.[0] === 'SE' ? 135 :
                       viento?.direccion?.[0] === 'S' ? 180 :
                       viento?.direccion?.[0] === 'SO' ? 225 :
                       viento?.direccion?.[0] === 'O' ? 270 :
                       viento?.direccion?.[0] === 'NO' ? 315 : undefined
                });
              }
            }
          }
        }
        
        // Extraemos el número de intentos si existe
        const intentos = data?.intentos || (Array.isArray(data) && data[0]?.intentos);
        
        return {
          station,
          values,
          rawData: municipioData,
          intentos
        };
      } catch (error) {
        console.error('Error al obtener la predicción horaria:', error);
        throw new Error('Error en la API de AEMET');
      }
    }
    
    // Si no se proporcionó un código de municipio, seguir con la lógica original
    // Validamos el formato de fechas
    // Ahora aceptamos tanto formato AAAA-MM-DD como AAAA-MM-DDTHH:MM:SSUTC
    const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const fullDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}UTC$/;
    
    let fechaIni = params.startDate;
    let fechaFin = params.endDate;
    
    // Si la fecha está en formato simple, la convertimos al formato completo
    if (simpleDateRegex.test(params.startDate)) {
      fechaIni = `${params.startDate}T00:00:00UTC`;
    } else if (!fullDateRegex.test(params.startDate)) {
      throw new Error('Formato de fecha incorrecto. Debe ser AAAA-MM-DD o AAAA-MM-DDTHH:MM:SSUTC');
    }
    
    if (simpleDateRegex.test(params.endDate)) {
      fechaFin = `${params.endDate}T23:59:59UTC`;
    } else if (!fullDateRegex.test(params.endDate)) {
      throw new Error('Formato de fecha incorrecto. Debe ser AAAA-MM-DD o AAAA-MM-DDTHH:MM:SSUTC');
    }
    
    // Verificamos que las fechas no sean futuras
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Extraemos la parte de la fecha para la comparación
    const startDateParts = params.startDate.split('T')[0].split('-');
    const endDateParts = params.endDate.split('T')[0].split('-');
    
    const startDate = new Date(
      parseInt(startDateParts[0]), 
      parseInt(startDateParts[1]) - 1, 
      parseInt(startDateParts[2])
    );
    
    const endDate = new Date(
      parseInt(endDateParts[0]), 
      parseInt(endDateParts[1]) - 1, 
      parseInt(endDateParts[2])
    );
    
    if (startDate > currentDate || endDate > currentDate) {
      throw new Error('No se pueden solicitar datos climatológicos para fechas futuras');
    }
    
    try {
      // La API requiere los parámetros en la ruta de URL, no como query params
      const url = `${this.baseUrl}${ENDPOINTS.CLIMATE_VALUES_DAILY}`;
      // Construir la URL con el formato: /fechaini/{fechaIni}/fechafin/{fechaFin}/estacion/idema={idema}
      const queryUrl = `${url}fechaini/${encodeURIComponent(fechaIni)}/fechafin/${encodeURIComponent(fechaFin)}/todasestaciones`;
      
      const data = await fetchAemetData(queryUrl, this.apiKey, this.timeout);
      
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No se encontraron datos para la estación y período especificados');
      }
      
      // Extraemos la información de la estación del primer registro
      const station: WeatherStation = {
        indicativo: data[0].indicativo || '',
        nombre: data[0].nombre || '',
        provincia: this.normalizeProvince(data[0].provincia) || '',
        altitud: parseFloat(data[0].altitud) || 0
      };
      
      // Procesamos los valores climatológicos
      const values: ClimateValue[] = data.map((item: any) => ({
        fecha: item.fecha || '',
        indicativo: item.indicativo || '',
        nombre: item.nombre || '',
        provincia: this.normalizeProvince(item.provincia) || '',
        altitud: parseFloat(item.altitud) || 0,
        tmax: item.tmax !== undefined ? parseFloat(item.tmax) : undefined,
        horatmax: item.horatmax || undefined,
        tmin: item.tmin !== undefined ? parseFloat(item.tmin) : undefined,
        horatmin: item.horatmin || undefined,
        tm: item.tm !== undefined ? parseFloat(item.tm) : undefined,
        prec: item.prec !== undefined ? parseFloat(item.prec) : undefined,
        presMax: item.presMax !== undefined ? parseFloat(item.presMax) : undefined,
        presMin: item.presMin !== undefined ? parseFloat(item.presMin) : undefined,
        velmedia: item.velmedia !== undefined ? parseFloat(item.velmedia) : undefined,
        racha: item.racha !== undefined ? parseFloat(item.racha) : undefined,
        dir: item.dir !== undefined ? parseFloat(item.dir) : undefined,
        inso: item.inso !== undefined ? parseFloat(item.inso) : undefined,
        nieve: item.nieve !== undefined ? parseInt(item.nieve, 10) : undefined
      }));
      
      // Extraemos el número de intentos si existe
      const intentos = data[0]?.intentos;
      
      return {
        station,
        values,
        intentos
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al obtener valores climatológicos: ${error.message}`);
      }
      throw new Error('Error desconocido al obtener valores climatológicos');
    }
  }

  /**
   * Obtener resumen climatológico para una estación y período
   * @param params - Parámetros para obtener valores climatológicos
   * @provincia - Nombre de la provincia autónoma para filtrar estaciones
   * @returns Resumen estadístico de los valores climatológicos
   */
  async getClimateSummaryByProvincia(params: ClimateValuesParams, provincia: string): Promise<any> {
    try {
      const data = await this.getClimateValues(params);
      const provinciaBuscada = this.normalizeProvince(provincia);
      
      const valoresProvincia = data.values.filter(item => 
        this.normalizeProvince(item.provincia) === provinciaBuscada
      );
  
      if (valoresProvincia.length === 0) {
        throw new Error(`No hay datos disponibles para ${provincia}`);
      }
  
      const estacionesUnicas: WeatherStation[] = [];
      valoresProvincia.forEach(item => {
        if (!estacionesUnicas.some(e => e.indicativo === item.indicativo)) {
          estacionesUnicas.push({
            indicativo: item.indicativo,
            nombre: item.nombre,
            provincia: item.provincia,
            altitud: item.altitud,
            geoposicion: {
              latitud: 0,
              longitud: 0
            }
          });
        }
      });
  
      // Función auxiliar para cálculos seguros
      const safeStats = (values: (number | undefined)[], fallback = 0) => {
        const filtered = values.filter((v): v is number => v !== undefined);
        return {
          max: filtered.length ? Math.max(...filtered) : fallback,
          min: filtered.length ? Math.min(...filtered) : fallback,
          avg: filtered.length ? this.calculateAverage(filtered) : fallback,
          total: filtered.length ? this.calculateSum(filtered) : fallback
        };
      };
  
      // Cálculos para todos los parámetros
      const temperatura = {
        maxima: safeStats(valoresProvincia.map(v => v.tmax)).max,
        minima: safeStats(valoresProvincia.map(v => v.tmin)).min,
        media: safeStats(valoresProvincia.map(v => v.tm)).avg
      };
  
      const precipitacion = {
        total: safeStats(valoresProvincia.map(v => v.prec)).total,
        maxDiaria: safeStats(valoresProvincia.map(v => v.prec)).max,
        diasConLluvia: valoresProvincia.filter(v => (v.prec || 0) > 0).length
      };
  
      const presionAtmosferica = {
        maxima: safeStats(valoresProvincia.map(v => v.presMax)).max,
        minima: safeStats(valoresProvincia.map(v => v.presMin)).min,
        mediaMax: safeStats(valoresProvincia.map(v => v.presMax)).avg,
        mediaMin: safeStats(valoresProvincia.map(v => v.presMin)).avg
      };
  
      const viento = {
        velocidadMedia: safeStats(valoresProvincia.map(v => v.velmedia)).avg,
        rachaMaxima: safeStats(valoresProvincia.map(v => v.racha)).max,
        direccionPredominante: this.calculateWindDirectionAverage(
          valoresProvincia.map(v => v.dir).filter((dir): dir is number => dir !== undefined)
        )
      };
  
      const radiacionSolar = {
        total: safeStats(valoresProvincia.map(v => v.inso)).total,
        mediaDiaria: safeStats(valoresProvincia.map(v => v.inso)).avg
      };
  
      const nieve = {
        acumuladoTotal: safeStats(valoresProvincia.map(v => v.nieve)).total,
        diasConNieve: valoresProvincia.filter(v => (v.nieve || 0) > 0).length
      };
  
      const resumen = {
        provincia: provinciaBuscada,
        estaciones: estacionesUnicas,
        periodo: {
          inicio: params.startDate,
          fin: params.endDate,
          dias: [...new Set(valoresProvincia.map(v => v.fecha))].length
        },
        temperatura,
        precipitacion,
        presionAtmosferica,
        viento,
        radiacionSolar,
        nieve,
        // Podemos añadir más parámetros aquí según sea necesario
      };
  
      return resumen;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al generar el resumen: ${error.message}`);
      }
      throw new Error('Error desconocido al generar el resumen');
    }
  }
  
  // Método auxiliar para dirección del viento (cálculo circular)
  private calculateWindDirectionAverage(direcciones: number[]): number {
    if (direcciones.length === 0) return 0;
    
    const sumSines = direcciones.reduce((acc, dir) => 
      acc + Math.sin(dir * Math.PI / 180), 0);
    const sumCosines = direcciones.reduce((acc, dir) => 
      acc + Math.cos(dir * Math.PI / 180), 0);
    
    const avgAngle = Math.atan2(sumSines / direcciones.length, sumCosines / direcciones.length);
    return (avgAngle * 180 / Math.PI + 360) % 360;
  }
  
  /**
   * Método auxiliar para calcular la media de un array de números
   * @param values - Array de valores numéricos
   * @returns Media aritmética o 0 si no hay valores
   */
  private calculateAverage(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  
  /**
   * Método auxiliar para calcular la suma de un array de números
   * @param values - Array de valores numéricos
   * @returns Suma total o 0 si no hay valores
   */
  private calculateSum(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0);
  }

  private normalizeProvince(provincia: string): string {
    if (!provincia) return '';
    return provincia in PROVINCE_MAPPING 
      ? PROVINCE_MAPPING[provincia as keyof typeof PROVINCE_MAPPING] 
      : provincia;
  }

  /**
   * Obtener datos meteorológicos para una ubicación y hora específicas
   * @param latitud - Latitud de la ubicación
   * @param longitud - Longitud de la ubicación
   * @param municipalityCode - Código opcional del municipio (5 dígitos)
   * @returns Datos meteorológicos más cercanos a la ubicación y hora especificadas
   */
  async getWeatherByCoordinates(
    latitud: number,
    longitud: number,
    municipalityCode?: string
  ): Promise<WeatherByCoordinatesResponse> {
    try {
      // Si se proporciona un código de municipio, lo usamos directamente
      const codigoMunicipio = municipalityCode || await this.getMunicipioCercano(latitud, longitud);
      
      if (!codigoMunicipio || codigoMunicipio.length !== 5) {
        throw new Error('Error en la API de AEMET');
      }

      // Obtenemos los datos de predicción horaria
      const url = `${this.baseUrl}${ENDPOINTS.FORECAST_MUNICIPALITY_HOURLY}${codigoMunicipio}`;
      const data = await fetchAemetData(url, this.apiKey, this.timeout);
      
      // Verificar si los datos son un array y tomar el primer elemento
      const municipioData = Array.isArray(data) ? data[0] : data;
      
      if (!municipioData || !municipioData.nombre || !municipioData.provincia) {
        throw new Error('Error en la API de AEMET');
      }

      // Obtenemos el periodo más cercano a la hora actual
      const periodoMasCercano = this.getPeriodoMasCercano(data);

      // Calculamos la distancia si no se proporcionó un código de municipio
      const distancia = municipalityCode ? 0 : await this.calcularDistanciaMunicipio(latitud, longitud, codigoMunicipio);

      // Extraemos el número de intentos si existe
      const intentos = data?.intentos || (Array.isArray(data) && data[0]?.intentos);

      return {
        municipalityCode: codigoMunicipio,
        name: municipioData.nombre || '',
        province: municipioData.provincia || '',
        weatherData: periodoMasCercano,
        distancia,
        intentos
      };
    } catch (error) {
      console.error('Error en getWeatherByCoordinates:', error);
      throw new Error('Error en la API de AEMET');
    }
  }

  /**
   * Obtiene el código del municipio más cercano a las coordenadas dadas
   * @param latitud - Latitud del punto
   * @param longitud - Longitud del punto
   * @returns Código del municipio más cercano
   */
  private async getMunicipioCercano(latitud: number, longitud: number): Promise<string> {
    try {
      // Obtener todos los municipios si no están cargados
      if (!this.municipios || this.municipios.length === 0) {
        this.municipios = await this.getMunicipalities();
      }

      // Verificar que se hayan cargado municipios
      if (!Array.isArray(this.municipios) || this.municipios.length === 0) {
        throw new Error('Error en la API de AEMET');
      }

      let municipioMasCercano = null;
      let distanciaMinima = Infinity;

      // Calcular la distancia a cada municipio
      for (const municipio of this.municipios) {
        // Verificar que el municipio tiene coordenadas válidas
        if (!municipio.latitud_dec || !municipio.longitud_dec) continue;
        
        const latitudMunicipio = parseFloat(municipio.latitud_dec);
        const longitudMunicipio = parseFloat(municipio.longitud_dec);
        
        // Verificar que las coordenadas son números válidos
        if (isNaN(latitudMunicipio) || isNaN(longitudMunicipio)) continue;
        
        const distancia = this.calcularDistancia(
          latitud,
          longitud,
          latitudMunicipio,
          longitudMunicipio
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          municipioMasCercano = municipio;
        }
      }

      if (!municipioMasCercano) {
        throw new Error('Error en la API de AEMET');
      }

      // Devolver el código del municipio sin el prefijo 'id'
      return municipioMasCercano.id.replace('id', '');
    } catch (error) {
      console.error('Error al obtener el municipio más cercano:', error);
      throw new Error('Error en la API de AEMET');
    }
  }

  /**
   * Calcula la distancia entre un punto y un municipio
   * @param latitud - Latitud del punto
   * @param longitud - Longitud del punto
   * @param codigoMunicipio - Código del municipio
   * @returns Distancia en kilómetros
   */
  private async calcularDistanciaMunicipio(
    latitud: number,
    longitud: number,
    codigoMunicipio: string
  ): Promise<number> {
    try {
      // Obtener todos los municipios si no están cargados
      if (!this.municipios || this.municipios.length === 0) {
        this.municipios = await this.getMunicipalities();
      }

      // Verificar que se hayan cargado municipios
      if (!Array.isArray(this.municipios) || this.municipios.length === 0) {
        throw new Error('Error en la API de AEMET');
      }

      // Buscar el municipio por su código
      const municipio = this.municipios.find(m => m.id.replace('id', '') === codigoMunicipio);
      
      if (!municipio) {
        throw new Error('Error en la API de AEMET');
      }

      // Verificar que el municipio tiene coordenadas válidas
      if (!municipio.latitud_dec || !municipio.longitud_dec) {
        throw new Error('Error en la API de AEMET');
      }

      // Usar las coordenadas decimales del municipio
      const latitudMunicipio = parseFloat(municipio.latitud_dec);
      const longitudMunicipio = parseFloat(municipio.longitud_dec);

      // Verificar que las coordenadas son números válidos
      if (isNaN(latitudMunicipio) || isNaN(longitudMunicipio)) {
        throw new Error('Error en la API de AEMET');
      }

      // Calcular la distancia entre los puntos
      return this.calcularDistancia(latitud, longitud, latitudMunicipio, longitudMunicipio);
    } catch (error) {
      console.error('Error al calcular la distancia al municipio:', error);
      throw new Error('Error en la API de AEMET');
    }
  }

  /**
   * Calcular la distancia entre dos puntos geográficos usando la fórmula de Haversine
   * @param lat1 - Latitud del primer punto
   * @param lon1 - Longitud del primer punto
   * @param lat2 - Latitud del segundo punto
   * @param lon2 - Longitud del segundo punto
   * @returns Distancia en kilómetros
   */
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convertir grados a radianes
   * @param grados - Ángulo en grados
   * @returns Ángulo en radianes
   */
  private toRad(grados: number): number {
    return grados * (Math.PI / 180);
  }

  /**
   * Obtiene los datos del periodo más cercano a la hora actual
   * @param data - Datos de predicción horaria
   * @returns Datos del periodo más cercano
   */
  private getPeriodoMasCercano(data: any): any {
    try {
      // Verificar si los datos son un array y tomar el primer elemento
      const municipioData = Array.isArray(data) ? data[0] : data;
      
      if (!municipioData?.prediccion?.dia || !Array.isArray(municipioData.prediccion.dia)) {
        throw new Error('Error en la API de AEMET');
      }

      const horaActual = new Date().getHours();
      let periodoMasCercano = null;
      let diferenciaMinimaHoras = Infinity;

      // Buscamos en todos los días disponibles
      for (const dia of municipioData.prediccion.dia) {
        // Verificamos si el día tiene datos de estado del cielo
        if (!dia.estadoCielo || !Array.isArray(dia.estadoCielo)) continue;

        // Buscamos el periodo más cercano a la hora actual
        for (const estado of dia.estadoCielo) {
          if (!estado.periodo) continue;

          const horaEstado = parseInt(estado.periodo, 10);
          if (isNaN(horaEstado)) continue;

          // Calculamos la diferencia de horas
          const diferencia = Math.abs(horaEstado - horaActual);
          
          // Si encontramos un periodo más cercano, actualizamos
          if (diferencia < diferenciaMinimaHoras) {
            diferenciaMinimaHoras = diferencia;
            
            // Recopilamos todos los datos para este periodo
            const precipitacion = dia.precipitacion?.find((p: any) => p.periodo === estado.periodo)?.value || 0;
            const probPrec = dia.probPrecipitacion?.find((p: any) => 
              p.periodo.includes(estado.periodo.padStart(2, '0'))
            )?.value || 0;
            const probTorm = dia.probTormenta?.find((p: any) => 
              p.periodo.includes(estado.periodo.padStart(2, '0'))
            )?.value || 0;
            const nieve = dia.nieve?.find((n: any) => n.periodo === estado.periodo)?.value || 0;
            const probNieve = dia.probNieve?.find((n: any) => 
              n.periodo.includes(estado.periodo.padStart(2, '0'))
            )?.value || 0;
            const temperatura = dia.temperatura?.find((t: any) => t.periodo === estado.periodo)?.value;
            const sensTermica = dia.sensTermica?.find((s: any) => s.periodo === estado.periodo)?.value;
            const humedad = dia.humedadRelativa?.find((h: any) => h.periodo === estado.periodo)?.value;
            const viento = dia.vientoAndRachaMax?.find((v: any) => v.periodo === estado.periodo);

            // Construir una fecha correcta con la hora del periodo
            const fechaBase = dia.fecha.split('T')[0];
            const fechaConHora = `${fechaBase}T${estado.periodo.padStart(2, '0')}:00:00`;

            periodoMasCercano = {
              fecha: fechaConHora,
              periodo: estado.periodo,
              estadoCielo: {
                value: estado.value,
                descripcion: estado.descripcion
              },
              precipitacion: parseFloat(precipitacion),
              probPrecipitacion: parseInt(probPrec, 10),
              probTormenta: parseInt(probTorm, 10),
              nieve: parseFloat(nieve),
              probNieve: parseInt(probNieve, 10),
              temperatura: parseFloat(temperatura),
              sensTermica: parseFloat(sensTermica),
              humedadRelativa: parseInt(humedad, 10),
              viento: {
                direccion: viento?.direccion?.[0] || '',
                velocidad: parseInt(viento?.velocidad?.[0] || '0', 10),
                rachaMax: viento?.value ? parseInt(viento.value, 10) : undefined
              }
            };
          }
        }
      }

      if (!periodoMasCercano) {
        throw new Error('Error en la API de AEMET');
      }

      return periodoMasCercano;
    } catch (error) {
      console.error('Error al obtener el periodo más cercano:', error);
      throw new Error('Error en la API de AEMET');
    }
  }

  /**
   * Obtener un resumen climatológico para una estación y período específicos
   * @param params - Parámetros para obtener valores climatológicos
   * @returns Resumen climatológico del período
   */
  async getClimateSummary(params: ClimateValuesParams): Promise<any> {
    try {
      // Primero obtenemos los valores climatológicos
      const climateData = await this.getClimateValues(params);
      
      // Si no hay datos, lanzamos un error
      if (!climateData.values || climateData.values.length === 0) {
        throw new Error('No hay datos climatológicos disponibles para el período especificado');
      }
      
      // Extraemos los valores para calcular estadísticas
      const temperatures = climateData.values.map(v => v.tm).filter(v => v !== undefined) as number[];
      const maxTemperatures = climateData.values.map(v => v.tmax).filter(v => v !== undefined) as number[];
      const minTemperatures = climateData.values.map(v => v.tmin).filter(v => v !== undefined) as number[];
      const precipitations = climateData.values.map(v => v.prec).filter(v => v !== undefined) as number[];
      const windSpeeds = climateData.values.map(v => v.velmedia).filter(v => v !== undefined) as number[];
      const windGusts = climateData.values.map(v => v.racha).filter(v => v !== undefined) as number[];
      
      // Calculamos las estadísticas
      const avgTemperature = this.calculateAverage(temperatures);
      const maxTemp = Math.max(...maxTemperatures);
      const maxTempDay = climateData.values.find(v => v.tmax === maxTemp);
      const minTemp = Math.min(...minTemperatures);
      const minTempDay = climateData.values.find(v => v.tmin === minTemp);
      const totalPrecipitation = this.calculateSum(precipitations);
      const daysWithPrecipitation = precipitations.filter(p => p > 0).length;
      const avgWindSpeed = this.calculateAverage(windSpeeds);
      const maxWindSpeed = Math.max(...windGusts);
      const maxWindDay = climateData.values.find(v => v.racha === maxWindSpeed);
      
      return {
        station: climateData.station,
        period: {
          startDate: params.startDate,
          endDate: params.endDate,
          totalDays: climateData.values.length
        },
        temperature: {
          avg: avgTemperature,
          max: {
            value: maxTemp,
            date: maxTempDay?.fecha
          },
          min: {
            value: minTemp,
            date: minTempDay?.fecha
          }
        },
        precipitation: {
          total: totalPrecipitation,
          daysWithPrecipitation,
          avg: totalPrecipitation / climateData.values.length
        },
        wind: {
          avgSpeed: avgWindSpeed,
          maxSpeed: {
            value: maxWindSpeed,
            date: maxWindDay?.fecha
          }
        },
        intentos: climateData.intentos
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al generar resumen climatológico: ${error.message}`);
      }
      throw new Error('Error desconocido al generar resumen climatológico');
    }
  }
}

// También exportamos el tipo AemetOptions para uso externo
export { AemetOptions }; 

/**
 * Ejemplo de uso del nuevo endpoint de predicción horaria por municipio
 * 
 * ```typescript
 * import { Aemet } from './aemet';
 * 
 * // Inicializar cliente con tu API key
 * const aemet = new Aemet('TU_API_KEY');
 * 
 * // Ejemplo 1: Obtener predicción horaria por municipio usando getClimateValues
 * async function ejemploPrediccionHoraria() {
 *   try {
 *     const params = {
 *       startDate: '2023-09-01',
 *       endDate: '2023-09-01',
 *       municipalityCode: '28079' // Madrid
 *     };
 *     
 *     const resultado = await aemet.getClimateValues(params);
 *     console.log('Datos de predicción horaria:', resultado);
 *     console.log('Datos crudos para explorar la estructura:', resultado.rawData);
 *   } catch (error) {
 *     console.error('Error:', error);
 *   }
 * }
 * 
 * // Ejemplo 2: Obtener predicción horaria usando getWeatherByCoordinates con código de municipio
 * async function ejemploPrediccionPorCoordenadas() {
 *   try {
 *     // Las coordenadas se ignoran cuando se proporciona un código de municipio
 *     const resultado = await aemet.getWeatherByCoordinates(
 *       40.4165, // latitud (se ignora si se proporciona municipalityCode)
 *       -3.7026, // longitud (se ignora si se proporciona municipalityCode)
 *       '28079'  // Madrid
 *     );
 *     
 *     console.log('Datos meteorológicos:', resultado);
 *     console.log('Datos crudos para explorar la estructura:', resultado.rawData);
 *   } catch (error) {
 *     console.error('Error:', error);
 *   }
 * }
 * 
 * // Ejecutar ejemplos
 * ejemploPrediccionHoraria();
 * ejemploPrediccionPorCoordenadas();
 * ```
 */ 