export type UserRole = "admin" | "pesquisador" | "parceiro";

export type QuestionType =
  | "texto_curto"
  | "numero"
  | "multipla_escolha"
  | "checkbox"
  | "selecao_unica";

export type ResponseSource = "digital" | "scan" | "manual";

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  company_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  company_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  city_id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  folder_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  form_id: string;
  question_text: string;
  question_type: QuestionType;
  options_json: string[];
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  form_id: string;
  user_id: string | null;
  source: ResponseSource;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  answer_value: string | null;
  created_at: string;
}

export interface ScanLog {
  id: string;
  response_id: string | null;
  form_id: string;
  image_url: string;
  ocr_raw_text: string | null;
  confidence_score: number | null;
  scanned_by: string;
  created_at: string;
}

export interface ProfileWithCompany extends Profile {
  company?: Company;
}

export interface CityWithStats extends City {
  folder_count: number;
  response_count: number;
}

export interface FolderWithStats extends Folder {
  form_count: number;
}

export interface FormWithStats extends Form {
  response_count: number;
  folder_name?: string;
  city_name?: string;
}

export interface Database {
  public: {
    Tables: {
      companies: { Row: Company };
      profiles: { Row: Profile };
      cities: { Row: City };
      folders: { Row: Folder };
      forms: { Row: Form };
      questions: { Row: Question };
      responses: { Row: SurveyResponse };
      answers: { Row: Answer };
      scan_logs: { Row: ScanLog };
    };
  };
}
