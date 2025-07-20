
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  user_id: string;
  display_name: string;
  is_active: boolean;
}

interface ImportInstanceModalProps {
  users: User[];
  onSuccess: () => void;
}

const ImportInstanceModal = ({ users, onSuccess }: ImportInstanceModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const activeUsers = users.filter(user => user.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instanceName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome da instância.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um usuário.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Importando instância:", instanceName, "para usuário:", selectedUserId);
      
      // Fazer requisição para o webhook
      const response = await fetch('https://webhook.abbadigital.com.br/webhook/cria-instancia-matte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionName: instanceName.trim()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar instância');
      }

      console.log("Resposta do webhook:", data);

      // Salvar instância no banco de dados
      const { error: insertError } = await supabase
        .from('conexoes')
        .insert({
          user_id: selectedUserId,
          name: instanceName.trim(),
          type: 'whatsapp',
          status: 'inactive',
          channel: 'whatsapp',
          configuration: {
            connection_status: 'disconnected',
            evolution_api_key: null,
            evolution_instance_name: instanceName.trim(),
            instance_id: data.instanceId || null,
            qr_code: data.base64 || null,
            qr_code_data: data.code || null
          }
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Instância importada com sucesso!",
      });

      // Resetar formulário e fechar modal
      setInstanceName("");
      setSelectedUserId("");
      setIsOpen(false);
      onSuccess();

    } catch (error) {
      console.error('Erro ao importar instância:', error);
      toast({
        title: "Erro",
        description: "Falha ao importar instância. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Importar Instância
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Instância</DialogTitle>
          <DialogDescription>
            Crie uma nova instância para um usuário específico informando apenas o nome.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              placeholder="Ex: MinhaInstancia"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userId">Usuário</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map((user) => (
                  <SelectItem key={user.id} value={user.user_id}>
                    {user.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Importar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportInstanceModal;
