# Samples de Dados para Import

Esta pasta contém arquivos de exemplo para testar e desenvolver as funcionalidades de import do Fit Track.

## Arquivos

| Arquivo | Formato | Descrição |
|---------|---------|-----------|
| `apple_health_sample.xml` | XML | Exemplo do export do Apple Health |
| `hevy_sample.csv` | CSV | Exemplo do export do app Hevy |
| `glucose_sample.csv` | CSV | Exemplo de dados de glicemia (FreeStyle Libre) |

## Apple Health (`apple_health_sample.xml`)

Simula o arquivo `export.xml` que vem dentro do ZIP exportado pelo app Saúde do iPhone.

### Dados incluídos:
- **Peso**: 4 medições semanais (82.5kg → 80.5kg)
- **Body Fat**: 3 medições (22.5% → 21.8%)
- **Glicemia**: 8 medições em 2 dias (jejum, pós-prandial, etc)
- **Frequência cardíaca**: HR e resting HR
- **Treinos**: Corrida, musculação, HIIT, natação
- **Sono**: Noite completa com todos os estágios (deep, light, REM, awake)
- **Passos**: 2 dias

### Como usar:
```bash
# Para testar, crie um ZIP com o arquivo:
zip -j apple_health_test.zip docs/samples/apple_health_sample.xml
# Renomeie para export.xml dentro do ZIP
```

## Hevy (`hevy_sample.csv`)

Formato real do export CSV do app Hevy (app de musculação popular).

### Dados incluídos:
- **Push Day A**: Supino, supino inclinado, desenvolvimento, elevação lateral, tríceps
- **Pull Day A**: Barra fixa, remada, puxada, rosca direta, rosca martelo
- **Leg Day**: Agachamento, leg press, extensora, flexora, panturrilha
- **Push Day B**: Variação com halteres

### Formato das colunas:
```
title,start_time,end_time,description,exercise_title,superset_id,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
```

## Glicemia (`glucose_sample.csv`)

Formato simplificado para dados de monitores de glicose (FreeStyle Libre, Accu-Chek, etc).

### Dados incluídos:
- **8 dias** de medições manuais
- **Tipos**: jejum, pré-refeição, pós-refeição, antes de dormir
- **CGM**: Exemplo de leituras contínuas a cada 15 min

### Valores de referência (mg/dL):
| Situação | Normal | Pré-diabetes | Diabetes |
|----------|--------|--------------|----------|
| Jejum | 70-100 | 100-125 | >126 |
| Pós-refeição (2h) | <140 | 140-199 | >200 |
| Antes de dormir | 100-140 | - | - |

### Formato das colunas:
```
date,time,glucose_mg_dl,measurement_type,notes,device
```

## Uso para Desenvolvimento

### 1. Testar parsing
```typescript
import { parseAppleHealthXml } from "@/lib/import/appleHealthParser";
import fs from "fs";

const xml = fs.readFileSync("docs/samples/apple_health_sample.xml", "utf-8");
const data = parseAppleHealthXml(xml);
console.log(data.metadata);
```

### 2. Popular banco de testes
```sql
-- Inserir dados de peso do sample
INSERT INTO weight_logs (user_id, weight_kg, date, source)
VALUES
  ('USER_ID', 82.5, '2026-01-01', 'import_apple'),
  ('USER_ID', 81.8, '2026-01-08', 'import_apple'),
  ('USER_ID', 81.2, '2026-01-15', 'import_apple'),
  ('USER_ID', 80.5, '2026-01-22', 'import_apple');
```

### 3. Testar AI com contexto
Os samples fornecem dados realistas para testar como a AI responde a perguntas como:
- "Como está minha glicemia essa semana?"
- "Quantos treinos fiz nos últimos 7 dias?"
- "Meu peso está diminuindo?"

## Notas

- Todos os dados são fictícios e representam um usuário saudável em processo de emagrecimento
- Datas são de janeiro de 2026 para facilitar testes
- Os valores de glicemia mostram padrões comuns (pico pós-prandial, dawn phenomenon)
