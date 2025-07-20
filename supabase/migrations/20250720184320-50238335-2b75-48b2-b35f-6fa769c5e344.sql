-- Inserir um usuário admin padrão (caso não exista)
-- Primeiro, vamos verificar se já existe algum admin
DO $$
BEGIN
  -- Se não houver nenhum admin, criar um perfil admin padrão
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    -- Criar um usuário de exemplo para teste (somente se não houver admins)
    INSERT INTO public.profiles (
      user_id, 
      display_name, 
      role, 
      is_active
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid, -- UUID temporário
      'Admin Sistema',
      'admin',
      true
    );
  END IF;
END $$;