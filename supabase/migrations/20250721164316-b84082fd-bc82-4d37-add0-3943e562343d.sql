-- Atualizar política de inserção para permitir que admins criem conexões para outros usuários
DROP POLICY IF EXISTS "Users can create their own conexoes" ON public.conexoes;

-- Recriar política de inserção permitindo que usuários criem suas próprias conexões
-- OU que admins criem conexões para qualquer usuário
CREATE POLICY "Users can create conexoes based on role" 
ON public.conexoes 
FOR INSERT 
WITH CHECK (
  -- Usuários normais podem criar apenas suas próprias conexões
  auth.uid() = user_id
  -- Admins podem criar conexões para qualquer usuário
  OR public.is_admin()
);