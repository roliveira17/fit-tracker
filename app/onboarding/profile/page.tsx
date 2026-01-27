"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  saveUserProfile,
  setOnboardingComplete,
  type UserProfile,
} from "@/lib/storage";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { createProfile } from "@/lib/supabase";

/**
 * Tipos para o formulário de perfil
 */
interface ProfileForm {
  name: string;
  gender: string;
  birthDate: string;
  height: string;
  weight: string;
}

interface FormErrors {
  name?: string;
  gender?: string;
  birthDate?: string;
  height?: string;
  weight?: string;
}

/**
 * Calcula a idade a partir da data de nascimento
 */
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calcula o BMR usando a fórmula Mifflin-St Jeor
 * Homem:  BMR = 10 × peso(kg) + 6.25 × altura(cm) − 5 × idade + 5
 * Mulher: BMR = 10 × peso(kg) + 6.25 × altura(cm) − 5 × idade − 161
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "masculino") {
    return Math.round(base + 5);
  } else if (gender === "feminino") {
    return Math.round(base - 161);
  }
  // Para "prefiro não informar", usa média entre os dois
  return Math.round(base - 78);
}

/**
 * Tela de Perfil Básico
 * Coleta dados para cálculo de BMR e personalização
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    gender: "",
    birthDate: "",
    height: "",
    weight: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Atualiza um campo do formulário
   */
  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Valida todos os campos do formulário
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome: obrigatório
    if (!form.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    // Gênero: obrigatório
    if (!form.gender) {
      newErrors.gender = "Selecione uma opção";
    }

    // Data de nascimento: obrigatório e idade mínima 13 anos
    if (!form.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else {
      const age = calculateAge(form.birthDate);
      if (age < 13) {
        newErrors.birthDate = "Idade mínima é 13 anos";
      }
    }

    // Altura: obrigatório e > 120 cm
    const height = parseFloat(form.height);
    if (!form.height) {
      newErrors.height = "Altura é obrigatória";
    } else if (isNaN(height) || height <= 120) {
      newErrors.height = "Altura deve ser maior que 120 cm";
    }

    // Peso: obrigatório e > 35 kg
    const weight = parseFloat(form.weight);
    if (!form.weight) {
      newErrors.weight = "Peso é obrigatório";
    } else if (isNaN(weight) || weight <= 35) {
      newErrors.weight = "Peso deve ser maior que 35 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submete o formulário
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Calcula BMR
    const age = calculateAge(form.birthDate);
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height);
    const bmr = calculateBMR(weight, height, age, form.gender);

    // Cria o perfil do usuário
    const userProfile: UserProfile = {
      name: form.name.trim(),
      gender: form.gender as "masculino" | "feminino" | "outro",
      birthDate: form.birthDate,
      height,
      weight,
      bmr,
      createdAt: new Date().toISOString(),
    };

    // Salva no localStorage (sempre, para fallback offline)
    saveUserProfile(userProfile);
    setOnboardingComplete(true);

    // Se usuário está logado, salva também no Supabase
    if (user) {
      try {
        await createProfile({
          name: form.name.trim(),
          gender: form.gender as "masculino" | "feminino",
          birth_date: form.birthDate,
          height_cm: height,
          weight_kg: weight,
          tdee_multiplier: 1.2, // Sedentário como padrão inicial
        });
        console.log("Perfil salvo no Supabase");
      } catch (error) {
        console.error("Erro ao salvar perfil no Supabase:", error);
        // Continua mesmo se falhar no Supabase (localStorage já está salvo)
      }
    }

    console.log("Perfil salvo:", userProfile);

    // Navega para o Chat
    router.push("/chat");
  };

  return (
    <ScreenContainer className="bg-background-dark text-white">
      <Header
        title="Perfil Básico"
        showBackButton
        onBack={() => router.back()}
      />

      <div className="flex flex-1 flex-col gap-6 py-4">
        {/* Campo: Nome */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="name"
            className="text-xs font-medium uppercase tracking-wider text-text-secondary"
          >
            Nome
          </Label>
          <Input
            id="name"
            placeholder="Digite seu nome"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={!!errors.name}
            className="w-full rounded-lg border-border-subtle bg-surface-input px-4 py-3.5 text-white placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
          />
          {errors.name && (
            <span className="text-xs font-medium text-error">{errors.name}</span>
          )}
        </div>

        {/* Campo: Gênero */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Gênero</Label>
          <Select
            id="gender"
            value={form.gender}
            onChange={(e) => updateField("gender", e.target.value)}
            error={!!errors.gender}
            className="w-full rounded-lg border-border-subtle bg-surface-input px-4 py-3.5 text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
          >
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Prefiro não informar</option>
          </Select>
          {errors.gender && (
            <span className="text-xs font-medium text-error">
              {errors.gender}
            </span>
          )}
        </div>

        {/* Campo: Data de nascimento */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="birthDate" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Data de nascimento</Label>
          <Input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => updateField("birthDate", e.target.value)}
            error={!!errors.birthDate}
            className="w-full rounded-lg border-border-subtle bg-surface-input px-4 py-3.5 text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
          />
          {errors.birthDate && (
            <span className="text-xs font-medium text-error">
              {errors.birthDate}
            </span>
          )}
        </div>

        {/* Campos: Altura e Peso (lado a lado) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Altura */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="height" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Altura (cm)</Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={form.height}
              onChange={(e) => updateField("height", e.target.value)}
              error={!!errors.height}
              className="w-full rounded-lg border-border-subtle bg-surface-input px-4 py-3.5 text-white placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
            />
            {errors.height && (
              <span className="text-xs font-medium text-error">
                {errors.height}
              </span>
            )}
          </div>

          {/* Peso */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="weight" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="80"
              value={form.weight}
              onChange={(e) => updateField("weight", e.target.value)}
              error={!!errors.weight}
              className="w-full rounded-lg border-border-subtle bg-surface-input px-4 py-3.5 text-white placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
            />
            {errors.weight && (
              <span className="text-xs font-medium text-error">
                {errors.weight}
              </span>
            )}
          </div>
        </div>

        {/* Espaçador flexível */}
        <div className="flex-1" />

        {/* Botão de submit */}
        <Button
          className="w-full h-14 rounded-2xl bg-primary text-lg font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </ScreenContainer>
  );
}
