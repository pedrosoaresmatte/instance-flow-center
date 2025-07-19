-- Criar os enums necessários
CREATE TYPE public.agent_type AS ENUM ('whatsapp', 'telegram', 'instagram');
CREATE TYPE public.agent_status AS ENUM ('active', 'inactive', 'connecting', 'disconnected', 'error');
CREATE TYPE public.agent_channel AS ENUM ('whatsapp', 'telegram', 'instagram', 'facebook', 'email');

-- Criar a tabela agents
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type public.agent_type NOT NULL,
  status public.agent_status NOT NULL DEFAULT 'inactive'::agent_status,
  description text NULL,
  configuration jsonb NULL DEFAULT '{"connection_status": "disconnected", "evolution_api_key": null, "evolution_instance_name": null}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  channel public.agent_channel NULL,
  whatsapp_profile_name text NULL,
  whatsapp_contact text NULL,
  whatsapp_profile_picture_url text NULL,
  whatsapp_profile_picture_data text NULL,
  whatsapp_connected_at timestamp with time zone NULL,
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Habilitar RLS na tabela
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own agents" 
ON public.agents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents" 
ON public.agents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" 
ON public.agents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" 
ON public.agents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar função placeholder para métricas (pode ser implementada depois)
CREATE OR REPLACE FUNCTION public.create_agent_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Placeholder para criação de métricas
  -- Pode ser implementado futuramente conforme necessário
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
CREATE TRIGGER create_agent_metrics_trigger
AFTER INSERT ON public.agents 
FOR EACH ROW
EXECUTE FUNCTION create_agent_metrics();

CREATE TRIGGER update_agents_updated_at 
BEFORE UPDATE ON public.agents 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();