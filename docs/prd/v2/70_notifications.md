# Feature 5: Push Notifications

## Visão Geral

Implementar sistema de lembretes via notificações do navegador para ajudar o usuário a manter consistência nos registros de alimentação e peso.

## Requisitos

### Infraestrutura
- [ ] Service Worker para PWA
- [ ] Solicitar permissão de notificação
- [ ] Registrar subscription no navegador

### Configuração (UI)
- [ ] Tela de configuração no Profile
- [ ] Toggle on/off para notificações
- [ ] Horários personalizáveis para lembretes
- [ ] Tipos de lembretes (refeições, peso, treino)

### Disparo
- [ ] Agendamento local (sem servidor)
- [ ] Conteúdo contextual baseado no horário
- [ ] Deep link para Chat ao clicar

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Fit Track PWA                         │
├─────────────────────────────────────────────────────────┤
│  Profile Page                                            │
│  ├── NotificationSettings (toggle, horários)            │
│  └── Salvar config no localStorage                      │
├─────────────────────────────────────────────────────────┤
│  Service Worker (public/sw.js)                          │
│  ├── Recebe mensagens da página                         │
│  ├── Agenda notificações via setTimeout/setInterval     │
│  └── Mostra notificação nativa                          │
├─────────────────────────────────────────────────────────┤
│  lib/notifications.ts                                   │
│  ├── requestPermission()                                │
│  ├── scheduleReminder(type, time)                       │
│  ├── cancelReminder(type)                               │
│  └── getNotificationConfig()                            │
└─────────────────────────────────────────────────────────┘
```

## Tipos de Lembretes

| Tipo | Horário Padrão | Mensagem |
|------|----------------|----------|
| Café da manhã | 08:00 | "Bom dia! O que você comeu no café?" |
| Almoço | 12:30 | "Hora do almoço! Registre sua refeição" |
| Jantar | 19:30 | "Boa noite! Como foi o jantar?" |
| Peso | 07:00 (seg) | "Nova semana! Que tal pesar hoje?" |

## Storage

```typescript
interface NotificationConfig {
  enabled: boolean;
  breakfast: { enabled: boolean; time: string }; // "08:00"
  lunch: { enabled: boolean; time: string };
  dinner: { enabled: boolean; time: string };
  weight: { enabled: boolean; day: number; time: string }; // day: 0-6 (dom-sab)
}
```

## Fluxo de Ativação

1. Usuário vai em Profile → Notificações
2. Ativa o toggle principal
3. Browser pede permissão
4. Se permitido, registra Service Worker
5. Configura horários
6. SW agenda notificações

## Limitações

- **Só funciona com app aberto em background** (limitação de PWA sem servidor)
- Alternativa: usar `Notification API` + `setInterval` na página
- Para notificações robustas, seria necessário backend com Web Push

## Implementação Simplificada (MVP)

Para MVP, usar apenas:
1. `Notification API` do navegador
2. `localStorage` para config
3. `setInterval` para verificar horários quando app está aberto
4. Quando usuário abre o app, verifica se "perdeu" algum lembrete

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `lib/notifications.ts` | Lógica de notificações |
| `components/profile/NotificationSettings.tsx` | UI de configuração |
| `hooks/useNotifications.ts` | Hook para gerenciar notificações |

## Dependências

Nenhuma dependência externa necessária para MVP (usa APIs nativas do browser).
