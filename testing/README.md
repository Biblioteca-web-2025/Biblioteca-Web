# Testing Structure

Este directorio contiene todos los archivos relacionados con testing para el proyecto Biblioteca Digital.

## Estructura

- `unit/` - Tests unitarios para componentes individuales
- `integration/` - Tests de integración para flujos completos
- `scripts/` - Scripts de utilidad para testing (setup, teardown, helpers)

## Configuración

Los archivos de configuración de testing están en la raíz del proyecto:
- `jest.config.js` - Configuración de Jest
- `jest.setup.js` - Setup global para tests

## Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage
```

## Convenciones

- Los archivos de test unitario deben terminar en `.test.ts` o `.spec.ts`
- Los tests de integración deben estar en `integration/` y seguir el patrón `*.integration.test.ts`
- Los scripts de utilidad para testing van en `scripts/`

## Ejemplos

Ver `unit/featured-carousel.test.ts` para un ejemplo de test unitario básico.
