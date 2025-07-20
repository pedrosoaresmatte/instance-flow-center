-- Atualizar a função handle_new_user para criar usuários desativados por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'user',
    false -- Usuários criados desativados por padrão
  );
  RETURN NEW;
END;
$function$;

-- Adicionar política para permitir que admins deletem perfis
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin());