import { test, expect } from "@playwright/test";

/**
 * T003: Chat Básico
 *
 * Testa o funcionamento básico do chat:
 * - Estado inicial com sugestões
 * - Envio de mensagem via input
 * - Envio de mensagem via chip de sugestão
 * - Exibição de mensagens e respostas
 */
test.describe("T003: Chat Básico", () => {
  // Setup: configura usuário antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Simula usuário já cadastrado via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Chat",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 80,
          bmr: 1775,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
      // Limpa mensagens anteriores para garantir estado inicial
      localStorage.removeItem("fittrack_chat_messages");
    });

    // Vai para chat
    await page.goto("/chat");
    await expect(page).toHaveURL(/chat/);
  });

  test("deve exibir estado inicial com saudação e sugestões", async ({
    page,
  }) => {
    // Verifica saudação personalizada
    await expect(page.getByText(/Ola, Teste/i)).toBeVisible();

    // Verifica texto de orientação
    await expect(
      page.getByText(/pode me dizer o que voce comeu/i)
    ).toBeVisible();

    // Verifica chips de sugestões
    await expect(page.getByText("Almocei arroz e frango")).toBeVisible();
    await expect(page.getByText("Fiz 30min de esteira")).toBeVisible();
    await expect(page.getByText("Qual meu BMR?")).toBeVisible();
    await expect(page.getByText("Registrar peso")).toBeVisible();

    // Verifica input de mensagem
    const input = page.locator('textarea[placeholder*="Digite"]');
    await expect(input).toBeVisible();
  });

  test("deve enviar mensagem via input e receber resposta", async ({
    page,
  }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Digita mensagem no input
    const input = page.locator('textarea[placeholder*="Digite"]');
    await input.fill("Qual meu BMR?");

    // O botão muda de "mic" para "send" quando há texto
    // Procura o botão que contém o ícone "send"
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Verifica mensagem do usuário aparece
    await expect(page.getByText("Qual meu BMR?").first()).toBeVisible();

    // Aguarda resposta da IA (pode demorar)
    // Verifica que alguma resposta apareceu (mensagem da IA)
    await expect(
      page.locator('[class*="bg-surface"]').filter({ hasText: /BMR|1775|kcal/i })
    ).toBeVisible({ timeout: 30000 });
  });

  test("deve enviar mensagem via chip de sugestão", async ({ page }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Clica no chip de sugestão "Qual meu BMR?"
    await page.getByText("Qual meu BMR?").click();

    // Verifica mensagem do usuário aparece
    await expect(page.getByText("Qual meu BMR?").first()).toBeVisible();

    // Aguarda resposta da IA
    await expect(
      page.locator('[class*="bg-surface"]').filter({ hasText: /BMR|1775|kcal/i })
    ).toBeVisible({ timeout: 30000 });
  });

  test("deve manter histórico de mensagens visível", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia primeira mensagem via chip para garantir envio
    await page.getByText("Qual meu BMR?").click();

    // Aguarda resposta (alguma mensagem da IA)
    await expect(
      page.locator('[class*="bg-surface"]').filter({ hasText: /BMR|1775|kcal/i })
    ).toBeVisible({ timeout: 30000 });

    // Verifica botão "Limpar histórico" aparece quando há mensagens
    await expect(page.getByText(/limpar historico/i)).toBeVisible();

    // Verifica que a mensagem "Hoje" aparece (indicador de data)
    await expect(page.getByText("Hoje")).toBeVisible();
  });

  test("botão mostra microfone quando input está vazio", async ({ page }) => {
    // O input está vazio por padrão
    const input = page.locator('textarea[placeholder*="Digite"]');
    await expect(input).toHaveValue("");

    // Quando vazio, o botão mostra "mic" (microfone), não "send"
    const micButton = page.locator("button").filter({ hasText: "mic" });
    await expect(micButton).toBeVisible();

    // Não deve mostrar botão de enviar
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).not.toBeVisible();

    // Deve continuar no estado inicial (com sugestões visíveis)
    await expect(page.getByText("Almocei arroz e frango")).toBeVisible();
  });
});
