-- Atualizar política de visualização das conexões para permitir que admins vejam todas
DROP POLICY IF EXISTS "Users can view their own conexoes" ON public.conexoes;

-- Recriar política permitindo que admins vejam todas as conexões
CREATE POLICY "Users can view conexoes based on role" 
ON public.conexoes 
FOR SELECT 
USING (
  -- Admins podem ver todas as conexões
  public.is_admin() 
  -- Usuários normais podem ver apenas suas próprias conexões
  OR auth.uid() = user_id
);