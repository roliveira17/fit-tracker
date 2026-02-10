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
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { ExportSection } from "@/components/profile/ExportSection";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { AccountSection } from "@/components/profile/AccountSection";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileListItem } from "@/components/profile/ProfileListItem";

// ============================================
// Helpers
// ============================================

function calculateBMR(
  gender: "masculino" | "feminino" | "outro",
  weight: number,
  height: number,
  age: number
): number {
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "masculino") return Math.round(baseBMR + 5);
  if (gender === "feminino") return Math.round(baseBMR - 161);
  return Math.round(baseBMR - 78);
}

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

function calculateBMI(weight: number, heightCm: number): string {
  if (weight <= 0 || heightCm <= 0) return "—";
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  return bmi.toFixed(1);
}

// ============================================
// Seções expandíveis
// ============================================

type ExpandedSection =
  | null
  | "personal"
  | "preferences"
  | "export"
  | "notifications"
  | "privacy"
  | "advanced";

// ============================================
// Página de Profile — Design Stitch (Light)
// ============================================

export default function ProfilePage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const toggleSection = (section: ExpandedSection) => {
    setExpanded((prev) => (prev === section ? null : section));
    if (section !== "personal") {
      setIsEditing(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    } else {
      const age = calculateAge(formData.birthDate);
      if (age < 13) newErrors.birthDate = "Idade mínima: 13 anos";
      else if (age > 120) newErrors.birthDate = "Data inválida";
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

  const handleSave = () => {
    if (!validateForm() || !profile) return;

    const age = calculateAge(formData.birthDate);
    const newBMR = calculateBMR(formData.gender, formData.weight, formData.height, age);

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

  const handleClearRegistrations = () => {
    clearAllRegistrations();
    clearChatMessages();
    setShowDeleteModal(false);
    showToast("Registros apagados!", "success");
  };

  const handleResetApp = () => {
    resetApp();
    setShowResetModal(false);
    router.push("/onboarding");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

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
        <div className="flex flex-1 items-center justify-center bg-[#F5F3EF]">
          <p className="text-gray-400">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col px-5 pb-24 bg-[#F5F3EF] min-h-screen">
        {/* Header: Título Serif + Settings */}
        <header className="flex justify-between items-start pt-6 pb-8">
          <h1 className="font-serif-display text-3xl text-calma-primary">
            Seu Perfil
          </h1>
          <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
            <span className="material-symbols-outlined text-calma-primary">
              settings
            </span>
          </button>
        </header>

        {/* Hero: Avatar + Nome */}
        <div className="mb-6">
          <AccountSection />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-soft flex flex-col items-center justify-center text-center gap-1">
            <span className="text-3xl font-serif-display text-calma-primary">
              {profile ? calculateBMI(profile.weight, profile.height) : "—"}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              IMC
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-soft flex flex-col items-center justify-center text-center gap-1">
            <span className="text-3xl font-serif-display text-calma-primary">
              {profile?.bmr || "—"}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              TMB (kcal)
            </span>
          </div>
        </div>

        {/* Seções */}
        <div className="flex flex-col gap-6">
          {/* ─── Conta ─── */}
          <ProfileSection title="Conta">
            <ProfileListItem
              icon="person"
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              label="Dados Pessoais"
              right={
                <span
                  className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                    expanded === "personal" ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              }
              onClick={() => toggleSection("personal")}
            />
            <ProfileListItem
              icon="tune"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Preferências"
              right={
                <span
                  className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                    expanded === "preferences" ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              }
              onClick={() => toggleSection("preferences")}
            />
            <ProfileListItem
              icon="download"
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              label="Exportar Dados"
              right={
                <span
                  className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                    expanded === "export" ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              }
              onClick={() => toggleSection("export")}
              isLast
            />
          </ProfileSection>

          {/* Expansão: Dados Pessoais */}
          {expanded === "personal" && (
            <div className="rounded-xl bg-white shadow-soft p-4 animate-fade-in-up">
              {isEditing ? (
                <PersonalDataForm
                  formData={formData}
                  errors={errors}
                  onChange={setFormData}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <PersonalDataView
                  profile={profile}
                  onEdit={() => setIsEditing(true)}
                />
              )}
            </div>
          )}

          {/* Expansão: Preferências */}
          {expanded === "preferences" && (
            <div className="rounded-xl bg-white shadow-soft p-4 animate-fade-in-up">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Unidade de peso</span>
                  <span className="text-sm text-gray-800">kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Unidade de energia</span>
                  <span className="text-sm text-gray-800">kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Timezone</span>
                  <span className="text-sm text-gray-800">{getTimezone()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Expansão: Exportar Dados */}
          {expanded === "export" && (
            <div className="animate-fade-in-up">
              <ExportSection
                onSuccess={() => showToast("Dados exportados!", "success")}
                onError={(error) => showToast(error, "error")}
              />
            </div>
          )}

          {/* ─── Preferências ─── */}
          <ProfileSection title="Preferências">
            <ProfileListItem
              icon="notifications"
              iconBg="bg-green-100"
              iconColor="text-green-700"
              label="Notificações"
              right={
                <span
                  className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                    expanded === "notifications" ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              }
              onClick={() => toggleSection("notifications")}
            />
            <ProfileListItem
              icon="shield"
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              label="Privacidade"
              right={
                <span
                  className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                    expanded === "privacy" ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              }
              onClick={() => toggleSection("privacy")}
              isLast
            />
          </ProfileSection>

          {/* Expansão: Notificações */}
          {expanded === "notifications" && (
            <div className="animate-fade-in-up">
              <NotificationSettings
                onPermissionChange={(granted) => {
                  if (!granted) {
                    showToast("Permissão de notificações negada", "error");
                  }
                }}
              />
            </div>
          )}

          {/* Expansão: Privacidade */}
          {expanded === "privacy" && (
            <div className="rounded-xl bg-white shadow-soft p-4 animate-fade-in-up">
              <p className="text-sm text-gray-500">
                Seus dados pertencem a você. Tudo é armazenado localmente no seu
                dispositivo. Nada é compartilhado sem sua ação explícita.
              </p>
            </div>
          )}

          {/* ─── Suporte ─── */}
          <ProfileSection title="Suporte">
            <ProfileListItem
              icon="warning"
              iconBg="bg-gray-100"
              iconColor="text-gray-600"
              label="Avançado"
              right={
                <span
                  className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
                    expanded === "advanced" ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              }
              onClick={() => toggleSection("advanced")}
            />
            <ProfileListItem
              icon="logout"
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Sair da conta"
              danger
              right={
                isLoggingOut ? (
                  <span className="material-symbols-outlined animate-spin text-[18px] text-gray-400">
                    progress_activity
                  </span>
                ) : undefined
              }
              onClick={handleLogout}
              isLast
            />
          </ProfileSection>

          {/* Expansão: Avançado */}
          {expanded === "advanced" && (
            <div className="rounded-xl bg-white shadow-soft p-4 animate-fade-in-up">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-between w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-yellow-500">
                      delete
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Limpar registros
                      </p>
                      <p className="text-xs text-gray-500">
                        Apaga refeições, treinos, peso e chat
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-gray-400">
                    chevron_right
                  </span>
                </button>

                <button
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center justify-between w-full rounded-lg border border-red-200 p-3 text-left hover:bg-red-50 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-red-500">
                      delete_forever
                    </span>
                    <div>
                      <p className="text-sm font-medium text-red-500">
                        Resetar app
                      </p>
                      <p className="text-xs text-gray-500">
                        Apaga TUDO e volta ao início
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-gray-400">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Versão */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">Fit Track v3.0</p>
          </div>
        </div>
      </div>

      {/* Modal: Limpar registros */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Limpar registros?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Isso vai apagar todas as refeições, treinos, registros de peso e
              mensagens do chat. Seu perfil será mantido.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearRegistrations}
                className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-400 active:scale-95 transition-all"
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
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-500">
                Resetar tudo?
              </h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Isso vai apagar TODOS os dados, incluindo seu perfil. O app
              voltará ao estado inicial como se fosse a primeira vez.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
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


      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </ScreenContainer>
  );
}

// ============================================
// Sub-componentes do form de dados pessoais
// ============================================

function PersonalDataView({
  profile,
  onEdit,
}: {
  profile: UserProfile | null;
  onEdit: () => void;
}) {
  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={onEdit}
          className="text-sm text-calma-primary hover:underline"
        >
          Editar
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Nome</span>
          <span className="text-sm text-gray-800">{profile?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Gênero</span>
          <span className="text-sm text-gray-800 capitalize">{profile?.gender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Idade</span>
          <span className="text-sm text-gray-800">
            {profile?.birthDate ? `${calculateAge(profile.birthDate)} anos` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Altura</span>
          <span className="text-sm text-gray-800">{profile?.height} cm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Peso</span>
          <span className="text-sm text-gray-800">{profile?.weight} kg</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">BMR (gasto basal)</span>
          <span className="text-sm font-medium text-gray-800">
            {profile?.bmr} kcal/dia
          </span>
        </div>
      </div>
    </>
  );
}

function PersonalDataForm({
  formData,
  errors,
  onChange,
  onSave,
  onCancel,
}: {
  formData: {
    name: string;
    gender: "masculino" | "feminino" | "outro";
    birthDate: string;
    height: number;
    weight: number;
  };
  errors: Record<string, string>;
  onChange: (data: typeof formData) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-calma-primary";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Nome</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className={inputClass}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Gênero</label>
        <select
          value={formData.gender}
          onChange={(e) =>
            onChange({ ...formData, gender: e.target.value as typeof formData.gender })
          }
          className={inputClass}
        >
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Data de nascimento
        </label>
        <input
          type="date"
          value={formData.birthDate}
          onChange={(e) => onChange({ ...formData, birthDate: e.target.value })}
          className={inputClass}
        />
        {errors.birthDate && (
          <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Altura (cm)
        </label>
        <input
          type="number"
          value={formData.height}
          onChange={(e) => onChange({ ...formData, height: Number(e.target.value) })}
          className={inputClass}
        />
        {errors.height && (
          <p className="text-xs text-red-500 mt-1">{errors.height}</p>
        )}
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Peso (kg)
        </label>
        <input
          type="number"
          step="0.1"
          value={formData.weight}
          onChange={(e) => onChange({ ...formData, weight: Number(e.target.value) })}
          className={inputClass}
        />
        {errors.weight && (
          <p className="text-xs text-red-500 mt-1">{errors.weight}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          className="flex-1 rounded-lg bg-calma-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-calma-primary/30 hover:bg-calma-primary/90 active:scale-95 transition-all"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
