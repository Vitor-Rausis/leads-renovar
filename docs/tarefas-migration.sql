-- ============================================================
-- TAREFAS (Agenda): followups, lembretes, atividades
-- Cada tarefa pode estar vinculada a um lead (opcional) e tem
-- um responsavel (usuario que criou ou foi designado).
-- ============================================================

CREATE TYPE tarefa_status AS ENUM ('pendente', 'concluida', 'cancelada');
CREATE TYPE tarefa_prioridade AS ENUM ('baixa', 'media', 'alta');

CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES users(id) ON DELETE SET NULL,
  data_vencimento TIMESTAMPTZ NOT NULL,
  prioridade tarefa_prioridade DEFAULT 'media',
  status tarefa_status DEFAULT 'pendente',
  concluida_em TIMESTAMPTZ,
  criado_por UUID REFERENCES users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_vencimento ON tarefas(data_vencimento);
CREATE INDEX idx_tarefas_lead ON tarefas(lead_id);
CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);

CREATE TRIGGER trg_tarefas_atualizar_timestamp
  BEFORE UPDATE ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION fn_atualizar_timestamp();

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON tarefas FOR ALL USING (TRUE) WITH CHECK (TRUE);
