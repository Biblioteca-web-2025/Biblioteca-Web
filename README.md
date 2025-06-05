# Biblioteca Digital

Sistema de gestión de biblioteca digital con Next.js, Supabase y Cloudflare R2.

## Requisitos previos

- Node.js 18.x o superior
- Una cuenta en [Supabase](https://supabase.com/) (para la base de datos)
- Una cuenta en [Cloudflare R2](https://developers.cloudflare.com/r2/) (para almacenamiento de archivos)

## Configuración inicial

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

4. Configura tus variables de entorno:
   - Crea un proyecto en Supabase y actualiza las credenciales
   - Configura un bucket de R2 en Cloudflare y actualiza las credenciales

## Configuración de Supabase

1. Ejecuta el script de esquema de base de datos en la consola SQL de Supabase:

```sql
-- Se encuentra en scripts/supabase-schema.sql
```

2. Crea un usuario administrador inicial:

```sql
-- Se encuentra en scripts/create-first-admin.sql
```

## Configuración de R2

1. Crea un bucket en Cloudflare R2 con el nombre que prefieras
2. Asegúrate de que el bucket tenga las políticas CORS adecuadas:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Ejecutar la aplicación

```bash
npm run dev
```

## Solución de problemas comunes

### Problema: No se puede iniciar sesión

1. Verifica que las credenciales de Supabase sean correctas
2. Asegúrate de que exista al menos un usuario en la tabla `admin_users`
3. Verifica los logs del servidor para errores específicos

### Problema: No se pueden subir documentos

1. Verifica que las credenciales de R2 sean correctas
2. Asegúrate de que el bucket exista y sea accesible
3. Revisa las políticas CORS del bucket R2
4. Verifica la validez del token de autenticación

### Problema: Error "Token expired"

1. Cierra sesión y vuelve a iniciar sesión
2. Verifica la configuración de tiempo de expiración de tokens JWT

## Mantenimiento

### Backup de la base de datos

Recomendamos hacer respaldos regulares de tu base de datos Supabase:

1. Desde el panel de Supabase, ve a "Database" > "Backups"
2. Programa backups automáticos o realiza uno manual

### Monitoreo de almacenamiento R2

Monitorea regularmente el uso de tu bucket R2 para evitar costos inesperados.
