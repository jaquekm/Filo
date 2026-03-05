-- ============================================================
-- PesquisaHub — Schema SQL Completo para Supabase
-- Sistema de Criação e Coleta de Pesquisas por Cidades
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'pesquisador', 'parceiro');

CREATE TYPE question_type AS ENUM (
  'texto_curto',
  'numero',
  'multipla_escolha',
  'checkbox',
  'selecao_unica'
);

-- ============================================================
-- 2. TABELA DE PERFIS (extends Supabase Auth)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'parceiro',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 3. CIDADES
-- ============================================================

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cities_state ON cities(state);
CREATE INDEX idx_cities_name ON cities(name);

-- ============================================================
-- 4. PASTAS (organização dentro de cada cidade)
-- ============================================================

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_folders_city ON folders(city_id);

-- ============================================================
-- 5. FORMULÁRIOS / PESQUISAS
-- ============================================================

CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forms_folder ON forms(folder_id);
CREATE INDEX idx_forms_active ON forms(is_active);

-- ============================================================
-- 6. PERGUNTAS
-- ============================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  options_json JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_form ON questions(form_id);
CREATE INDEX idx_questions_order ON questions(form_id, order_index);

-- ============================================================
-- 7. RESPOSTAS (cabeçalho — uma submissão)
-- ============================================================

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'digital', -- 'digital' | 'scan' | 'manual'
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_form ON responses(form_id);
CREATE INDEX idx_responses_user ON responses(user_id);
CREATE INDEX idx_responses_date ON responses(created_at DESC);

-- ============================================================
-- 8. RESPOSTAS INDIVIDUAIS (cada pergunta respondida)
-- ============================================================

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_answers_response ON answers(response_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Índice composto para queries de agregação
CREATE INDEX idx_answers_question_value ON answers(question_id, answer_value);

-- ============================================================
-- 9. LOGS DE SCAN OCR
-- ============================================================

CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ocr_raw_text TEXT,
  confidence_score REAL,
  scanned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scan_logs_form ON scan_logs(form_id);

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê próprio perfil; admin vê todos
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Cities: todos podem ver; admin pode criar/editar
CREATE POLICY "cities_select_all" ON cities
  FOR SELECT USING (true);

CREATE POLICY "cities_insert_admin" ON cities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "cities_update_admin" ON cities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Folders: todos podem ver; admin e pesquisador podem criar
CREATE POLICY "folders_select_all" ON folders
  FOR SELECT USING (true);

CREATE POLICY "folders_insert_staff" ON folders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pesquisador'))
  );

-- Forms: todos podem ver ativos; staff pode criar
CREATE POLICY "forms_select_all" ON forms
  FOR SELECT USING (true);

CREATE POLICY "forms_insert_staff" ON forms
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pesquisador'))
  );

CREATE POLICY "forms_update_owner" ON forms
  FOR UPDATE USING (created_by = auth.uid());

-- Questions: segue permissão do form
CREATE POLICY "questions_select_all" ON questions
  FOR SELECT USING (true);

CREATE POLICY "questions_insert_staff" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pesquisador'))
  );

-- Responses: qualquer autenticado pode inserir; staff vê todas
CREATE POLICY "responses_insert_auth" ON responses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "responses_select_staff" ON responses
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pesquisador'))
  );

-- Answers: segue permissão da response
CREATE POLICY "answers_insert_auth" ON answers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "answers_select_staff" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = answers.response_id
      AND (
        r.user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pesquisador'))
      )
    )
  );

-- Scan logs: staff only
CREATE POLICY "scan_logs_all_staff" ON scan_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pesquisador'))
  );

-- ============================================================
-- 11. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cities_updated
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_folders_updated
  BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_forms_updated
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parceiro')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 12. VIEWS PARA DASHBOARD
-- ============================================================

-- Contagem de respostas por formulário
CREATE OR REPLACE VIEW v_form_response_counts AS
SELECT
  f.id AS form_id,
  f.title,
  fo.name AS folder_name,
  c.name AS city_name,
  COUNT(r.id) AS total_responses,
  COUNT(CASE WHEN r.source = 'scan' THEN 1 END) AS scan_responses,
  COUNT(CASE WHEN r.source = 'digital' THEN 1 END) AS digital_responses,
  MAX(r.created_at) AS last_response_at
FROM forms f
JOIN folders fo ON f.folder_id = fo.id
JOIN cities c ON fo.city_id = c.id
LEFT JOIN responses r ON r.form_id = f.id
GROUP BY f.id, f.title, fo.name, c.name;

-- Agregação de respostas por pergunta (para gráficos)
CREATE OR REPLACE VIEW v_question_stats AS
SELECT
  q.id AS question_id,
  q.form_id,
  q.question_text,
  q.question_type,
  a.answer_value,
  COUNT(*) AS count
FROM questions q
JOIN answers a ON a.question_id = q.id
GROUP BY q.id, q.form_id, q.question_text, q.question_type, a.answer_value
ORDER BY q.order_index, count DESC;

-- ============================================================
-- 13. DADOS DE EXEMPLO (seed)
-- ============================================================

-- Nota: Em produção, cidades e dados seriam inseridos via app.
-- Este seed serve para testes locais.

-- INSERT INTO cities (name, state, created_by) VALUES
--   ('Curitiba', 'PR', '<admin-uuid>'),
--   ('São Paulo', 'SP', '<admin-uuid>'),
--   ('Florianópolis', 'SC', '<admin-uuid>');
