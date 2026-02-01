# Dados Reais de Importação

Esta pasta contém exemplos reais de dados que os usuários vão importar para o Fit Track.

## Arquivos

### 1. Apple Health Export (`export/`)

Exportação real do iPhone contendo:

- **Peso (HKQuantityTypeIdentifierBodyMass)**
  - Formato: `unit="kg" value="74.65"`
  - Fonte: Fitdays, MacroFactor, iPhone

- **Body Fat (HKQuantityTypeIdentifierBodyFatPercentage)**
  - Formato: `unit="%" value="0.219387"` (valor decimal, 0.22 = 22%)
  - Fonte: Fitdays

- **Sono (HKCategoryTypeIdentifierSleepAnalysis)**
  - Estágios: AsleepCore, AsleepDeep, AsleepREM, Awake
  - Fonte: Apple Watch

- **Treinos (Workout)**
  - Tipos: Walking, Cycling, Swimming, Soccer, TraditionalStrengthTraining, CrossTraining
  - Fontes: Apple Watch, Hevy

- **Água (HKQuantityTypeIdentifierDietaryWater)**
  - Formato: `unit="mL" value="82.32"`
  - Fonte: MacroFactor

**NOTA:** Não há dados de glicemia (BloodGlucose) no Apple Health deste usuário. Os dados de CGM estão em arquivo separado.

### 2. Hevy Export (`workout_data.csv`)

Dados de musculação exportados do app Hevy.

**Formato:**
```csv
"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
"2","12 Jan 2026, 12:17","12 Jan 2026, 13:07","","Triceps Pushdown",,"",0,"normal",60,8,,,
```

**Características:**
- Cada linha representa um SET (não um exercício)
- Formato de data: `"DD MMM YYYY, HH:mm"` (ex: "12 Jan 2026, 12:17")
- `title` é o número da sessão
- `set_type`: "normal", "warmup"
- Exercícios em inglês

### 3. CGM Export (`SiSensingCGM-*.xlsx`)

Dados de glicemia contínua (CGM) do dispositivo SiSensing.

**Formato:** XLSX (Excel)
- Planilha: "Sensor de glucose"
- Colunas: "Hora", "Leitura de sensor(mg/dL)"
- Formato de data: `DD-MM-YYYY HH:mm GMT-3`

**Exemplo:**
```
Hora                    Leitura de sensor(mg/dL)
22-01-2026 10:22 GMT-3  117
22-01-2026 10:27 GMT-3  115
```

**Estatísticas do arquivo real:**
- Total de leituras: 1186
- Período: 22/01/2026 a 26/01/2026
- Range: 54 - 153 mg/dL
- Média: 106.4 mg/dL

**Parser:** `lib/parsers/cgm.ts`

## Status dos Parsers

| Fonte | Formato | Parser | Status |
|-------|---------|--------|--------|
| Apple Health | XML (ZIP) | `lib/import/appleHealthParser.ts` | ✅ Compatível |
| Hevy | CSV | `lib/parsers/hevy.ts` | ✅ Atualizado para formato real |
| SiSensing CGM | XLSX | `lib/parsers/cgm.ts` | ✅ Criado |
| FreeStyle Libre | XLSX | `lib/parsers/cgm.ts` | 🔄 Parcial (usa parser genérico) |

## Análise Realizada em 2026-01-26/27

### Descobertas

1. **Apple Health XML** - Parser 100% compatível
2. **Hevy CSV** - Parser corrigido para formato de data "DD MMM YYYY, HH:mm"
3. **CGM XLSX** - Novo parser criado com suporte a XLSX

### Testes Realizados

- ✅ Parser CGM testado com arquivo real (`SiSensingCGM-AA2506MD07-01.20.00.00.xlsx`)
- ✅ 1186 leituras parseadas corretamente
- ✅ Integração na página de importação completa
- ✅ UI aceita arquivos .xlsx e .xls

### Pendências

1. ~~Integrar parser CGM na página de importação~~ ✅
2. Testar com mais arquivos XLSX de diferentes CGMs
3. Adicionar suporte a FreeStyle Libre específico
