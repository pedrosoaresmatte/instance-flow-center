import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Shield, 
  Users, 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserX,
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  instancesCount: number;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Simulação de dados - substituir pela integração real com Supabase
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      // Simulação de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados de exemplo
      const mockUsers: User[] = [
        {
          id: "1",
          name: "João Silva",
          email: "joao@empresa.com",
          isActive: true,
          createdAt: "2024-01-15T10:30:00Z",
          instancesCount: 2
        },
        {
          id: "2",
          name: "Maria Santos",
          email: "maria@startup.com",
          isActive: false,
          createdAt: "2024-01-18T14:25:00Z",
          instancesCount: 0
        },
        {
          id: "3",
          name: "Pedro Oliveira",
          email: "pedro@agencia.com",
          isActive: true,
          createdAt: "2024-01-20T09:15:00Z",
          instancesCount: 1
        }
      ];
      
      setUsers(mockUsers);
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  const handleActivateUser = async (userId: string) => {
    try {
      // TODO: Integrar com Supabase para ativar usuário
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, isActive: true }
            : user
        )
      );
      
      toast({
        title: "Usuário ativado",
        description: "O usuário agora pode fazer login.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao ativar usuário.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      // TODO: Integrar com Supabase para desativar usuário
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, isActive: false }
            : user
        )
      );
      
      toast({
        title: "Usuário desativado",
        description: "O acesso do usuário foi suspenso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao desativar usuário.",
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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeUsersCount = users.filter(user => user.isActive).length;
  const pendingUsersCount = users.filter(user => !user.isActive).length;
  const totalInstances = users.reduce((sum, user) => sum + user.instancesCount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados administrativos...</p>
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
            <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gerenciar usuários e sistema</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeUsersCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Ativação</CardTitle>
              <UserX className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingUsersCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instâncias</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInstances}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Ative ou desative o acesso dos usuários ao sistema
                </CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Instâncias</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-warning text-warning-foreground">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.instancesCount}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleDeactivateUser(user.id)}
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleActivateUser(user.id)}
                              className="text-success"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;