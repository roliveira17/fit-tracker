Rode os testes E2E e reporte o estado.

## 1. Executar todos os testes

```bash
npx playwright test
```

Se o dev server nao subir automaticamente, rode antes:
```bash
npm run dev
```

## 2. Se algum teste falhar

Para cada teste falhando:
1. Rode individualmente com debug: `npx playwright test tests/e2e/TXXX-nome.spec.ts --debug`
2. Identifique se eh falha de codigo ou falha de ambiente (timeout, porta, etc)
3. Leia o arquivo de teste para entender o que ele espera

## 3. Reportar resultado

Apresente uma tabela:

| # | Teste | Status | Observacao |
|---|-------|--------|------------|
| T001 | Onboarding | ✅/❌ | ... |
| ... | ... | ... | ... |

## 4. Testes pendentes (referencia)

Estes testes ainda nao existem (ver ROADMAP.md):
- T009: Chat com Audio (P2)
- T010: Chat com Foto (P2)
- T011: Importar Apple Health (P2)
- T012: Exportar Dados (P2)
- T013: Login Google (P3)
- T014: Notificacoes (P3)
- T015: Reset App (P3)

Se o usuario pedir, ofereça implementar o proximo teste pendente por prioridade.