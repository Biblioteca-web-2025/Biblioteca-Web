@echo off
cd /d "d:\2. Office Time\1. v1tr0\1.Proyectos en curso\1. Servicios web\Biblioteca\biblioteca"
echo Installing dependencies...
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @supabase/supabase-js
echo Dependencies installed!
echo Starting development server...
npm run dev
pause
