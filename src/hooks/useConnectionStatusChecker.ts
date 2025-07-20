
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseConnectionStatusCheckerProps {
  connections: Array<{
    id: string;
    name: string;
    status: 'connected' | 'disconnected' | 'qr_code' | 'loading';
  }>;
  onStatusUpdate: (connectionId: string, newStatus: 'connected' | 'disconnected' | 'loading') => void;
  onConnectionRestored?: (connectionId: string) => void;
  isEnabled?: boolean;
  intervalMs?: number;
}

export const useConnectionStatusChecker = ({
  connections,
  onStatusUpdate,
  onConnectionRestored,
  isEnabled = true,
  intervalMs = 60000 // Aumentar para 1 minuto para reduzir carga
}: UseConnectionStatusCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const checkingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkConnectionStatus = useCallback(async (forceCheckAll = false) => {
    // Evitar múltiplas verificações simultâneas
    if (!isEnabled || connections.length === 0 || checkingRef.current) {
      console.log('Verificação pulada:', { isEnabled, connectionsLength: connections.length, isChecking: checkingRef.current });
      return;
    }

    const connectionsToCheck = forceCheckAll 
      ? connections 
      : connections.filter(conn => conn.status === 'connected' || conn.status === 'qr_code');

    if (connectionsToCheck.length === 0) {
      console.log('Nenhuma conexão para verificar');
      return;
    }

    checkingRef.current = true;
    setIsChecking(true);
    console.log('Iniciando verificação de status:', connectionsToCheck.length, 'conexões');

    try {
      // Verificar apenas as primeiras 3 conexões por vez para evitar sobrecarga
      const batchSize = 3;
      const batches = [];
      for (let i = 0; i < connectionsToCheck.length; i += batchSize) {
        batches.push(connectionsToCheck.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.allSettled(
          batch.map(async (connection) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10s

              const response = await fetch(
                `https://webhook.abbadigital.com.br/webhook/verifica-status-matte?connectionName=${encodeURIComponent(connection.name)}`,
                {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  signal: controller.signal,
                }
              );

              clearTimeout(timeoutId);

              if (response.ok) {
                const responseText = await response.text();
                console.log(`Status ${connection.name}:`, responseText);
                
                let newStatus: 'connected' | 'disconnected' | 'loading';
                
                if (responseText.toLowerCase() === 'open') {
                  newStatus = 'connected';
                } else if (responseText.toLowerCase() === 'close') {
                  newStatus = 'disconnected';
                } else {
                  newStatus = 'loading';
                }

                const currentMappedStatus = connection.status === 'qr_code' ? 'loading' : connection.status;
                if (currentMappedStatus !== newStatus) {
                  console.log(`Status mudou: ${connection.name} ${currentMappedStatus} -> ${newStatus}`);
                  
                  // Atualizar no banco apenas se necessário
                  const dbStatus = newStatus === 'connected' ? 'active' : 
                                 newStatus === 'disconnected' ? 'disconnected' : 'connecting';
                  
                  const { error } = await supabase
                    .from('conexoes')
                    .update({ 
                      status: dbStatus,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', connection.id);

                  if (!error) {
                    onStatusUpdate(connection.id, newStatus);
                    
                    if (currentMappedStatus === 'disconnected' && newStatus === 'connected' && onConnectionRestored) {
                      onConnectionRestored(connection.id);
                    }
                    
                    // Toast apenas para mudanças importantes
                    if (currentMappedStatus === 'connected' && newStatus === 'disconnected') {
                      toast({
                        title: "Conexão perdida",
                        description: `${connection.name} desconectada.`,
                        variant: "destructive",
                      });
                    } else if (currentMappedStatus === 'disconnected' && newStatus === 'connected') {
                      toast({
                        title: "Reconectado",
                        description: `${connection.name} restabelecida.`,
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.warn(`Erro ao verificar ${connection.name}:`, error);
            }
          })
        );
      }

      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Erro na verificação de status:', error);
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }, [connections, isEnabled, onStatusUpdate, onConnectionRestored, toast]);

  // Configurar intervalo simplificado
  useEffect(() => {
    if (!isEnabled || connections.length === 0) return;

    // Verificação inicial após 10 segundos (reduzido de 5s)
    const initialTimer = setTimeout(() => {
      checkConnectionStatus();
    }, 10000);

    // Verificação periódica
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkConnectionStatus, isEnabled, intervalMs]);

  // Pausar verificações quando página não está visível (simplificado)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isEnabled) {
        // Verificar após 2 segundos quando página voltar a ficar visível
        timeoutRef.current = setTimeout(() => checkConnectionStatus(), 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [checkConnectionStatus, isEnabled]);

  return {
    isChecking,
    lastCheckTime,
    checkNow: () => {
      if (!checkingRef.current) {
        checkConnectionStatus(true);
      }
    }
  };
};
