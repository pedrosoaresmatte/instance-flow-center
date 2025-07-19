
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppConnection {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "qr_code" | "loading";
  phone?: string;
  createdAt: string;
  lastActivity?: string;
  qrCode?: string;
  qrCodeText?: string;
}

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string | null;
  connection?: WhatsAppConnection;
  onConnectionSuccess: (instanceId: string, phone: string, profileData?: any) => void;
}

const QRCodeModal = ({ isOpen, onClose, instanceId, connection, onConnectionSuccess }: QRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60); // Aumentado para 60 segundos
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && instanceId) {
      // Se a conexão já tem QR code, usar ele
      if (connection?.qrCode) {
        setQrCode(connection.qrCode);
        setIsLoading(false);
        setCountdown(60);
      } else {
        generateQRCode();
      }
    }
  }, [isOpen, instanceId, connection]);

  // Contador regressivo
  useEffect(() => {
    if (isOpen && !isConnected && countdown > 0 && qrCode) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isConnected) {
      // Apenas gerar novo QR code se ainda não conectou
      generateQRCode();
    }
  }, [isOpen, countdown, isConnected, qrCode]);

  // Polling para verificar se a conexão foi estabelecida
  useEffect(() => {
    if (isOpen && instanceId && qrCode && !isConnected) {
      const checkConnection = async () => {
        try {
          console.log(`Verificando conexão para instância: ${instanceId}`);
          
          const response = await fetch(`https://webhook.abbadigital.com.br/webhook/pega-dados-da-conexao-matte?instanceId=${instanceId}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Resposta da verificação:', data);
            
            // Verificar se retornou os dados esperados do JSON
            if (data.profilename && data.contato) {
              console.log('Conexão estabelecida com sucesso!');
              setIsConnected(true);
              onConnectionSuccess(instanceId, data.contato, data);
              toast({
                title: "Conectado!",
                description: `WhatsApp conectado com sucesso para ${data.profilename}`,
              });
            }
          } else {
            console.log('Ainda não conectado, status:', response.status);
          }
        } catch (error) {
          console.log("Verificando conexão...", error);
        }
      };

      // Verificar a cada 3 segundos
      const interval = setInterval(checkConnection, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, instanceId, qrCode, isConnected, onConnectionSuccess, toast]);

  const generateQRCode = async () => {
    if (!instanceId) return;
    
    setIsLoading(true);
    setError("");
    setCountdown(60); // Reset para 60 segundos
    
    try {
      console.log("Gerando QR Code para instância:", instanceId);
      
      // TODO: Integrar com n8n webhook para obter QR Code
      // Por enquanto, simular QR Code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockQRCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      setQrCode(mockQRCode);
      
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      setError("Falha ao gerar QR Code. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Só permitir fechar se conectado ou se explicitamente cancelado
    if (isConnected || !qrCode) {
      setQrCode("");
      setIsConnected(false);
      setError("");
      setCountdown(60);
      onClose();
    }
  };

  const handleCancel = () => {
    // Forçar fechamento
    setQrCode("");
    setIsConnected(false);
    setError("");
    setCountdown(60);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Conectar WhatsApp</span>
            {isConnected && <CheckCircle className="h-5 w-5 text-success" />}
          </DialogTitle>
          <DialogDescription>
            {isConnected 
              ? "WhatsApp conectado com sucesso!"
              : "Escaneie o QR Code com seu WhatsApp para conectar"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isConnected ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-success mb-2">
                Conectado com sucesso!
              </h3>
              <p className="text-muted-foreground">
                Sua instância do WhatsApp está ativa e pronta para uso.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground">Gerando QR Code...</p>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-4">
                    <img 
                      src={qrCode} 
                      alt="QR Code WhatsApp" 
                      className="mx-auto h-48 w-48 border rounded-lg bg-white p-2"
                    />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">O QR Code expira em {countdown}s</p>
                      <p className="mt-1">
                        Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                      </p>
                      <p className="mt-2 text-xs">
                        Aguardando conexão... Verificando a cada 3 segundos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <p>Nenhum QR Code disponível</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={generateQRCode} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar QR Code
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {isConnected ? (
              <Button onClick={handleClose}>
                Fechar
              </Button>
            ) : (
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
