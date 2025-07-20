
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
  isNewConnection?: boolean; // Indica se é uma nova conexão (já tem QR code) ou reconexão
}

const QRCodeModal = ({ isOpen, onClose, instanceId, connection, onConnectionSuccess, isNewConnection = false }: QRCodeModalProps) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && instanceId) {
      if (isNewConnection && connection?.qrCode) {
        // Nova conexão: usar QR code já recebido do POST
        console.log('Nova conexão: usando QR code recebido do POST');
        setQrCode(connection.qrCode);
        setCountdown(60);
        setIsExpired(false);
        setIsConnected(false);
      } else {
        // Reconexão: gerar novo QR code
        console.log('Reconexão: gerando novo QR code...');
        generateQRCode();
      }
    }
  }, [isOpen, instanceId, isNewConnection, connection?.qrCode]);

  // Contador regressivo
  useEffect(() => {
    if (isOpen && !isConnected && countdown > 0 && qrCode && !isExpired) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isConnected) {
      // QR Code expirou
      setIsExpired(true);
      setIsPolling(false);
      setError("QR Code expirado. Gere um novo para continuar.");
    }
  }, [isOpen, countdown, isConnected, qrCode, isExpired]);

  // Polling para verificar se a conexão foi estabelecida (a cada 3 segundos)
  useEffect(() => {
    if (isOpen && instanceId && qrCode && !isConnected && !isExpired && countdown > 0 && connection?.name) {
      setIsPolling(true);
      
      const checkConnection = async () => {
        try {
          console.log(`Verificando conexão para instância: ${connection.name}`);
          
          // Incluir o nome da instância como parâmetro na requisição
          const response = await fetch(`https://webhook.abbadigital.com.br/webhook/pega-dados-da-conexao-matte?instanceName=${encodeURIComponent(connection.name)}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Resposta da verificação:', data);
            
            // Validação mais rigorosa - verificar se retornou os dados válidos do perfil conectado
            if (data && data.profilename && data.contato && data.fotodoperfil) {
              console.log(`Conexão estabelecida com sucesso para a instância: ${connection.name}!`);
              
              // Parar o polling imediatamente
              setIsPolling(false);
              setIsConnected(true);
              
              // Processar a foto do perfil
              let profileImageBase64 = null;
              if (data.fotodoperfil) {
                try {
                  // Baixar e converter a imagem para base64
                  const imageResponse = await fetch(data.fotodoperfil);
                  if (imageResponse.ok) {
                    const imageBlob = await imageResponse.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      profileImageBase64 = reader.result as string;
                    };
                    reader.readAsDataURL(imageBlob);
                  }
                } catch (imageError) {
                  console.log('Erro ao processar imagem do perfil:', imageError);
                }
              }
              
              // Preparar dados do perfil para salvar
              const profileData = {
                profilename: data.profilename,
                contato: data.contato,
                fotodoperfil: data.fotodoperfil,
                profileImageBase64: profileImageBase64
              };
              
              onConnectionSuccess(instanceId, data.contato, profileData);
              
              toast({
                title: "WhatsApp Conectado!",
                description: `Conectado com sucesso para ${data.profilename}`,
              });
              
              // Fechar o modal automaticamente após 2 segundos
              setTimeout(() => {
                handleCancel();
              }, 2000);
            } else {
              console.log(`Instância ${connection.name} ainda não conectada - dados incompletos ou vazios`);
            }
          } else if (response.status === 404) {
            console.log(`Instância ${connection.name} não encontrada ou não conectada`);
          } else {
            console.log(`Erro na verificação da instância ${connection.name}, status:`, response.status);
          }
        } catch (error) {
          console.log(`Erro ao verificar conexão para ${connection.name}:`, error);
        }
      };

      // Verificar imediatamente e depois a cada 3 segundos
      checkConnection();
      const interval = setInterval(checkConnection, 3000);
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    } else {
      setIsPolling(false);
    }
  }, [isOpen, instanceId, qrCode, isConnected, isExpired, countdown, connection?.name, onConnectionSuccess, toast]);

  const generateQRCode = async () => {
    if (!instanceId || !connection?.name) return;
    
    setIsLoading(true);
    setError("");
    setCountdown(60);
    setIsExpired(false);
    setIsConnected(false);
    
    try {
      console.log("Fazendo nova requisição GET para obter QR Code atualizado da instância:", connection.name);
      
      // Fazer nova requisição GET para obter QR code atualizado
      const response = await fetch(`https://webhook.abbadigital.com.br/webhook/conecta-matte?connectionName=${encodeURIComponent(connection.name)}`);
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Nova resposta da requisição GET:', data);
      
      // Usar o QR code da resposta
      if (data.qrCode) {
        console.log('QR Code atualizado obtido com sucesso');
        setQrCode(data.qrCode);
      } else {
        throw new Error('QR Code não encontrado na resposta');
      }
      
    } catch (error) {
      console.error('Erro ao obter QR Code atualizado:', error);
      setError("Falha ao obter QR Code atualizado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Só permitir fechar se conectado
    if (isConnected) {
      resetModal();
      onClose();
    }
    // Se não conectado e tem QR code, não fecha (usuário deve usar cancelar)
  };

  const handleCancel = () => {
    // Forçar fechamento
    resetModal();
    onClose();
  };

  const resetModal = () => {
    setQrCode("");
    setIsConnected(false);
    setIsPolling(false);
    setIsExpired(false);
    setError("");
    setCountdown(60);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>  {/* Prevenir fechamento automático */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Conectar WhatsApp</span>
            {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
          </DialogTitle>
          <DialogDescription>
            {isConnected 
              ? "WhatsApp conectado com sucesso!"
              : isExpired
              ? "QR Code expirado. Gere um novo para continuar."
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
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">
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
                ) : qrCode && !isExpired ? (
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
                      {isPolling && (
                        <div className="mt-3 flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs text-blue-600">
                            Aguardando escaneamento... Verificando conexão para "{connection?.name}" a cada 3 segundos.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isExpired ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-orange-600 mb-2">
                      QR Code Expirado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      O QR Code expirou após 60 segundos. Gere um novo para continuar.
                    </p>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <p>Nenhum QR Code disponível</p>
                  </div>
                )}
              </div>

              {!isExpired && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={generateQRCode} 
                    disabled={isLoading || isPolling}
                    className="flex-1"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar QR Code
                  </Button>
                </div>
              )}

              {isExpired && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={generateQRCode} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Gerar Novo QR Code
                  </Button>
                </div>
              )}
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
