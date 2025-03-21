import { getSkyStateDescription, formatDate, getDayForecast } from '../lib/utils';

describe('Utilidades', () => {
  describe('getSkyStateDescription', () => {
    it('debe devolver la descripción correcta para un código conocido', () => {
      expect(getSkyStateDescription('11')).toBe('Despejado');
      expect(getSkyStateDescription('14')).toBe('Nuboso');
      expect(getSkyStateDescription('26')).toBe('Cubierto con lluvia');
    });

    it('debe devolver "Desconocido" para un código no existente', () => {
      expect(getSkyStateDescription('999')).toBe('Desconocido');
      expect(getSkyStateDescription('')).toBe('Desconocido');
    });
  });

  describe('formatDate', () => {
    it('debe formatear la fecha correctamente como YYYY-MM-DD', () => {
      const date = new Date(2023, 0, 15); // 15 de enero de 2023
      expect(formatDate(date)).toBe('2023-01-15');
    });

    it('debe manejar correctamente los meses y días con un solo dígito', () => {
      const date = new Date(2023, 0, 1); // 1 de enero de 2023
      expect(formatDate(date)).toBe('2023-01-01');
    });
  });

  describe('getDayForecast', () => {
    const mockForecast = [
      { fecha: '2023-01-15', temperatura: { maxima: 20, minima: 10 } },
      { fecha: '2023-01-16', temperatura: { maxima: 22, minima: 12 } },
      { fecha: '2023-01-17', temperatura: { maxima: 18, minima: 8 } }
    ];

    it('debe devolver el pronóstico correcto para una fecha específica', () => {
      const result = getDayForecast(mockForecast, new Date(2023, 0, 16));
      expect(result).toEqual({ fecha: '2023-01-16', temperatura: { maxima: 22, minima: 12 } });
    });

    it('debe devolver undefined si no hay pronóstico para la fecha', () => {
      const result = getDayForecast(mockForecast, new Date(2023, 0, 20));
      expect(result).toBeUndefined();
    });

    it('debe lanzar un error si el forecast no es un array válido', () => {
      expect(() => getDayForecast(null as any, new Date())).toThrow('El forecast no es un array válido');
      expect(() => getDayForecast({} as any, new Date())).toThrow('El forecast no es un array válido');
    });

    it('debe lanzar un error si la fecha es inválida', () => {
      expect(() => getDayForecast(mockForecast, new Date('invalid date'))).toThrow('Fecha inválida');
    });

    it('debe calcular la fecha correctamente a partir de un offset numérico', () => {
      // Usamos una fecha fija para las pruebas
      const fixedDate = new Date('2023-01-15T00:00:00Z');
      jest.useFakeTimers().setSystemTime(fixedDate);

      try {
        const resultToday = getDayForecast(mockForecast, 0);
        expect(resultToday).toEqual({ fecha: '2023-01-15', temperatura: { maxima: 20, minima: 10 } });

        const resultTomorrow = getDayForecast(mockForecast, 1);
        expect(resultTomorrow).toEqual({ fecha: '2023-01-16', temperatura: { maxima: 22, minima: 12 } });

        const resultNext2 = getDayForecast(mockForecast, 2);
        expect(resultNext2).toEqual({ fecha: '2023-01-17', temperatura: { maxima: 18, minima: 8 } });
      } finally {
        jest.useRealTimers(); // Restaurar timers reales
      }
    });
  });
}); 