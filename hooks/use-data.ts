"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { City, Folder, Form, Question, SurveyResponse, Answer } from "@/types/database";

const supabase = createClient();

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cities")
      .select("*")
      .order("name");
    setCities(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name: string, state: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Buscar company_id do perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();
    const { error } = await supabase
      .from("cities")
      .insert({ name, state, created_by: user.id, company_id: profile?.company_id });
    if (!error) await fetch();
    return error;
  };

  return { cities, loading, refetch: fetch, create };
}

// ─── Folders ───
export function useFolders(cityId: string | null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!cityId) { setFolders([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("folders")
      .select("*")
      .eq("city_id", cityId)
      .order("name");
    setFolders(data ?? []);
    setLoading(false);
  }, [cityId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name: string, color: string = "#3B82F6") => {
    if (!cityId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("folders")
      .insert({ name, city_id: cityId, color, created_by: user.id });
    if (!error) await fetch();
    return error;
  };

  return { folders, loading, refetch: fetch, create };
}

// ─── Forms ───
export function useForms(folderId: string | null) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!folderId) { setForms([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("forms")
      .select("*")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });
    setForms(data ?? []);
    setLoading(false);
  }, [folderId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (title: string, description?: string) => {
    if (!folderId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("forms")
      .insert({ title, description: description ?? null, folder_id: folderId, created_by: user.id })
      .select()
      .single();
    if (!error) await fetch();
    return { data, error };
  };

  return { forms, loading, refetch: fetch, create };
}

// ─── Questions ───
export function useQuestions(formId: string | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!formId) { setQuestions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("form_id", formId)
      .order("order_index");
    setQuestions(data ?? []);
    setLoading(false);
  }, [formId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveAll = async (items: Omit<Question, "id" | "created_at">[]) => {
    if (!formId) return;
    // Delete existing then insert new
    await supabase.from("questions").delete().eq("form_id", formId);
    if (items.length > 0) {
      const { error } = await supabase.from("questions").insert(items);
      if (!error) await fetch();
      return error;
    }
  };

  return { questions, loading, refetch: fetch, saveAll };
}

// ─── Responses ───
export function useResponses(formId: string | null) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!formId) { setResponses([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("responses")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });
    setResponses(data ?? []);
    setLoading(false);
  }, [formId]);

  useEffect(() => { fetch(); }, [fetch]);

  const submit = async (
    answers: { question_id: string; answer_value: string }[],
    source: string = "digital"
  ) => {
    if (!formId) return;
    const { data: { user } } = await supabase.auth.getUser();

    const { data: resp, error: respError } = await supabase
      .from("responses")
      .insert({ form_id: formId, user_id: user?.id ?? null, source })
      .select()
      .single();

    if (respError || !resp) return respError;

    const rows = answers.map((a) => ({
      response_id: resp.id,
      question_id: a.question_id,
      answer_value: a.answer_value,
    }));

    const { error } = await supabase.from("answers").insert(rows);
    if (!error) await fetch();
    return error;
  };

  return { responses, loading, refetch: fetch, submit };
}

// ─── Stats for results ───
export async function fetchQuestionStats(formId: string) {
  const { data } = await supabase
    .from("answers")
    .select("question_id, answer_value")
    .in(
      "question_id",
      (
        await supabase.from("questions").select("id").eq("form_id", formId)
      ).data?.map((q) => q.id) ?? []
    );

  // Group by question_id → answer_value → count
  const map: Record<string, Record<string, number>> = {};
  (data ?? []).forEach(({ question_id, answer_value }) => {
    if (!map[question_id]) map[question_id] = {};
    const v = answer_value ?? "(vazio)";
    map[question_id][v] = (map[question_id][v] || 0) + 1;
  });

  return map;
}