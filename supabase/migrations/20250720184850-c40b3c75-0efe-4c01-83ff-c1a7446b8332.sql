-- Criar função para configurar usuário admin
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS TEXT AS $$
DECLARE
  admin_user_id UUID;
  conexoes_count INTEGER;
BEGIN
  -- Pegar o ID do usuário atual (quem executar esta função)
  admin_user_id := auth.uid();
  
  IF admin_user_id IS NULL THEN
    RETURN 'Erro: Usuário não autenticado. Faça login primeiro.';
  END IF;
  
  -- Verificar se já existe perfil para este usuário
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = admin_user_id) THEN
    -- Atualizar perfil existente para admin
    UPDATE public.profiles 
    SET 
      role = 'admin',
      is_active = true,
      display_name = COALESCE(display_name, 'Administrador Sistema'),
      updated_at = now()
    WHERE user_id = admin_user_id;
    
    RAISE NOTICE 'Perfil existente atualizado para admin';
  ELSE
    -- Criar novo perfil admin
    INSERT INTO public.profiles (user_id, display_name, role, is_active)
    VALUES (admin_user_id, 'Administrador Sistema', 'admin', true);
    
    RAISE NOTICE 'Novo perfil admin criado';
  END IF;
  
  -- Contar conexões existentes sem user_id
  SELECT COUNT(*) INTO conexoes_count
  FROM public.conexoes 
  WHERE user_id IS NULL OR user_id != admin_user_id;
  
  -- Atualizar todas as conexões para pertencerem ao admin
  UPDATE public.conexoes 
  SET user_id = admin_user_id, updated_at = now()
  WHERE user_id IS NULL OR user_id != admin_user_id;
  
  RETURN FORMAT('✅ Sucesso! Usuário %s configurado como admin. %s conexões associadas ao seu usuário.', 
                admin_user_id, conexoes_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;