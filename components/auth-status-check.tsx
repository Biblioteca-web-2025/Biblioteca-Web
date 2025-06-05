"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function AuthStatusCheck() {
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'error'>('checking');
  const [details, setDetails] = useState<any>(null);
  
  const checkAuth = async () => {
    setStatus('checking');
    
    try {
      // Obtener token actual
      const token = localStorage.getItem('auth-token') || 
                    sessionStorage.getItem('auth-token');
      
      if (!token) {
        setStatus('invalid');
        setDetails({ error: 'No se encontró token de autenticación' });
        return;
      }
      
      // Intentar primero con el endpoint simplificado de verificación
      try {
        const authResponse = await fetch('/api/auth/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const authData = await authResponse.json();
        
        if (authResponse.ok && authData.authenticated) {
          setStatus('valid');
          setDetails({
            message: 'Autenticación verificada con éxito',
            userId: authData.userId,
            timestamp: authData.timestamp
          });
          return;
        }
      } catch (authError) {
        console.warn('Error en verificación simplificada:', authError);
        // Continuar con el endpoint de diagnóstico si falla
      }
      
      // Si llegamos aquí, intentar con el endpoint de diagnóstico completo
      const response = await fetch('/api/debug-auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const isValid = data.auth?.tokenValidation?.valid === true;
        setStatus(isValid ? 'valid' : 'invalid');
        setDetails(data);
      } else {
        setStatus('error');
        setDetails(data);
      }
    } catch (err) {
      console.error('Error de verificación de autenticación:', err);
      setStatus('error');
      setDetails({ error: err instanceof Error ? err.message : 'Error desconocido' });
    }
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, []);
  
  if (status === 'checking') {
    return (
      <Alert className="bg-yellow-50 border-yellow-200 mb-4">
        <AlertTitle className="text-yellow-700">Verificando autenticación...</AlertTitle>
        <AlertDescription className="text-yellow-600">
          Espere mientras verificamos su sesión.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (status === 'valid') {
    return (
      <Alert className="bg-green-50 border-green-200 mb-4">
        <AlertTitle className="text-green-700">Autenticación válida</AlertTitle>
        <AlertDescription className="text-green-600 flex justify-between items-center">
          <span>Sesión activa correctamente.</span>
          <Button variant="outline" size="sm" onClick={checkAuth} className="h-8">
            <RefreshCcw className="h-3 w-3 mr-2" /> Verificar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="bg-red-50 border-red-200 mb-4">
      <AlertTitle className="text-red-700">
        {status === 'invalid' ? 'Problema de autenticación' : 'Error de verificación'}
      </AlertTitle>
      <AlertDescription className="text-red-600">
        <div className="flex justify-between items-center mb-2">
          <span>
            {status === 'invalid' 
              ? 'Su sesión no es válida o ha expirado.' 
              : 'Ocurrió un error al verificar su sesión.'}
          </span>
          <Button variant="outline" size="sm" onClick={checkAuth} className="h-8">
            <RefreshCcw className="h-3 w-3 mr-2" /> Reintentar
          </Button>
        </div>
        <div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              localStorage.removeItem('auth-token');
              sessionStorage.removeItem('auth-token');
              window.location.href = '/login';
            }}
            className="w-full mt-2"
          >
            Cerrar sesión e iniciar nuevamente
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
