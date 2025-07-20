import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Plus, 
  QrCode, 
  Power, 
  Trash2, 
  User, 
  LogOut,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCodeModal from "@/components/QRCodeModal";
import InstanceCard from "@/components/InstanceCard";
import ConnectionNameModal from "@/components/ConnectionNameModal";
import { useConnectionStatusChecker } from "@/hooks/useConnectionStatusChecker";

interface WhatsAppConnection {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "qr_code" | "loading";
  phone?: string;
  createdAt: string;
  lastActivity?: string;
  qrCode?: string;
  qrCodeText?: string;
  whatsapp_profile_name?: string;
  whatsapp_profile_picture_url?: string;
  whatsapp_profile_picture_data?: string;
}

const Dashboard = () => {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showConnectionNameModal, setShowConnectionNameModal] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectingInstanceId, setConnectingInstanceId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Função para recarregar dados de uma conexão específica
  const reloadConnectionData = useCallback(async (connectionId: string) => {
    try {
      const { data: conexao, error } = await supabase
        .from('conexoes')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) {
        console.error('Erro ao recarregar dados da conexão:', error);
        return;
      }

      const updatedConnection: WhatsAppConnection = {
        id: conexao.id,
        name: conexao.name,
        status: conexao.status === 'active' ? 'connected' : 
               conexao.status === 'connecting' ? 'qr_code' : 'disconnected',
        phone: conexao.whatsapp_contact,
        createdAt: conexao.created_at,
        lastActivity: conexao.whatsapp_connected_at,
        whatsapp_profile_name: conexao.whatsapp_profile_name,
        whatsapp_profile_picture_url: conexao.whatsapp_profile_picture_url,
        whatsapp_profile_picture_data: conexao.whatsapp_profile_picture_data,
        qrCode: (conexao.configuration as any)?.qr_code,
        qrCodeText: (conexao.configuration as any)?.qr_code_text,
      };

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId ? updatedConnection : conn
        )
      );

      console.log('Dados da conexão recarregados:', updatedConnection);
    } catch (error) {
      console.error('Erro ao recarregar dados da conexão:', error);
    }
  }, []);

  // Hook para verificação automática de status
  const { isChecking, lastCheckTime, checkNow } = useConnectionStatusChecker({
    connections: connections,
    onStatusUpdate: (connectionId, newStatus) => {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { 
                ...conn, 
                status: newStatus,
                // Limpar dados se desconectou
                ...(newStatus === 'disconnected' && {
                  phone: undefined,
                  whatsapp_profile_name: undefined,
                  whatsapp_profile_picture_url: undefined
                })
              }
            : conn
        )
      );
    },
    onConnectionRestored: reloadConnectionData, // Callback para quando conexão é restaurada
    isEnabled: !showQRModal && !showConnectionNameModal, // Pausar quando modals estão abertos
    intervalMs: 30000 // 30 segundos
  });

  // Verificar autenticação e carregar conexões do Supabase
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }
      
      setUser(session.user);
      
      // Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (profile && profile.role === 'admin') {
        setIsAdmin(true);
      }
    };

    initializeUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
        
        // Verificar se é admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const loadConnections = async () => {
      setIsLoading(true);
      
      try {
        const { data: conexoes, error } = await supabase
          .from('conexoes')
          .select('*')
          .eq('type', 'whatsapp')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar conexões:', error);
          toast({
            title: "Erro",
            description: "Falha ao carregar conexões.",
            variant: "destructive",
          });
          return;
        }

        const mappedConnections: WhatsAppConnection[] = conexoes?.map(conexao => ({
          id: conexao.id,
          name: conexao.name,
          status: conexao.status === 'active' ? 'connected' : 
                 conexao.status === 'connecting' ? 'qr_code' : 'disconnected',
          phone: conexao.whatsapp_contact,
          createdAt: conexao.created_at,
          lastActivity: conexao.whatsapp_connected_at,
          whatsapp_profile_name: conexao.whatsapp_profile_name,
          whatsapp_profile_picture_url: conexao.whatsapp_profile_picture_url,
          whatsapp_profile_picture_data: conexao.whatsapp_profile_picture_data,
          qrCode: (conexao.configuration as any)?.qr_code,
          qrCodeText: (conexao.configuration as any)?.qr_code_text,
        })) || [];
        
        setConnections(mappedConnections);
      } catch (error) {
        console.error('Erro inesperado:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnections();
  }, [user, toast]);

  const handleCreateConnection = () => {
    setShowConnectionNameModal(true);
  };

  const handleConnectionNameSubmit = async (connectionName: string) => {
    setIsCreatingConnection(true);
    
    try {
      const response = await fetch('https://webhook.abbadigital.com.br/webhook/cria-instancia-matte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          connectionName: connectionName
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o servidor');
      }

      const result = await response.json();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: conexao, error } = await supabase
        .from('conexoes')
        .insert({
          user_id: user.id,
          name: connectionName,
          type: 'whatsapp',
          channel: 'whatsapp',
          status: 'connecting',
          configuration: {
            connection_status: "connecting",
            evolution_api_key: null,
            evolution_instance_name: result.instanceId,
            qr_code: result.base64,
            qr_code_text: result.code
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar no banco:', error);
        throw new Error('Falha ao salvar conexão no banco de dados');
      }
      
      const newConnection: WhatsAppConnection = {
        id: conexao.id,
        name: connectionName,
        status: "qr_code",
        createdAt: conexao.created_at,
        qrCode: result.base64,
        qrCodeText: result.code
      };
      
      setConnections(prev => [...prev, newConnection]);
      setSelectedConnectionId(conexao.id);
      setShowConnectionNameModal(false);
      setShowQRModal(true);
      
      toast({
        title: "Conexão criada!",
        description: "Escaneie o QR Code para conectar.",
      });
    } catch (error) {
      console.error('Erro ao criar conexão:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      // Note: não resetamos isCreatingConnection aqui, só quando o modal fechar ou conexão for bem-sucedida
    }
  };

  const handleConnectConnection = async (connectionId: string) => {
    setConnectingInstanceId(connectionId);
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) {
        throw new Error('Conexão não encontrada');
      }

      const response = await fetch(`https://webhook.abbadigital.com.br/webhook/conecta-matte?connectionName=${encodeURIComponent(connection.name)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const qrData = await response.json();
      console.log('Dados do QR Code recebidos:', qrData);

      const qrCodeImage = qrData.base64 ? (qrData.base64.startsWith('data:image') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`) : undefined;
      console.log('QR Code processado:', qrCodeImage);
      
      const updatedConnections = connections.map(conn => 
        conn.id === connectionId 
          ? { 
              ...conn, 
              qrCode: qrCodeImage,
              qrCodeText: qrData.qrCodeText,
              status: 'qr_code' as const
            }
          : conn
      );
      setConnections(updatedConnections);

      setSelectedConnectionId(connectionId);
      setShowQRModal(true);
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar conexão da instância",
        variant: "destructive",
      });
    } finally {
      setConnectingInstanceId(null);
    }
  };

  const handleDisconnectConnection = async (connectionId: string) => {
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) {
        throw new Error('Conexão não encontrada');
      }

      await fetch('https://webhook.abbadigital.com.br/webhook/desconecta-matte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: connection.name
        }),
      });

      const { error } = await supabase
        .from('conexoes')
        .update({
          status: 'disconnected',
          whatsapp_contact: null,
          whatsapp_profile_name: null,
          whatsapp_profile_picture_url: null,
          whatsapp_connected_at: null,
          configuration: {
            connection_status: "disconnected",
            evolution_api_key: null,
            evolution_instance_name: null
          }
        })
        .eq('id', connectionId);

      if (error) {
        throw error;
      }

      setConnections(prev =>
        prev.map(conn =>
          conn.id === connectionId
            ? { ...conn, status: "disconnected" as const, phone: undefined, whatsapp_profile_name: undefined, whatsapp_profile_picture_url: undefined }
            : conn
        )
      );
      
      toast({
        title: "Desconectado",
        description: "Conexão desconectada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: "Erro",
        description: "Falha ao desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) {
        throw new Error('Conexão não encontrada');
      }

      const response = await fetch('https://webhook.abbadigital.com.br/webhook/exclui-instancia-matte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: connection.name
        }),
      });

      if (!response.ok) {
        console.warn(`Erro na requisição de exclusão do webhook: ${response.status}`);
      }

      const { error } = await supabase
        .from('conexoes')
        .delete()
        .eq('id', connectionId);

      if (error) {
        throw error;
      }

      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      toast({
        title: "Excluído",
        description: "Conexão removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir conexão:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      toast({
        title: "Logout realizado",
        description: "Até mais!",
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast({
        title: "Erro",
        description: "Falha ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando suas conexões...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center">
              <img 
                src="/lovable-uploads/b2475506-2a2f-4c67-acd2-dc0db3beff0c.png" 
                alt="Marte Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">WhatsApp Manager</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas conexões</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status da verificação automática */}
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {isChecking ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : lastCheckTime ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Última verificação: {lastCheckTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              ) : null}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email || 'Usuário'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                  Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Suas Conexões</h2>
            <p className="text-muted-foreground">
              Gerencie suas conexões com o WhatsApp
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={checkNow} disabled={isChecking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Verificar Agora
            </Button>
            
            <Button onClick={handleCreateConnection} disabled={isCreatingConnection} className="flex items-center space-x-2">
              <Plus className={`h-4 w-4 ${isCreatingConnection ? 'animate-spin' : ''}`} />
              <span>{isCreatingConnection ? 'Criando...' : 'Nova Conexão'}</span>
            </Button>
          </div>
        </div>

        {connections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">Nenhuma conexão criada</CardTitle>
              <CardDescription className="mb-6">
                Crie sua primeira conexão para começar a usar o WhatsApp
              </CardDescription>
              <Button onClick={handleCreateConnection} disabled={isCreatingConnection}>
                <Plus className={`h-4 w-4 mr-2 ${isCreatingConnection ? 'animate-spin' : ''}`} />
                {isCreatingConnection ? 'Criando...' : 'Criar Primeira Conexão'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {connections.map((connection) => (
              <InstanceCard
                key={connection.id}
                instance={connection}
                onConnect={() => handleConnectConnection(connection.id)}
                onDisconnect={() => handleDisconnectConnection(connection.id)}
                onDelete={() => handleDeleteConnection(connection.id)}
                isConnecting={connectingInstanceId === connection.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Connection Name Modal */}
      <ConnectionNameModal
        isOpen={showConnectionNameModal}
        onClose={() => setShowConnectionNameModal(false)}
        onSubmit={handleConnectionNameSubmit}
        isLoading={isCreatingConnection}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setIsCreatingConnection(false);
        }}
        instanceId={selectedConnectionId}
        connection={connections.find(conn => conn.id === selectedConnectionId)}
        isNewConnection={isCreatingConnection}
        onConnectionSuccess={async (connectionId, phone, profileData) => {
          try {
            const { error } = await supabase
              .from('conexoes')
              .update({
                status: 'active',
                whatsapp_contact: phone,
                whatsapp_profile_name: profileData?.profilename,
                whatsapp_profile_picture_url: profileData?.fotodoperfil,
                whatsapp_connected_at: new Date().toISOString(),
                configuration: {
                  connection_status: "connected",
                  evolution_api_key: null,
                  evolution_instance_name: connectionId
                }
              })
              .eq('id', connectionId);

            if (error) {
              console.error('Erro ao atualizar conexão:', error);
            }

            setConnections(prev =>
              prev.map(conn =>
                conn.id === connectionId
                  ? { 
                      ...conn, 
                      status: "connected" as const, 
                      phone,
                      whatsapp_profile_name: profileData?.profilename,
                      whatsapp_profile_picture_url: profileData?.fotodoperfil
                    }
                  : conn
              )
            );
            setShowQRModal(false);
            setIsCreatingConnection(false);
          } catch (error) {
            console.error('Erro ao processar conexão:', error);
          }
        }}
      />
    </div>
  );
};

export default Dashboard;
