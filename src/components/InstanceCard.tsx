
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  QrCode, 
  Power, 
  Trash2, 
  Smartphone,
  Wifi,
  WifiOff,
  Clock,
  MoreVertical
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WhatsAppInstance {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "qr_code" | "loading";
  phone?: string;
  createdAt: string;
  lastActivity?: string;
  whatsapp_profile_name?: string;
  whatsapp_profile_picture_url?: string;
  whatsapp_profile_picture_data?: string;
}

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}

const InstanceCard = ({ instance, onConnect, onDisconnect, onDelete }: InstanceCardProps) => {
  const getStatusBadge = () => {
    switch (instance.status) {
      case "connected":
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            <Wifi className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <WifiOff className="h-3 w-3 mr-1" />
            Desconectado
          </Badge>
        );
      case "qr_code":
        return (
          <Badge variant="default" className="bg-warning text-warning-foreground">
            <QrCode className="h-3 w-3 mr-1" />
            QR Code
          </Badge>
        );
      case "loading":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Carregando...
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMainAction = () => {
    switch (instance.status) {
      case "disconnected":
      case "qr_code":
        return (
          <Button onClick={onConnect} className="w-full">
            <QrCode className="h-4 w-4 mr-2" />
            Conectar
          </Button>
        );
      case "connected":
        return (
          <Button variant="outline" onClick={onDisconnect} className="w-full">
            <Power className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        );
      case "loading":
        return (
          <Button disabled className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            Carregando...
          </Button>
        );
      default:
        return null;
    }
  };

  // Função para obter as iniciais do nome para o fallback do avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar com foto do perfil ou fallback */}
            <Avatar className="h-10 w-10">
              {instance.whatsapp_profile_picture_url && (
                <AvatarImage 
                  src={instance.whatsapp_profile_picture_url} 
                  alt={instance.whatsapp_profile_name || instance.name}
                />
              )}
              <AvatarFallback className="bg-secondary/10 text-secondary">
                {instance.status === "connected" && instance.whatsapp_profile_name
                  ? getInitials(instance.whatsapp_profile_name)
                  : getInitials(instance.name)
                }
              </AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className="text-lg">
                {instance.whatsapp_profile_name || instance.name}
              </CardTitle>
              <CardDescription>
                {instance.phone || "Não conectado"}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Criado em:</span>
            <span>{formatDate(instance.createdAt)}</span>
          </div>
          
          {instance.lastActivity && (
            <div className="flex justify-between">
              <span>Última atividade:</span>
              <span>{formatDate(instance.lastActivity)}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2">
          {getMainAction()}
        </div>
      </CardContent>
    </Card>
  );
};

export default InstanceCard;
