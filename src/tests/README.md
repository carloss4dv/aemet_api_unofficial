# Tests para AEMET API

Este directorio contiene los tests para la API de AEMET. Los tests están escritos utilizando Jest y están organizados en varias suites:

## Estructura de los tests

- **utils.test.ts**: Tests para las funciones de utilidad.
- **aemet.test.ts**: Tests para la clase principal Aemet.
- **api.test.ts**: Tests para las llamadas a la API externa usando mocks.
- **index.test.ts**: Tests para la función principal exportada.

## Ejecución de los tests

Para ejecutar los tests, utiliza los siguientes comandos:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con modo watch
npm run test:watch

# Ejecutar tests con informe de cobertura
npm run test:coverage
```

## Mocks

Los tests utilizan varias estrategias de mock:

1. **nock**: Para interceptar y simular respuestas HTTP en las llamadas a la API externa.
2. **jest.mock**: Para reemplazar funciones específicas con implementaciones de prueba.
3. **jest.spyOn**: Para verificar que las funciones son llamadas correctamente.
4. **jest.useFakeTimers**: Para controlar el tiempo en el sistema durante las pruebas.

## Cobertura

Los tests están diseñados para cubrir:

- Flujos principales de la API
- Manejo de errores
- Casos límite
- Formatos de datos especiales
- Timeouts y problemas de conexión

Para ver un informe detallado de la cobertura, ejecuta `npm run test:coverage`.

## Añadir nuevos tests

Para añadir nuevos tests, sigue estas pautas:

1. Crea un nuevo archivo `.test.ts` en este directorio o añade tests a los archivos existentes.
2. Usa la estructura `describe` y `it` para organizar los tests.
3. Utiliza mocks para aislar la funcionalidad que estás probando.
4. Considera agregar tests tanto para casos de éxito como para casos de error. 