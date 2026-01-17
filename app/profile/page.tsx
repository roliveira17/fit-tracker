"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import {
  getUserProfile,
  saveUserProfile,
  isOnboardingComplete,
  clearAllRegistrations,
  resetApp,
  clearChatMessages,
  type UserProfile,
} from "@/lib/storage";
import { Toast } from "@/components/feedback/Toast";
import { useToast } from "@/hooks/useToast";
import {
  User,
  Settings,
  Shield,
  Trash2,
  AlertTriangle,
  ChevronRight,
  X,
} from "lucide-react";

/**
 * Calcula BMR usando fórmula de Mifflin-St Jeor
 */
function calculateBMR(
  gender: "masculino" | "feminino" | "outro",
  weight: number,
  height: number,
  age: number
): number {
  // Fórmula base
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;

  // Ajuste por gênero
  if (gender === "masculino") {
    return Math.round(baseBMR + 5);
  } else if (gender === "feminino") {
    return Math.round(baseBMR - 161);
  }
  // Para "outro", usa média
  return Math.round(baseBMR - 78);
}

/**
 * Calcula idade a partir da data de nascimento
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
 * Página de Profile & Settings
 */
export default function ProfilePage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    gender: "masculino" as "masculino" | "feminino" | "outro",
    birthDate: "",
    height: 0,
    weight: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }

    const userProfile = getUserProfile();
    if (userProfile) {
      setProfile(userProfile);
      setFormData({
        name: userProfile.name,
        gender: userProfile.gender,
        birthDate: userProfile.birthDate,
        height: userProfile.height,
        weight: userProfile.weight,
      });
    }

    setIsLoading(false);
  }, [router]);

  // Validação do form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else {
      const age = calculateAge(formData.birthDate);
      if (age < 13) {
        newErrors.birthDate = "Idade mínima: 13 anos";
      } else if (age > 120) {
        newErrors.birthDate = "Data inválida";
      }
    }

    if (formData.height < 120 || formData.height > 250) {
      newErrors.height = "Altura entre 120-250 cm";
    }

    if (formData.weight < 35 || formData.weight > 300) {
      newErrors.weight = "Peso entre 35-300 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar alterações
  const handleSave = () => {
    if (!validateForm() || !profile) return;

    const age = calculateAge(formData.birthDate);
    const newBMR = calculateBMR(
      formData.gender,
      formData.weight,
      formData.height,
      age
    );

    const updatedProfile: UserProfile = {
      ...profile,
      name: formData.name.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      height: formData.height,
      weight: formData.weight,
      bmr: newBMR,
    };

    saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsEditing(false);
    showToast("Perfil atualizado!", "success");
  };

  // Cancelar edição
  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        gender: profile.gender,
        birthDate: profile.birthDate,
        height: profile.height,
        weight: profile.weight,
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  // Limpar registros
  const handleClearRegistrations = () => {
    clearAllRegistrations();
    clearChatMessages();
    setShowDeleteModal(false);
    showToast("Registros apagados!", "success");
  };

  // Reset total do app
  const handleResetApp = () => {
    resetApp();
    setShowResetModal(false);
    router.push("/onboarding");
  };

  // Obter timezone do browser
  const getTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Desconhecido";
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col pb-4">
        {/* Header */}
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Configurações e preferências
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Seção: Dados Pessoais */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Dados Pessoais
                </h2>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              // Modo edição
              <div className="flex flex-col gap-4">
                {/* Nome */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Gênero */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Gênero
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as typeof formData.gender,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Data de nascimento */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.birthDate}
                    </p>
                  )}
                </div>

                {/* Altura */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        height: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.height && (
                    <p className="text-xs text-red-500 mt-1">{errors.height}</p>
                  )}
                </div>

                {/* Peso */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.weight && (
                    <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
                  )}
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualização
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nome</span>
                  <span className="text-sm text-foreground">
                    {profile?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gênero</span>
                  <span className="text-sm text-foreground capitalize">
                    {profile?.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Idade</span>
                  <span className="text-sm text-foreground">
                    {profile?.birthDate
                      ? `${calculateAge(profile.birthDate)} anos`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Altura</span>
                  <span className="text-sm text-foreground">
                    {profile?.height} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Peso</span>
                  <span className="text-sm text-foreground">
                    {profile?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    BMR (gasto basal)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {profile?.bmr} kcal/dia
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Seção: Preferências */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Preferências
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Unidade de peso
                </span>
                <span className="text-sm text-foreground">kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Unidade de energia
                </span>
                <span className="text-sm text-foreground">kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Timezone</span>
                <span className="text-sm text-foreground">{getTimezone()}</span>
              </div>
            </div>
          </section>

          {/* Seção: Privacidade */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Privacidade
              </h2>
            </div>

            <p className="text-sm text-muted-foreground">
              Seus dados pertencem a você. Tudo é armazenado localmente no seu
              dispositivo. Nada é compartilhado sem sua ação explícita.
            </p>
          </section>

          {/* Seção: Avançado */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Avançado
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {/* Limpar registros */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-between w-full rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Limpar registros
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Apaga refeições, treinos, peso e chat
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Reset total */}
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center justify-between w-full rounded-lg border border-red-500/30 p-3 text-left hover:bg-red-500/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-500">
                      Resetar app
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Apaga TUDO e volta ao início
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal: Limpar registros */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Limpar registros?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Isso vai apagar todas as refeições, treinos, registros de peso e
              mensagens do chat. Seu perfil será mantido.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearRegistrations}
                className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset app */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-500">
                Resetar tudo?
              </h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Isso vai apagar TODOS os dados, incluindo seu perfil. O app
              voltará ao estado inicial como se fosse a primeira vez.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetApp}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </ScreenContainer>
  );
}
