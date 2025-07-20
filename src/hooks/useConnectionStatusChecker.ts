
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatus {
  instanceName: string;
  status: 'Open' | 'Closed' | 'updating';
}

interface UseConnectionStatusCheckerProps {
  connections: Array<{
    id: string;
    name: string;
    status: 'connected' | 'disconnected' | 'qr_code' | 'loading';
  }>;
  onStatusUpdate: (connectionId: string, newStatus: 'connected' | 'disconnected' | 'loading') => void;
  isEnabled?: boolean;
  intervalMs?: number;
}

export const useConnectionStatusChecker = ({
  connections,
  onStatusUpdate,
  isEnabled = true,
  intervalMs = 30000 // 30 segundos por padrão
}: UseConnectionStatusCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const checkConnectionStatus = useCallback(async () => {
    if (!isEnabled || connections.length === 0) return;

    // Só verificar conexões que estão conectadas ou em qr_code (não loading)
    const connectionsToCheck = connections.filter(conn => 
      conn.status === 'connected' || conn.status === 'disconnected' || conn.status === 'qr_code'
    );

    if (connectionsToCheck.length === 0) return;

    setIsChecking(true);
    console.log('Iniciando verificação de status das conexões...');

    try {
      // Verificar cada conexão individualmente
      for (const connection of connectionsToCheck) {
        try {
          const response = await fetch(
            `https://webhook.abbadigital.com.br/webhook/verifica-status-matte?connectionName=${encodeURIComponent(connection.name)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            console.log(`Status da conexão ${connection.name}:`, data);
            
            let newStatus: 'connected' | 'disconnected' | 'loading';
            
            if (data.status === 'Open') {
              newStatus = 'connected';
            } else if (data.status === 'Closed') {
              newStatus = 'disconnected';
            } else {
              // Se não retornar Open nem Closed, status é "atualizando"
              newStatus = 'loading';
            }

            // Só atualizar se o status mudou
            const currentMappedStatus = connection.status === 'qr_code' ? 'loading' : connection.status;
            if (currentMappedStatus !== newStatus) {
              console.log(`Status da conexão ${connection.name} mudou de ${currentMappedStatus} para ${newStatus}`);
              
              // Atualizar no banco de dados
              const dbStatus = newStatus === 'connected' ? 'active' : 
                             newStatus === 'disconnected' ? 'disconnected' : 'connecting';
              
              const updateData: any = {
                status: dbStatus
              };

              // Se desconectou, limpar dados do WhatsApp
              if (newStatus === 'disconnected') {
                updateData.whatsapp_contact = null;
                updateData.whatsapp_profile_name = null;
                updateData.whatsapp_profile_picture_url = null;
                updateData.whatsapp_connected_at = null;
                updateData.configuration = {
                  connection_status: "disconnected",
                  evolution_api_key: null,
                  evolution_instance_name: null
                };
              }

              const { error } = await supabase
                .from('conexoes')
                .update(updateData)
                .eq('id', connection.id);

              if (error) {
                console.error('Erro ao atualizar status no banco:', error);
              } else {
                // Notificar mudança de status
                onStatusUpdate(connection.id, newStatus);
                
                // Mostrar toast apenas para mudanças significativas
                if (currentMappedStatus === 'connected' && newStatus === 'disconnected') {
                  toast({
                    title: "Conexão perdida",
                    description: `A conexão ${connection.name} foi desconectada.`,
                    variant: "destructive",
                  });
                } else if (currentMappedStatus === 'disconnected' && newStatus === 'connected') {
                  toast({
                    title: "Reconectado",
                    description: `A conexão ${connection.name} foi restabelecida.`,
                  });
                }
              }
            }
          } else {
            console.warn(`Erro ao verificar status da conexão ${connection.name}: ${response.status}`);
          }
        } catch (error) {
          console.error(`Erro ao verificar conexão ${connection.name}:`, error);
        }
      }

      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Erro geral na verificação de status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [connections, isEnabled, onStatusUpdate, toast]);

  // Configurar intervalo de verificação
  useEffect(() => {
    if (!isEnabled) return;

    // Verificação inicial após 5 segundos
    const initialTimer = setTimeout(() => {
      checkConnectionStatus();
    }, 5000);

    // Verificação periódica
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkConnectionStatus, isEnabled, intervalMs]);

  // Pausar verificações quando a página não está visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Página oculta - pausando verificações');
      } else {
        console.log('Página visível - retomando verificações');
        // Verificar imediatamente quando a página voltar a ficar visível
        setTimeout(checkConnectionStatus, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkConnectionStatus]);

  return {
    isChecking,
    lastCheckTime,
    checkNow: checkConnectionStatus
  };
};
