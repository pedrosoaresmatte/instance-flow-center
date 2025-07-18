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
  onConnectionSuccess: (instanceId: string, phone: string) => void;
}

const QRCodeModal = ({ isOpen, onClose, instanceId, connection, onConnectionSuccess }: QRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && instanceId) {
      // Se a conexão já tem QR code, usar ele
      if (connection?.qrCode) {
        setQrCode(connection.qrCode);
        setIsLoading(false);
        setCountdown(30);
      } else {
        generateQRCode();
      }
    }
  }, [isOpen, instanceId, connection]);

  useEffect(() => {
    if (isOpen && !isConnected && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      generateQRCode();
    }
  }, [isOpen, countdown, isConnected]);

  const generateQRCode = async () => {
    if (!instanceId) return;
    
    setIsLoading(true);
    setError("");
    setCountdown(30);
    
    try {
      // TODO: Integrar com n8n webhook para obter QR Code
      console.log("Gerando QR Code para instância:", instanceId);
      
      // Simulação de QR Code (base64)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockQRCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      setQrCode(mockQRCode);
      
      // Simular conexão após alguns segundos
      setTimeout(() => {
        if (!isConnected) {
          setIsConnected(true);
          onConnectionSuccess(instanceId, "+55 11 99999-8888");
          toast({
            title: "Conectado!",
            description: "WhatsApp conectado com sucesso.",
          });
        }
      }, 8000);
      
    } catch (error) {
      setError("Falha ao gerar QR Code. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQrCode("");
    setIsConnected(false);
    setError("");
    setCountdown(30);
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
                      <p>O QR Code expira em {countdown}s</p>
                      <p className="mt-1">
                        Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
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
            <Button variant="outline" onClick={handleClose}>
              {isConnected ? "Fechar" : "Cancelar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;