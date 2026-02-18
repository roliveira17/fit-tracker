import { test, expect } from "@playwright/test";

/**
 * T003: Chat Básico
 *
 * Testa o funcionamento básico do chat (design Stitch):
 * - Estado inicial com sugestões em grid
 * - Envio de mensagem via input
 * - Envio de mensagem via card de sugestão
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

  test("deve exibir estado inicial com sugestões em grid", async ({
    page,
  }) => {
    // Verifica cards de sugestão (design Stitch — grid 2 colunas)
    await expect(
      page.getByText(/equil[ií]brio nutricional/i)
    ).toBeVisible();
    await expect(
      page.getByText(/treino r[aá]pido/i)
    ).toBeVisible();

    // Verifica input de mensagem (placeholder Stitch)
    const input = page.locator('textarea[placeholder*="Ask"]');
    await expect(input).toBeVisible();
  });

  test("deve enviar mensagem via input e receber resposta", async ({
    page,
  }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Digita mensagem no input
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Qual meu BMR?");

    // O botão muda de "mic" para "send" quando há texto
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Verifica mensagem do usuário aparece
    await expect(page.getByText("Qual meu BMR?").first()).toBeVisible();

    // Aguarda resposta da IA (pode demorar)
    await expect(
      page.locator("div").filter({ hasText: /BMR|1775|kcal/i }).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("deve enviar mensagem via card de sugestão", async ({ page }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Clica no card de sugestão de equilíbrio nutricional
    await page.getByText(/equil[ií]brio nutricional/i).click();

    // Aguarda resposta da IA
    await expect(
      page.locator("div").filter({ hasText: /nutri|calor|prote|macro/i }).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("deve manter histórico de mensagens visível", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Clica no card de sugestão
    await page.getByText(/equil[ií]brio nutricional/i).click();

    // Aguarda resposta da IA (alguma mensagem aparece)
    await expect(
      page.locator("div").filter({ hasText: /nutri|calor|prote|macro/i }).first()
    ).toBeVisible({ timeout: 30000 });

    // Verifica que o botão de ações (more_horiz) aparece quando há mensagens
    await expect(
      page.locator("button").filter({ hasText: "more_horiz" })
    ).toBeVisible();
  });

  test("botão mostra microfone quando input está vazio", async ({ page }) => {
    // O input está vazio por padrão
    const input = page.locator('textarea[placeholder*="Ask"]');
    await expect(input).toHaveValue("");

    // Quando vazio, o botão mostra "mic" (microfone), não "send"
    const micButton = page.locator("button").filter({ hasText: "mic" });
    await expect(micButton).toBeVisible();

    // Não deve mostrar botão de enviar
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).not.toBeVisible();
  });
});
