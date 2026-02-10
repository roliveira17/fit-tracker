"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  saveUserProfile,
  setOnboardingComplete,
  type UserProfile,
} from "@/lib/storage";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { createProfile } from "@/lib/supabase";

interface ProfileForm {
  name: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
}

interface FormErrors {
  name?: string;
  gender?: string;
  age?: string;
  height?: string;
  weight?: string;
}

function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "masculino") return Math.round(base + 5);
  if (gender === "feminino") return Math.round(base - 161);
  return Math.round(base - 78);
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    gender: "",
    age: "25",
    height: "",
    weight: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const liveBMR = useMemo(() => {
    const w = parseFloat(form.weight);
    const h = parseFloat(form.height);
    const a = parseInt(form.age);
    if (!w || !h || !a || !form.gender) return null;
    if (w <= 0 || h <= 0 || a <= 0) return null;
    return calculateBMR(w, h, a, form.gender);
  }, [form.weight, form.height, form.age, form.gender]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!form.gender) {
      newErrors.gender = "Selecione uma opção";
    }

    const age = parseInt(form.age);
    if (!form.age) {
      newErrors.age = "Idade é obrigatória";
    } else if (isNaN(age) || age < 13 || age > 100) {
      newErrors.age = "Idade deve ser entre 13 e 100 anos";
    }

    const height = parseFloat(form.height);
    if (!form.height) {
      newErrors.height = "Obrigatório";
    } else if (isNaN(height) || height <= 120) {
      newErrors.height = "Mínimo 120 cm";
    }

    const weight = parseFloat(form.weight);
    if (!form.weight) {
      newErrors.weight = "Obrigatório";
    } else if (isNaN(weight) || weight <= 35) {
      newErrors.weight = "Mínimo 35 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const age = parseInt(form.age);
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height);
    const bmr = calculateBMR(weight, height, age, form.gender);

    const currentYear = new Date().getFullYear();
    const birthDate = `${currentYear - age}-01-01`;

    const userProfile: UserProfile = {
      name: form.name.trim(),
      gender: form.gender as "masculino" | "feminino" | "outro",
      birthDate,
      height,
      weight,
      bmr,
      createdAt: new Date().toISOString(),
    };

    saveUserProfile(userProfile);
    setOnboardingComplete(true);

    if (user) {
      try {
        await createProfile({
          name: form.name.trim(),
          gender: form.gender as "masculino" | "feminino",
          birth_date: birthDate,
          height_cm: height,
          weight_kg: weight,
          tdee_multiplier: 1.2,
        });
      } catch (error) {
        console.error("Erro ao salvar perfil no Supabase:", error);
      }
    }

    router.push("/chat");
  };

  const incrementAge = () => {
    const current = parseInt(form.age) || 25;
    if (current < 100) updateField("age", String(current + 1));
  };

  const decrementAge = () => {
    const current = parseInt(form.age) || 25;
    if (current > 13) updateField("age", String(current - 1));
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] flex flex-col relative">
      {/* Back button */}
      <div className="px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2D3028] hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-36">
        {/* Title */}
        <div className="mt-4 mb-8 text-center">
          <h1 className="font-serif-display text-3xl text-[#2D3028] mb-2 tracking-tight">
            Configuração de Perfil
          </h1>
          <p className="text-sm text-[#787B73]">
            Vamos personalizar sua jornada.
          </p>
        </div>

        {/* BMR Card */}
        <div className="bg-[#D2F072]/30 border border-[#D2F072]/50 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D2F072] rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#4B6338] rounded-full blur-3xl opacity-10" />
          <div className="relative z-10">
            <span className="block text-xs uppercase tracking-widest font-bold text-[#4B6338] mb-2 opacity-80">
              Metabolismo Basal Estimado
            </span>
            <div className="flex items-baseline justify-center gap-1 text-[#4B6338]">
              <span className="font-serif-display text-5xl font-bold">
                {liveBMR ? liveBMR.toLocaleString("pt-BR") : "—"}
              </span>
              <span className="text-lg font-medium opacity-80">kcal</span>
            </div>
            {liveBMR && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-white/60 rounded-full">
                <span className="material-symbols-outlined text-[#4B6338] text-sm">
                  local_fire_department
                </span>
                <span className="text-xs font-semibold text-[#4B6338]">
                  Manutenção Diária
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-[#787B73] uppercase tracking-wider mb-2 ml-1">
              Nome
            </label>
            <div className={`bg-white rounded-xl shadow-sm p-1 flex items-center border ${errors.name ? "border-red-300" : "border-transparent"} focus-within:border-[#4B6338]/30 transition-all`}>
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ml-1 text-[#787B73]">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#2D3028] placeholder-gray-400 font-medium h-12 px-3"
              />
            </div>
            {errors.name && (
              <span className="text-xs font-medium text-red-500 mt-1 ml-1">{errors.name}</span>
            )}
          </div>

          {/* Sexo Biológico */}
          <div>
            <label className="block text-xs font-semibold text-[#787B73] uppercase tracking-wider mb-2 ml-1">
              Sexo Biológico
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateField("gender", "feminino")}
                className={`rounded-xl shadow-sm p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 border ${
                  form.gender === "feminino"
                    ? "bg-[#4B6338] text-white border-[#4B6338] shadow-lg"
                    : "bg-white text-[#2D3028] border-transparent hover:border-gray-200"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">female</span>
                <span className="font-medium text-sm">Feminino</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("gender", "masculino")}
                className={`rounded-xl shadow-sm p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 border ${
                  form.gender === "masculino"
                    ? "bg-[#4B6338] text-white border-[#4B6338] shadow-lg"
                    : "bg-white text-[#2D3028] border-transparent hover:border-gray-200"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">male</span>
                <span className="font-medium text-sm">Masculino</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => updateField("gender", "outro")}
              className={`mt-2 ml-1 text-xs transition-colors ${
                form.gender === "outro"
                  ? "text-[#4B6338] font-bold underline"
                  : "text-[#787B73] hover:text-[#4B6338]"
              }`}
            >
              Prefiro não informar
            </button>
            {errors.gender && (
              <span className="block text-xs font-medium text-red-500 mt-1 ml-1">{errors.gender}</span>
            )}
          </div>

          {/* Peso e Altura */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#787B73] uppercase tracking-wider mb-2 ml-1">
                Peso
              </label>
              <div className={`bg-white rounded-xl shadow-sm p-1 flex items-center border ${errors.weight ? "border-red-300" : "border-transparent"} focus-within:border-[#4B6338]/30 transition-all relative`}>
                <input
                  type="number"
                  placeholder="0"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#2D3028] font-bold text-xl h-14 pl-4 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 text-sm font-medium text-[#787B73]">kg</span>
              </div>
              {errors.weight && (
                <span className="text-xs font-medium text-red-500 mt-1 ml-1">{errors.weight}</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#787B73] uppercase tracking-wider mb-2 ml-1">
                Altura
              </label>
              <div className={`bg-white rounded-xl shadow-sm p-1 flex items-center border ${errors.height ? "border-red-300" : "border-transparent"} focus-within:border-[#4B6338]/30 transition-all relative`}>
                <input
                  type="number"
                  placeholder="0"
                  value={form.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[#2D3028] font-bold text-xl h-14 pl-4 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 text-sm font-medium text-[#787B73]">cm</span>
              </div>
              {errors.height && (
                <span className="text-xs font-medium text-red-500 mt-1 ml-1">{errors.height}</span>
              )}
            </div>
          </div>

          {/* Idade */}
          <div>
            <label className="block text-xs font-semibold text-[#787B73] uppercase tracking-wider mb-2 ml-1">
              Idade
            </label>
            <div className={`bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between border ${errors.age ? "border-red-300" : "border-transparent"}`}>
              <button
                type="button"
                onClick={decrementAge}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#4B6338] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <div className="text-center">
                <span className="text-xl font-bold text-[#2D3028]">{form.age || "25"}</span>
                <span className="text-xs text-[#787B73] ml-1">anos</span>
              </div>
              <button
                type="button"
                onClick={incrementAge}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#4B6338] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
            {errors.age && (
              <span className="text-xs font-medium text-red-500 mt-1 ml-1">{errors.age}</span>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#F9F9F6] via-[#F9F9F6] to-transparent pt-12 pb-8 px-6 z-30">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#4B6338] hover:bg-[#4B6338]/90 disabled:opacity-50 text-white font-medium text-lg py-4 rounded-2xl shadow-xl shadow-[#4B6338]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span>{isSubmitting ? "Salvando..." : "Começar Jornada"}</span>
          {!isSubmitting && (
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
