"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
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
import { ExportSection } from "@/components/profile/ExportSection";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { AccountSection } from "@/components/profile/AccountSection";

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
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header do Design System */}
      <Header variant="simple" title="Perfil" />

      <div className="flex flex-1 flex-col px-4 pb-24">

        <div className="flex flex-col gap-4 pt-4">
          {/* Seção: Conta */}
          <AccountSection />

          {/* Seção: Dados Pessoais */}
          <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-secondary">
                  person
                </span>
                <h2 className="text-sm font-medium text-text-secondary">
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
                  <label className="text-xs text-text-secondary mb-1 block">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Gênero */}
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
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
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                {/* Data de nascimento */}
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.birthDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.birthDate}
                    </p>
                  )}
                </div>

                {/* Altura */}
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
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
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.height && (
                    <p className="text-xs text-red-500 mt-1">{errors.height}</p>
                  )}
                </div>

                {/* Peso */}
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">
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
                    className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.weight && (
                    <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
                  )}
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualização
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Nome</span>
                  <span className="text-sm text-white">
                    {profile?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Gênero</span>
                  <span className="text-sm text-white capitalize">
                    {profile?.gender}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Idade</span>
                  <span className="text-sm text-white">
                    {profile?.birthDate
                      ? `${calculateAge(profile.birthDate)} anos`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Altura</span>
                  <span className="text-sm text-white">
                    {profile?.height} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Peso</span>
                  <span className="text-sm text-white">
                    {profile?.weight} kg
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-subtle">
                  <span className="text-sm text-text-secondary">
                    BMR (gasto basal)
                  </span>
                  <span className="text-sm font-medium text-white">
                    {profile?.bmr} kcal/dia
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Seção: Preferências */}
          <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-text-secondary">
                settings
              </span>
              <h2 className="text-sm font-medium text-text-secondary">
                Preferências
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">
                  Unidade de peso
                </span>
                <span className="text-sm text-white">kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">
                  Unidade de energia
                </span>
                <span className="text-sm text-white">kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Timezone</span>
                <span className="text-sm text-white">{getTimezone()}</span>
              </div>
            </div>
          </section>

          {/* Seção: Privacidade */}
          <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-text-secondary">
                shield
              </span>
              <h2 className="text-sm font-medium text-text-secondary">
                Privacidade
              </h2>
            </div>

            <p className="text-sm text-text-secondary">
              Seus dados pertencem a você. Tudo é armazenado localmente no seu
              dispositivo. Nada é compartilhado sem sua ação explícita.
            </p>
          </section>

          {/* Seção: Lembretes/Notificações */}
          <NotificationSettings
            onPermissionChange={(granted) => {
              if (!granted) {
                showToast("Permissão de notificações negada", "error");
              }
            }}
          />

          {/* Seção: Exportar Dados */}
          <ExportSection
            onSuccess={() => showToast("Dados exportados!", "success")}
            onError={(error) => showToast(error, "error")}
          />

          {/* Seção: Avançado */}
          <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-text-secondary">
                warning
              </span>
              <h2 className="text-sm font-medium text-text-secondary">
                Avançado
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {/* Limpar registros */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-between w-full rounded-lg border border-border-subtle p-3 text-left hover:bg-surface-dark/50 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-yellow-500">
                    delete
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Limpar registros
                    </p>
                    <p className="text-xs text-text-secondary">
                      Apaga refeições, treinos, peso e chat
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">
                  chevron_right
                </span>
              </button>

              {/* Reset total */}
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center justify-between w-full rounded-lg border border-red-500/30 p-3 text-left hover:bg-red-500/10 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-red-500">
                    delete_forever
                  </span>
                  <div>
                    <p className="text-sm font-medium text-red-500">
                      Resetar app
                    </p>
                    <p className="text-xs text-text-secondary">
                      Apaga TUDO e volta ao início
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">
                  chevron_right
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal: Limpar registros */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Limpar registros?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-6">
              Isso vai apagar todas as refeições, treinos, registros de peso e
              mensagens do chat. Seu perfil será mantido.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearRegistrations}
                className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 active:scale-95 transition-all"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset app */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border-subtle bg-surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-500">
                Resetar tudo?
              </h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-sm text-text-secondary mb-6">
              Isso vai apagar TODOS os dados, incluindo seu perfil. O app
              voltará ao estado inicial como se fosse a primeira vez.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 rounded-lg border border-border-subtle px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetApp}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 active:scale-95 transition-all"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav variant="with-fab" onFabClick={() => router.push("/chat")} />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </ScreenContainer>
  );
}
