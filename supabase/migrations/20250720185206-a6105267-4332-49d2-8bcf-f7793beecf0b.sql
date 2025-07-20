-- Configurar usuário específico como admin e associar conexões
DO $$
DECLARE
  admin_user_id UUID := '2dcdb169-3cd9-4023-9c65-72a7acee6ff8';
  conexoes_count INTEGER;
  profile_exists BOOLEAN;
BEGIN
  -- Verificar se já existe perfil para este usuário
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = admin_user_id) INTO profile_exists;
  
  IF profile_exists THEN
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
  
  -- Contar conexões existentes que não pertencem a este usuário
  SELECT COUNT(*) INTO conexoes_count
  FROM public.conexoes 
  WHERE user_id IS NULL OR user_id != admin_user_id;
  
  -- Atualizar todas as conexões para pertencerem ao admin
  UPDATE public.conexoes 
  SET user_id = admin_user_id, updated_at = now()
  WHERE user_id IS NULL OR user_id != admin_user_id;
  
  RAISE NOTICE 'Usuário % configurado como admin. % conexões associadas.', admin_user_id, conexoes_count;
END $$;