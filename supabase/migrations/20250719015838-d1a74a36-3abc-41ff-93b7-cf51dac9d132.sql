-- Renomear a tabela agents para conexoes
ALTER TABLE public.agents RENAME TO conexoes;

-- Renomear as sequences e constraints relacionadas
ALTER SEQUENCE IF EXISTS agents_id_seq RENAME TO conexoes_id_seq;

-- Renomear as políticas RLS
ALTER POLICY "Users can view their own agents" ON public.conexoes RENAME TO "Users can view their own conexoes";
ALTER POLICY "Users can create their own agents" ON public.conexoes RENAME TO "Users can create their own conexoes";
ALTER POLICY "Users can update their own agents" ON public.conexoes RENAME TO "Users can update their own conexoes";
ALTER POLICY "Users can delete their own agents" ON public.conexoes RENAME TO "Users can delete their own conexoes";

-- Renomear os triggers
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.conexoes;
DROP TRIGGER IF EXISTS create_agent_metrics_trigger ON public.conexoes;

CREATE TRIGGER update_conexoes_updated_at 
BEFORE UPDATE ON public.conexoes 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER create_conexoes_metrics_trigger
AFTER INSERT ON public.conexoes 
FOR EACH ROW
EXECUTE FUNCTION create_agent_metrics();