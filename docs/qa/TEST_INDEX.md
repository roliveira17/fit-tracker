# Índice de Testes - Fit Track

> Documento de controle para todos os testes do projeto.
> Atualizar status após cada execução.

---

## Resumo

| Prioridade | Total | Pendente | Implementado | Passando |
|------------|-------|----------|--------------|----------|
| P0 - Críticos | 4 | 0 | 0 | 4 |
| P1 - Core | 4 | 0 | 0 | 4 |
| P2 - Avançados | 4 | 0 | 4 | 0 |
| P3 - Extras | 3 | 0 | 3 | 0 |
| **TOTAL** | **15** | **0** | **7** | **8** |

---

## P0 - Testes Críticos

| ID | Nome | Status | Doc | Código | Última Execução |
|----|------|--------|-----|--------|-----------------|
| T001 | Onboarding Completo | **PASS** | [doc](tests/T001_onboarding.md) | [spec](../../tests/e2e/T001_onboarding.spec.ts) | 2026-01-22 |
| T002 | Navegação Principal | **PASS** | [doc](tests/T002_navegacao.md) | [spec](../../tests/e2e/T002_navegacao.spec.ts) | 2026-01-22 |
| T003 | Chat Básico | **PASS** | [doc](tests/T003_chat_basico.md) | [spec](../../tests/e2e/T003_chat_basico.spec.ts) | 2026-01-22 |
| T004 | Registro Refeição | **PASS** | [doc](tests/T004_registro_refeicao.md) | [spec](../../tests/e2e/T004_registro_refeicao.spec.ts) | 2026-01-22 |

---

## P1 - Testes Core

| ID | Nome | Status | Doc | Código | Última Execução |
|----|------|--------|-----|--------|-----------------|
| T005 | Registro Peso | **PASS** | [doc](tests/T005_registro_peso.md) | [spec](../../tests/e2e/T005_registro_peso.spec.ts) | 2026-01-22 |
| T006 | Registro Treino | **PASS** | [doc](tests/T006_registro_treino.md) | [spec](../../tests/e2e/T006_registro_treino.spec.ts) | 2026-01-22 |
| T007 | Visualizar Insights | **PASS** | [doc](tests/T007_insights.md) | [spec](../../tests/e2e/T007_insights.spec.ts) | 2026-01-22 |
| T008 | Editar Perfil | **PASS** | [doc](tests/T008_editar_perfil.md) | [spec](../../tests/e2e/T008_editar_perfil.spec.ts) | 2026-01-22 |

---

## P2 - Testes Avançados

| ID | Nome | Status | Doc | Código | Última Execução |
|----|------|--------|-----|--------|-----------------|
| T009 | Barcode Scanner | implementado | - | [spec](../../tests/e2e/T009_barcode_scanner.spec.ts) | - |
| T010 | Chat com Foto | implementado | - | [spec](../../tests/e2e/T010_chat_foto.spec.ts) | - |
| T011 | Importar Apple Health | implementado | - | [spec](../../tests/e2e/T011_import_apple_health.spec.ts) | - |
| T012 | Exportar Dados | implementado | - | [spec](../../tests/e2e/T012_exportar_dados.spec.ts) | - |

---

## P3 - Testes Extras

| ID | Nome | Status | Doc | Código | Última Execução |
|----|------|--------|-----|--------|-----------------|
| T013 | Login / Autenticação | implementado | - | [spec](../../tests/e2e/T013_login_google.spec.ts) | - |
| T014 | Notificações | implementado | - | [spec](../../tests/e2e/T014_notificacoes.spec.ts) | - |
| T015 | Reset App | implementado | - | [spec](../../tests/e2e/T015_reset_app.spec.ts) | - |

---

## Bugs Encontrados

| # | Teste | Descrição | Severidade | Status |
|---|-------|-----------|------------|--------|
| - | - | Nenhum bug registrado | - | - |

---

## Como Executar

```bash
# Executar todos os testes
npx playwright test

# Executar um teste específico
npx playwright test tests/e2e/T001_onboarding.spec.ts

# Executar com interface visual
npx playwright test --headed

# Executar com debug
npx playwright test --debug
```

---

## Histórico de Execuções

| Data | Testes | Passando | Falhando | Notas |
|------|--------|----------|----------|-------|
| 2026-01-22 | T005-T008 | 24/24 | 0 | Testes P1 implementados: peso, treino, insights, perfil |
| 2026-01-22 | T004 | 5/5 | 0 | Registro refeição, localStorage, Home OK |
| 2026-01-22 | T003 | 5/5 | 0 | Chat básico, envio mensagem, chips OK |
| 2026-01-22 | T002 | 4/4 | 0 | Navegação BottomNav + FAB OK |
| 2026-01-22 | T001 | 3/3 | 0 | Onboarding completo, validações OK |
