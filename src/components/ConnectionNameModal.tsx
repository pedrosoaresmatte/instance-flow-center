import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ConnectionNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (connectionName: string) => void;
  isLoading?: boolean;
}

const ConnectionNameModal = ({ isOpen, onClose, onSubmit, isLoading = false }: ConnectionNameModalProps) => {
  const [connectionName, setConnectionName] = useState("");
  const [error, setError] = useState("");

  const validateConnectionName = (name: string) => {
    if (!name.trim()) {
      return "Nome da conexão é obrigatório";
    }
    if (name.includes(" ")) {
      return "O nome da conexão não pode conter espaços";
    }
    if (name.length < 3) {
      return "Nome deve ter pelo menos 3 caracteres";
    }
    if (name.length > 30) {
      return "Nome deve ter no máximo 30 caracteres";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return "Apenas letras, números, underscore (_) e hífen (-) são permitidos";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateConnectionName(connectionName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    onSubmit(connectionName.trim());
  };

  const handleInputChange = (value: string) => {
    setConnectionName(value);
    if (error) {
      const validationError = validateConnectionName(value);
      setError(validationError);
    }
  };

  const handleClose = () => {
    setConnectionName("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
          <DialogDescription>
            Digite um nome para identificar esta conexão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connection-name">Nome da Conexão</Label>
            <Input
              id="connection-name"
              type="text"
              value={connectionName}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="exemplo: vendas-whatsapp"
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Apenas letras, números, underscore (_) e hífen (-). Sem espaços.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !!validateConnectionName(connectionName)}
            >
              {isLoading ? "Criando..." : "Continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionNameModal;