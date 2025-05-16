import { Aemet } from '../aemet';
import nock from 'nock';
import * as utils from '../lib/utils';
import { DEFAULT_BASE_URL } from '../lib/constants';

// Mock de la función fetchAemetData
jest.mock('../lib/utils', () => ({
  ...jest.requireActual('../lib/utils'),
  fetchAemetData: jest.fn(),
  getSkyStateDescription: jest.fn((code) => `Descripción para ${code}`),
  getDayForecast: jest.fn()
}));

describe('Cliente Aemet', () => {
  const apiKey = 'api-key-de-prueba';
  let aemet: Aemet;

  beforeEach(() => {
    aemet = new Aemet(apiKey);
    jest.clearAllMocks();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Constructor', () => {
    it('debe inicializar correctamente con apiKey', () => {
      expect(aemet).toBeInstanceOf(Aemet);
    });

    it('debe lanzar error si no se proporciona apiKey', () => {
      expect(() => new Aemet('')).toThrow('La API key es obligatoria');
    });

    it('debe usar los valores por defecto si no se proporcionan opciones', () => {
      expect((aemet as any).baseUrl).toBe(DEFAULT_BASE_URL);
      expect((aemet as any).timeout).toBe(10000);
    });

    it('debe usar valores personalizados si se proporcionan opciones', () => {
      const customBaseUrl = 'https://custom-api.aemet.es';
      const customTimeout = 5000;
      const customAemet = new Aemet(apiKey, {
        baseUrl: customBaseUrl,
        timeout: customTimeout,
      });

      expect((customAemet as any).baseUrl).toBe(customBaseUrl);
      expect((customAemet as any).timeout).toBe(customTimeout);
    });
  });

  describe('getSimpleForecast', () => {
    const municipalityCode = '28001';
    const mockForecastData = {
      nombre: 'Madrid',
      provincia: 'Madrid',
      prediccion: {
        dia: [
          {
            fecha: '2023-01-15',
            estadoCielo: [{ value: '11' }],
            temperatura: { minima: 5, maxima: 15 }
          },
          {
            fecha: '2023-01-16',
            estadoCielo: [{ value: '12' }],
            temperatura: { minima: 7, maxima: 18 }
          },
          {
            fecha: '2023-01-17',
            estadoCielo: [{ value: '13' }],
            temperatura: { minima: 6, maxima: 16 }
          }
        ]
      }
    };

    beforeEach(() => {
      // Configuramos el mock de getDayForecast para devolver los datos correctos
      (utils.getDayForecast as jest.Mock).mockImplementation((forecast, offset) => {
        if (offset === 0) return mockForecastData.prediccion.dia[0];
        if (offset === 1) return mockForecastData.prediccion.dia[1];
        if (offset === 2) return mockForecastData.prediccion.dia[2];
        return null;
      });
      
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockForecastData);
    });

    it('debe devolver la predicción simplificada correctamente', async () => {
      const result = await aemet.getSimpleForecast(municipalityCode);

      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining(municipalityCode),
        apiKey,
        10000
      );
      
      expect(result).toEqual({
        name: 'Madrid',
        province: 'Madrid',
        today: {
          value: expect.any(String),
          descripcion: expect.any(String),
          tmp: {
            min: 5,
            max: 15
          }
        },
        tomorrow: {
          value: expect.any(String),
          descripcion: expect.any(String),
          tmp: {
            min: 7,
            max: 18
          }
        },
        next2: {
          value: expect.any(String),
          descripcion: expect.any(String),
          tmp: {
            min: 6,
            max: 16
          }
        },
        intentos: undefined
      });
    });

    it('debe lanzar error si el código de municipio no es válido', async () => {
      await expect(aemet.getSimpleForecast('')).rejects.toThrow('El código de municipio debe tener 5 dígitos');
      await expect(aemet.getSimpleForecast('1234')).rejects.toThrow('El código de municipio debe tener 5 dígitos');
      await expect(aemet.getSimpleForecast('123456')).rejects.toThrow('El código de municipio debe tener 5 dígitos');
    });

    it('debe manejar errores en la respuesta de la API', async () => {
      (utils.fetchAemetData as jest.Mock).mockRejectedValue(new Error('Error de API'));
      
      await expect(aemet.getSimpleForecast(municipalityCode)).rejects.toThrow('Error al obtener la predicción: Error de API');
    });
  });

  describe('getForecast', () => {
    const municipalityCode = '28001';
    const mockForecastData = {
      nombre: 'Madrid',
      provincia: 'Madrid',
      prediccion: {
        dia: [
          {
            fecha: '2023-01-15',
            estadoCielo: [{ value: '11' }],
            temperatura: { minima: 5, maxima: 15 }
          },
          {
            fecha: '2023-01-16',
            estadoCielo: [{ value: '12' }],
            temperatura: { minima: 7, maxima: 18 }
          },
          {
            fecha: '2023-01-17',
            estadoCielo: [{ value: '13' }],
            temperatura: { minima: 6, maxima: 16 }
          }
        ]
      }
    };

    beforeEach(() => {
      // Configuramos el mock de getDayForecast para devolver los datos correctos
      (utils.getDayForecast as jest.Mock).mockImplementation((forecast, offset) => {
        if (offset === 0) return mockForecastData.prediccion.dia[0];
        if (offset === 1) return mockForecastData.prediccion.dia[1];
        if (offset === 2) return mockForecastData.prediccion.dia[2];
        return null;
      });
      
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockForecastData);
    });

    it('debe devolver la predicción completa correctamente', async () => {
      const result = await aemet.getForecast(municipalityCode);

      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining(municipalityCode),
        apiKey,
        10000
      );
      
      // Verifica que incluya los datos simplificados y el forecast completo
      expect(result).toEqual({
        name: 'Madrid',
        province: 'Madrid',
        today: expect.any(Object),
        tomorrow: expect.any(Object),
        next2: expect.any(Object),
        forecast: mockForecastData.prediccion.dia,
        intentos: undefined
      });
    });

    it('debe lanzar error si el código de municipio no es válido', async () => {
      await expect(aemet.getForecast('')).rejects.toThrow('El código de municipio debe tener 5 dígitos');
    });
  });

  describe('getMunicipalities', () => {
    const mockMunicipalities = [
      { nombre: 'Madrid', id: '28001' },
      { nombre: 'Barcelona', id: '08001' }
    ];

    beforeEach(() => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockMunicipalities);
    });

    it('debe devolver la lista de municipios correctamente', async () => {
      const result = await aemet.getMunicipalities();
      
      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining('municipios'),
        apiKey,
        10000
      );
      
      expect(result).toEqual(mockMunicipalities);
    });

    it('debe manejar errores en la respuesta', async () => {
      (utils.fetchAemetData as jest.Mock).mockRejectedValue(new Error('Error de API'));
      
      await expect(aemet.getMunicipalities()).rejects.toThrow('Error al obtener los municipios: Error de API');
    });
  });

  describe('getProvinces', () => {
    const mockProvinces = [
      { nombre: 'Madrid', id: '28' },
      { nombre: 'Barcelona', id: '08' }
    ];

    beforeEach(() => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockProvinces);
    });

    it('debe devolver la lista de provincias correctamente', async () => {
      const result = await aemet.getProvinces();
      
      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining('provincias'),
        apiKey,
        10000
      );
      
      expect(result).toEqual(mockProvinces);
    });

    it('debe manejar errores en la respuesta', async () => {
      (utils.fetchAemetData as jest.Mock).mockRejectedValue(new Error('Error de API'));
      
      await expect(aemet.getProvinces()).rejects.toThrow('Error al obtener las provincias: Error de API');
    });
  });

  describe('getAlertsToday', () => {
    const mockAlerts = { alerts: ['Alerta 1', 'Alerta 2'] };

    beforeEach(() => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockAlerts);
    });

    it('debe devolver los avisos de hoy correctamente', async () => {
      const result = await aemet.getAlertsToday();
      
      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining('today'),
        apiKey,
        10000
      );
      
      expect(result).toEqual(mockAlerts);
    });

    it('debe manejar errores en la respuesta', async () => {
      (utils.fetchAemetData as jest.Mock).mockRejectedValue(new Error('Error de API'));
      
      await expect(aemet.getAlertsToday()).rejects.toThrow('Error al obtener los avisos para hoy: Error de API');
    });
  });

  describe('getAlertsTomorrow', () => {
    const mockAlerts = { alerts: ['Alerta 1', 'Alerta 2'] };

    beforeEach(() => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockAlerts);
    });

    it('debe devolver los avisos de mañana correctamente', async () => {
      const result = await aemet.getAlertsTomorrow();
      
      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining('tomorrow'),
        apiKey,
        10000
      );
      
      expect(result).toEqual(mockAlerts);
    });

    it('debe manejar errores en la respuesta', async () => {
      (utils.fetchAemetData as jest.Mock).mockRejectedValue(new Error('Error de API'));
      
      await expect(aemet.getAlertsTomorrow()).rejects.toThrow('Error al obtener los avisos para mañana: Error de API');
    });
  });

  describe('Valores climatológicos', () => {
    const mockStations = [
      {
        indicativo: 'EST001',
        nombre: 'Estación Madrid',
        provincia: 'Madrid',
        altitud: '667',
        latitud: '40.4168',
        longitud: '-3.7038'
      },
      {
        indicativo: 'EST002',
        nombre: 'Estación Barcelona',
        provincia: 'Barcelona',
        altitud: '12',
        latitud: '41.3851',
        longitud: '2.1734'
      }
    ];

    const mockClimateValues = [
      {
        fecha: '2023-01-01',
        indicativo: 'EST001',
        nombre: 'Estación Madrid',
        provincia: 'Madrid',
        altitud: '667',
        tmax: '15.2',
        horatmax: '14:00',
        tmin: '5.1',
        horatmin: '06:30',
        tm: '10.2',
        prec: '0.0',
        velmedia: '2.1',
        racha: '5.6',
        dir: '135',
        inso: '7.2',
        presMax: '1025.3',
        presMin: '1020.1'
      },
      {
        fecha: '2023-01-02',
        indicativo: 'EST001',
        nombre: 'Estación Madrid',
        provincia: 'Madrid',
        altitud: '667',
        tmax: '16.4',
        horatmax: '15:10',
        tmin: '6.2',
        horatmin: '05:45',
        tm: '11.3',
        prec: '2.5',
        velmedia: '3.0',
        racha: '8.2',
        dir: '180',
        inso: '5.5',
        presMax: '1022.4',
        presMin: '1018.7'
      }
    ];

    it('debe obtener la lista de estaciones meteorológicas', async () => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockStations);

      const result = await aemet.getWeatherStations();

      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining('/valores/climatologicos/inventarioestaciones/todasestaciones/'),
        apiKey,
        expect.any(Number)
      );
      expect(result).toHaveLength(2);
      expect(result[0].indicativo).toBe('EST001');
      expect(result[0].nombre).toBe('Estación Madrid');
      expect(result[0].geoposicion).toEqual({
        latitud: 40.4168,
        longitud: -3.7038
      });
    });

    it('debe buscar estaciones por nombre', async () => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockStations);

      const result = await aemet.searchWeatherStations('Madrid');

      expect(utils.fetchAemetData).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Estación Madrid');
    });

    it('debe buscar estaciones por provincia', async () => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockStations);

      const result = await aemet.searchWeatherStations('Barcelona');

      expect(utils.fetchAemetData).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].provincia).toBe('Barcelona');
    });

    it('debe obtener valores climatológicos para una estación y período', async () => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockClimateValues);

      const result = await aemet.getClimateValues({
        stationId: 'EST001',
        startDate: '2023-01-01',
        endDate: '2023-01-02'
      });

      expect(utils.fetchAemetData).toHaveBeenCalledWith(
        expect.stringContaining('/valores/climatologicos/diarios/datos/'),
        apiKey,
        expect.any(Number)
      );
      expect(result.station.indicativo).toBe('EST001');
      expect(result.values).toHaveLength(2);
      expect(result.values[0].fecha).toBe('2023-01-01');
      expect(result.values[0].tmax).toBe(15.2);
      expect(result.values[1].prec).toBe(2.5);
    });

    it('debe generar un resumen climatológico para un período', async () => {
      (utils.fetchAemetData as jest.Mock).mockResolvedValue(mockClimateValues);

      const result = await aemet.getClimateSummary({
        stationId: 'EST001',
        startDate: '2023-01-01',
        endDate: '2023-01-02'
      });

      expect(utils.fetchAemetData).toHaveBeenCalled();
      expect(result.station.indicativo).toBe('EST001');
      expect(result.period.totalDays).toBe(2);
      expect(result.temperature.max.value).toBe(16.4);
      expect(result.temperature.min.value).toBe(5.1);
      expect(result.temperature.avg).toBe(10.75); // (10.2 + 11.3) / 2
      expect(result.precipitation.total).toBe(2.5); // 0.0 + 2.5
      expect(result.precipitation.daysWithPrecipitation).toBe(1); // Solo el segundo día tuvo precipitación
      expect(result.wind.maxSpeed.value).toBe(8.2);
    });

    it('debe validar los parámetros al obtener valores climatológicos', async () => {
      await expect(aemet.getClimateValues({} as any)).rejects.toThrow('Se requieren los parámetros');
      await expect(aemet.getClimateValues({
        stationId: 'EST001',
        startDate: '2023-01-01',
        endDate: '2023/01/02' // Formato incorrecto
      })).rejects.toThrow('Formato de fecha incorrecto');
    });

    it('debe manejar correctamente errores al obtener valores climatológicos', async () => {
      (utils.fetchAemetData as jest.Mock).mockRejectedValue(new Error('Error de API'));

      await expect(aemet.getClimateValues({
        stationId: 'EST001',
        startDate: '2023-01-01',
        endDate: '2023-01-02'
      })).rejects.toThrow('Error al obtener valores climatológicos');
    });

    it('debe calcular correctamente la media de valores', () => {
      const calculateAverage = (aemet as any).calculateAverage;
      
      expect(calculateAverage([10, 20, 30])).toBe(20);
      expect(calculateAverage([])).toBe(0);
      expect(calculateAverage([5])).toBe(5);
    });

    it('debe calcular correctamente la suma de valores', () => {
      const calculateSum = (aemet as any).calculateSum;
      
      expect(calculateSum([10, 20, 30])).toBe(60);
      expect(calculateSum([])).toBe(0);
      expect(calculateSum([5])).toBe(5);
    });
  });
}); 