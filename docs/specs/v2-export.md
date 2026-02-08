# Feature 6: Exportação de Dados

> Permitir que o usuário exporte todos os seus dados em JSON ou CSV.

---

## Visão Geral

O usuário pode importar dados (Hevy, Apple Health), mas não pode exportá-los. Esta feature fecha o ciclo, dando ao usuário controle total sobre seus dados.

**Localização:** Página de Profile (`/profile`)

---

## Tasks

### 6.1 Função exportToJSON

**O que faz:** Coleta todos os dados do localStorage e gera um objeto JSON estruturado.

**Arquivo:** `lib/export/exportData.ts` (criar)

**Dados incluídos:**
- Perfil do usuário
- Histórico de peso
- Histórico de body fat
- Refeições
- Treinos
- Histórico de importações

**Interface:**
```typescript
interface ExportData {
  exportedAt: string;
  version: string;
  profile: UserProfile | null;
  weightLogs: WeightLog[];
  bodyFatLogs: BodyFatLog[];
  meals: Meal[];
  workouts: Workout[];
  importHistory: ImportRecord[];
}

function exportToJSON(options?: ExportOptions): ExportData
```

---

### 6.2 Função exportToCSV

**O que faz:** Converte os dados para formato CSV (múltiplos arquivos em ZIP ou arquivo único com seções).

**Abordagem:** Gerar um ZIP com múltiplos CSVs:
- `profile.csv`
- `weight_logs.csv`
- `body_fat_logs.csv`
- `meals.csv`
- `workouts.csv`

**Dependência:** JSZip (já instalado)

---

### 6.3 UI de Exportação no Profile

**O que faz:** Adiciona seção de exportação na página de perfil.

**Arquivo:** `app/profile/page.tsx` (modificar)

**Design:**
```
┌─────────────────────────────────────┐
│  Exportar Dados                     │
├─────────────────────────────────────┤
│                                     │
│  Formato:                           │
│  [JSON]  [CSV]                      │
│                                     │
│  Período:                           │
│  [Todos os dados ▼]                 │
│                                     │
│  [📥 Exportar]                      │
│                                     │
└─────────────────────────────────────┘
```

---

### 6.4 Seletor de Período

**O que faz:** Permite filtrar dados por período antes de exportar.

**Opções:**
- Todos os dados
- Último mês
- Últimos 3 meses
- Últimos 6 meses
- Último ano

**Interface:**
```typescript
interface ExportOptions {
  format: 'json' | 'csv';
  period: 'all' | '1m' | '3m' | '6m' | '1y';
}
```

---

### 6.5 Download do Arquivo

**O que faz:** Gera o arquivo e dispara o download no navegador.

**Implementação:**
```typescript
function downloadFile(data: string | Blob, filename: string, mimeType: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Nomes dos arquivos:**
- JSON: `fittrack_export_2026-01-21.json`
- CSV: `fittrack_export_2026-01-21.zip`

---

## Checklist de Implementação

### Lógica
- [ ] 6.1 Função exportToJSON
- [ ] 6.2 Função exportToCSV
- [ ] 6.5 Função downloadFile

### UI
- [ ] 6.3 Seção de exportação no Profile
- [ ] 6.4 Seletor de formato (JSON/CSV)
- [ ] 6.4 Seletor de período

### Integração
- [ ] Botão de exportação funcional
- [ ] Feedback de sucesso/erro
- [ ] Build passa sem erros

---

## Componentes a Criar

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| ExportSection | `components/profile/ExportSection.tsx` | Card com opções de exportação |

---

## Fluxo do Usuário

1. Usuário vai em Profile
2. Rola até "Exportar Dados"
3. Seleciona formato (JSON ou CSV)
4. Seleciona período (opcional)
5. Clica em "Exportar"
6. Arquivo é baixado automaticamente
7. Toast confirma sucesso

---

## Estimativa

| Task | Complexidade |
|------|--------------|
| 6.1 exportToJSON | Baixa |
| 6.2 exportToCSV | Média |
| 6.3 UI Profile | Baixa |
| 6.4 Seletor período | Baixa |
| 6.5 Download | Baixa |
| **Total** | **Baixa-Média** |
