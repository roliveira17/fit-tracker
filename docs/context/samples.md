# Dados de Teste e Referencia

Arquivos de exemplo e exports reais para desenvolvimento e testes do Fit Track.

---

## Arquivos Sample (`docs/samples/`)

| Arquivo | Formato | Descricao |
|---------|---------|-----------|
| `apple_health_sample.xml` | XML | Exemplo sintetico do export do Apple Health |
| `hevy_sample.csv` | CSV | Exemplo sintetico do export do Hevy |
| `glucose_sample.csv` | CSV | Exemplo sintetico de dados de glicemia |

### Apple Health Sample
Simula `export.xml` do ZIP exportado pelo app Saude do iPhone. Contem peso (4 medicoes), body fat (3 medicoes), glicemia (8 medicoes), frequencia cardiaca, treinos (corrida, musculacao, HIIT, natacao), sono (noite completa com deep/light/REM/awake) e passos.

### Hevy Sample
Formato real do CSV do app Hevy. Colunas: `title, start_time, end_time, description, exercise_title, superset_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe`.

### Glucose Sample
Formato para monitores de glicose. Colunas: `date, time, glucose_mg_dl, measurement_type, notes, device`. Valores de referencia: jejum 70-100 mg/dL, pos-refeicao <140 mg/dL.

---

## Dados Reais do Usuario (`docs/db/`)

### Apple Health Export
- **Peso**: `unit="kg"`, fontes Fitdays/MacroFactor/iPhone
- **Body Fat**: `unit="%"`, valor decimal (0.22 = 22%), fonte Fitdays
- **Sono**: estagios AsleepCore/AsleepDeep/AsleepREM/Awake, fonte Apple Watch
- **Treinos**: Walking/Cycling/Swimming/Soccer/TraditionalStrengthTraining, fontes Apple Watch/Hevy
- **Nota**: sem dados de glicemia no Apple Health deste usuario

### Hevy Export (`workout_data.csv`)
- Cada linha = 1 SET (nao exercicio)
- Data: `"DD MMM YYYY, HH:mm"` (ex: "12 Jan 2026, 12:17")
- `title` = numero da sessao, `set_type` = "normal"/"warmup"
- Exercicios em ingles

### CGM Export (`SiSensingCGM-*.xlsx`)
- Formato XLSX, planilha "Sensor de glucose"
- Colunas: "Hora", "Leitura de sensor(mg/dL)"
- Data: `DD-MM-YYYY HH:mm GMT-3`
- Arquivo real: 1186 leituras, 22-26/01/2026, range 54-153 mg/dL, media 106.4

---

## Status dos Parsers

| Fonte | Formato | Parser | Status |
|-------|---------|--------|--------|
| Apple Health | XML (ZIP) | `lib/import/appleHealthParser.ts` | Compativel |
| Hevy | CSV | `lib/parsers/hevy.ts` | Compativel |
| SiSensing CGM | XLSX | `lib/parsers/cgm.ts` | Compativel |
| FreeStyle Libre | XLSX | `lib/parsers/cgm.ts` | Parcial (parser generico) |

---

## Como Usar para Testes

```typescript
// Testar parsing de Apple Health
import { parseAppleHealthXml } from "@/lib/import/appleHealthParser";
import fs from "fs";
const xml = fs.readFileSync("docs/samples/apple_health_sample.xml", "utf-8");
const data = parseAppleHealthXml(xml);
```

Todos os dados sample sao ficticios e representam um usuario saudavel em processo de emagrecimento.
