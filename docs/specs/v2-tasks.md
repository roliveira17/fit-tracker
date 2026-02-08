# FIT TRACK — TASKS v2

> **Features planejadas para a versão 2.**
> Ordem de implementação baseada em dependências e impacto no usuário.

---

## Visão Geral

| # | Feature | Prioridade | Complexidade | Dependências |
|---|---------|------------|--------------|--------------|
| 1 | Áudio no Chat | Alta | Média | — |
| 2 | Importação Apple Health | Alta | Alta | — |
| 3 | Autenticação Social | Média | Média | — |
| 4 | Chat com Foto | Média | Alta | — |
| 5 | Push Notifications | Baixa | Média | Autenticação |
| 6 | Exportação de Dados | Baixa | Baixa | — |

---

## Feature 1: Áudio no Chat

> Permitir entrada de voz no Chat, convertendo áudio em texto.

### 1.1 Componentes

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 1.1.1 | Botão de gravação no ChatInput | `components/ui/ChatInput.tsx` |
| 1.1.2 | Indicador visual de gravação (pulsante) | `components/ui/ChatInput.tsx` |
| 1.1.3 | Feedback de "processando áudio" | `components/feedback/AudioProcessing.tsx` |

### 1.2 Lógica

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 1.2.1 | Hook para captura de áudio (MediaRecorder API) | `hooks/useAudioRecorder.ts` |
| 1.2.2 | Integração com API de transcrição (Whisper/OpenAI) | `app/api/transcribe/route.ts` |
| 1.2.3 | Conversão de áudio para texto no fluxo do Chat | `app/chat/page.tsx` |
| 1.2.4 | Tratamento de erros (permissão negada, falha de rede) | `hooks/useAudioRecorder.ts` |

### 1.3 UX

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 1.3.1 | Solicitar permissão de microfone (apenas quando clicar) | `hooks/useAudioRecorder.ts` |
| 1.3.2 | Feedback visual durante transcrição | `components/ui/ChatInput.tsx` |
| 1.3.3 | Cancelar gravação (swipe ou botão X) | `components/ui/ChatInput.tsx` |

---

## Feature 2: Importação Apple Health

> Importar dados de saúde do iPhone/Apple Watch via arquivo ZIP/XML.

### 2.1 Parser

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 2.1.1 | Descompactar ZIP no browser (JSZip) | `lib/import/appleHealth.ts` |
| 2.1.2 | Parser XML para entidades do app | `lib/import/appleHealthParser.ts` |
| 2.1.3 | Mapeamento HKQuantityType → entidades | `lib/import/appleHealthMapper.ts` |

### 2.2 Dados Suportados

| Task | Descrição | Entidade Destino |
|------|-----------|------------------|
| 2.2.1 | Peso (HKQuantityTypeIdentifierBodyMass) | `WeightLog` |
| 2.2.2 | Body Fat (HKQuantityTypeIdentifierBodyFatPercentage) | `BodyFatLog` |
| 2.2.3 | Workouts (HKWorkoutActivityType*) | `CardioSession` |
| 2.2.4 | Sono (HKCategoryTypeIdentifierSleepAnalysis) | `SleepSession`, `SleepStage` |
| 2.2.5 | Frequência cardíaca (séries temporais) | `TimeSeries` |

### 2.3 UI

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 2.3.1 | Adicionar opção "Apple Health" no Dropzone | `app/import/page.tsx` |
| 2.3.2 | Preview de dados antes de importar | `components/import/AppleHealthPreview.tsx` |
| 2.3.3 | Progresso de importação (arquivo grande) | `components/import/ImportProgress.tsx` |
| 2.3.4 | Resumo pós-importação (X registros, Y duplicados) | `components/import/ImportSummary.tsx` |

### 2.4 Lógica

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 2.4.1 | Detecção de duplicatas (mesmo timestamp) | `lib/import/deduplication.ts` |
| 2.4.2 | Merge com dados existentes (regra-mãe) | `lib/import/merge.ts` |
| 2.4.3 | Histórico de importações Apple Health | `lib/storage.ts` |

---

## Feature 3: Autenticação Social

> Login com Apple e Google para sincronização futura.

### 3.1 Apple Sign-In

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 3.1.1 | Configurar Apple Developer credentials | `.env.local` |
| 3.1.2 | Implementar fluxo OAuth Apple | `app/api/auth/apple/route.ts` |
| 3.1.3 | Botão "Continuar com Apple" funcional | `app/onboarding/page.tsx` |
| 3.1.4 | Armazenar token de sessão | `lib/auth.ts` |

### 3.2 Google Sign-In

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 3.2.1 | Configurar Google Cloud credentials | `.env.local` |
| 3.2.2 | Implementar fluxo OAuth Google | `app/api/auth/google/route.ts` |
| 3.2.3 | Botão "Continuar com Google" funcional | `app/onboarding/page.tsx` |

### 3.3 Gestão de Sessão

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 3.3.1 | Contexto de autenticação global | `contexts/AuthContext.tsx` |
| 3.3.2 | Persistência de sessão (cookie/localStorage) | `lib/auth.ts` |
| 3.3.3 | Migração de perfil local → autenticado | `lib/migration.ts` |
| 3.3.4 | Logout e limpeza de sessão | `app/profile/page.tsx` |

---

## Feature 4: Chat com Foto

> Registrar refeições enviando foto do prato.

### 4.1 Captura

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 4.1.1 | Botão de câmera/galeria no ChatInput | `components/ui/ChatInput.tsx` |
| 4.1.2 | Seletor de imagem (câmera ou galeria) | `components/chat/ImagePicker.tsx` |
| 4.1.3 | Preview da imagem antes de enviar | `components/chat/ImagePreview.tsx` |

### 4.2 Análise

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 4.2.1 | Envio de imagem para API de visão (GPT-4V) | `app/api/analyze-image/route.ts` |
| 4.2.2 | Extração de alimentos da imagem | `lib/ai/imageAnalysis.ts` |
| 4.2.3 | Estimativa de porções e calorias | `lib/ai/imageAnalysis.ts` |

### 4.3 Integração

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 4.3.1 | Exibir imagem no ChatBubble | `components/ui/ChatBubble.tsx` |
| 4.3.2 | Fluxo: foto → análise → confirmação → registro | `app/chat/page.tsx` |
| 4.3.3 | Permitir correção da análise via texto | `app/chat/page.tsx` |

---

## Feature 5: Push Notifications

> Lembretes configuráveis para registro de refeições.

### 5.1 Infraestrutura

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 5.1.1 | Configurar Service Worker | `public/sw.js` |
| 5.1.2 | Solicitar permissão de notificação | `lib/notifications.ts` |
| 5.1.3 | Registrar subscription no backend | `app/api/notifications/subscribe/route.ts` |

### 5.2 Configuração

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 5.2.1 | Tela de configuração de lembretes | `app/profile/notifications/page.tsx` |
| 5.2.2 | Horários personalizáveis (café, almoço, jantar) | `lib/storage.ts` |
| 5.2.3 | Toggle on/off por tipo de lembrete | `components/ui/ToggleItem.tsx` |

### 5.3 Disparo

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 5.3.1 | Lógica de agendamento local | `lib/notifications.ts` |
| 5.3.2 | Conteúdo da notificação contextual | `lib/notifications.ts` |
| 5.3.3 | Deep link para Chat ao clicar | `public/sw.js` |

---

## Feature 6: Exportação de Dados

> Exportar todos os dados do usuário em formato portátil.

### 6.1 Formatos

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 6.1.1 | Exportar como JSON (completo) | `lib/export/json.ts` |
| 6.1.2 | Exportar como CSV (tabular) | `lib/export/csv.ts` |

### 6.2 UI

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 6.2.1 | Botão "Exportar dados" no Profile | `app/profile/page.tsx` |
| 6.2.2 | Seletor de formato (JSON/CSV) | `components/profile/ExportModal.tsx` |
| 6.2.3 | Seletor de período (tudo, último mês, etc.) | `components/profile/ExportModal.tsx` |
| 6.2.4 | Download do arquivo gerado | `lib/export/download.ts` |

### 6.3 Conteúdo

| Task | Descrição | Dados Incluídos |
|------|-----------|-----------------|
| 6.3.1 | Perfil do usuário | Nome, altura, peso, BMR |
| 6.3.2 | Histórico de peso/BF | WeightLog, BodyFatLog |
| 6.3.3 | Refeições | Meal, MealItem |
| 6.3.4 | Treinos | Workout, WorkoutSet |
| 6.3.5 | Importações | ImportHistory |

---

## Ordem de Execução Recomendada

```
FASE 1 - Core UX
├── Feature 1: Áudio no Chat (1.1 → 1.2 → 1.3)
└── Feature 2: Importação Apple Health (2.1 → 2.2 → 2.3 → 2.4)

FASE 2 - Autenticação
└── Feature 3: Autenticação Social (3.1 → 3.2 → 3.3)

FASE 3 - Mídia
└── Feature 4: Chat com Foto (4.1 → 4.2 → 4.3)

FASE 4 - Engagement
└── Feature 5: Push Notifications (5.1 → 5.2 → 5.3)

FASE 5 - Portabilidade
└── Feature 6: Exportação de Dados (6.1 → 6.2 → 6.3)
```

---

## Estimativas

| Feature | Tasks | Complexidade |
|---------|-------|--------------|
| Áudio no Chat | 10 | Média |
| Apple Health Import | 14 | Alta |
| Autenticação Social | 11 | Média |
| Chat com Foto | 9 | Alta |
| Push Notifications | 9 | Média |
| Exportação | 9 | Baixa |
| **TOTAL** | **62** | — |

---

## Notas Técnicas

### Dependências npm a adicionar (v2)

```bash
# Áudio
npm install lamejs  # Encoder MP3

# Apple Health
npm install jszip   # Descompactar ZIP
npm install fast-xml-parser  # Parser XML

# Autenticação
npm install next-auth  # OAuth simplificado

# Notificações
npm install web-push  # Push notifications
```

### Variáveis de ambiente necessárias

```env
# Autenticação Apple
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Autenticação Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Push Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```
