import { useState, useEffect } from "react";
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
  WifiOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCodeModal from "@/components/QRCodeModal";
import InstanceCard from "@/components/InstanceCard";

interface WhatsAppInstance {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "qr_code" | "loading";
  phone?: string;
  createdAt: string;
  lastActivity?: string;
}

const Dashboard = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const { toast } = useToast();

  // Simulação de dados - substituir pela integração real com Supabase
  useEffect(() => {
    const loadInstances = async () => {
      setIsLoading(true);
      
      // Simulação de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados de exemplo
      const mockInstances: WhatsAppInstance[] = [
        {
          id: "inst_1",
          name: "Instância Principal",
          status: "connected",
          phone: "+55 11 99999-9999",
          createdAt: "2024-01-15T10:30:00Z",
          lastActivity: "2024-01-18T14:25:00Z"
        }
      ];
      
      setInstances(mockInstances);
      setIsLoading(false);
    };

    loadInstances();
  }, []);

  const handleCreateInstance = async () => {
    try {
      // TODO: Integrar com n8n webhook para criar instância
      const newInstance: WhatsAppInstance = {
        id: `inst_${Date.now()}`,
        name: `Instância ${instances.length + 1}`,
        status: "qr_code",
        createdAt: new Date().toISOString(),
      };
      
      setInstances(prev => [...prev, newInstance]);
      setSelectedInstanceId(newInstance.id);
      setShowQRModal(true);
      
      toast({
        title: "Instância criada!",
        description: "Escaneie o QR Code para conectar.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar instância. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleConnectInstance = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setShowQRModal(true);
  };

  const handleDisconnectInstance = async (instanceId: string) => {
    try {
      // TODO: Integrar com n8n webhook para desconectar
      setInstances(prev =>
        prev.map(inst =>
          inst.id === instanceId
            ? { ...inst, status: "disconnected" as const, phone: undefined }
            : inst
        )
      );
      
      toast({
        title: "Desconectado",
        description: "Instância desconectada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      // TODO: Integrar com n8n webhook para excluir
      setInstances(prev => prev.filter(inst => inst.id !== instanceId));
      
      toast({
        title: "Excluído",
        description: "Instância removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    // TODO: Implementar logout com Supabase
    toast({
      title: "Logout realizado",
      description: "Até mais!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando suas instâncias...</p>
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
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>usuário@email.com</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Suas Instâncias</h2>
            <p className="text-muted-foreground">
              Gerencie suas conexões com o WhatsApp
            </p>
          </div>
          
          <Button onClick={handleCreateInstance} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nova Instância</span>
          </Button>
        </div>

        {instances.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Smartphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">Nenhuma instância criada</CardTitle>
              <CardDescription className="mb-6">
                Crie sua primeira instância para começar a usar o WhatsApp
              </CardDescription>
              <Button onClick={handleCreateInstance}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Instância
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onConnect={() => handleConnectInstance(instance.id)}
                onDisconnect={() => handleDisconnectInstance(instance.id)}
                onDelete={() => handleDeleteInstance(instance.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        instanceId={selectedInstanceId}
        onConnectionSuccess={(instanceId, phone) => {
          setInstances(prev =>
            prev.map(inst =>
              inst.id === instanceId
                ? { ...inst, status: "connected" as const, phone }
                : inst
            )
          );
          setShowQRModal(false);
        }}
      />
    </div>
  );
};

export default Dashboard;