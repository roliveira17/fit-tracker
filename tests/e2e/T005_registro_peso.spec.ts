import { test, expect } from "@playwright/test";

/**
 * T005: Registro de Peso
 *
 * Testa o registro de peso via chat:
 * - Envio de peso com "kg"
 * - Peso com vírgula (75,5)
 * - Peso contextual ("Estou com 75")
 * - Persistência no localStorage
 * - Toast de confirmação
 */
test.describe("T005: Registro de Peso", () => {
  // Setup: configura usuário antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Simula usuário já cadastrado via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Peso",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 80,
          bmr: 1775,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
      // Limpa dados anteriores
      localStorage.removeItem("fittrack_chat_messages");
      localStorage.removeItem("fittrack_weight_logs");
    });

    // Vai para chat
    await page.goto("/chat");
    await expect(page).toHaveURL(/chat/);
  });

  test("deve registrar peso com kg", async ({ page }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Digita mensagem de peso
    const input = page.locator('textarea[placeholder*="Digite"]');
    await input.fill("Meu peso é 75kg");

    // Clica no botão enviar
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Aguarda resposta da IA com confirmação de registro
    await expect(page.getByText(/✓ Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica que a resposta menciona o peso
    await expect(page.getByText(/75/i).first()).toBeVisible();
  });

  test("deve registrar peso com vírgula (75,5kg)", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia peso com vírgula
    const input = page.locator('textarea[placeholder*="Digite"]');
    await input.fill("Peso 75,5kg");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação
    await expect(page.getByText(/✓ Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica localStorage
    const weightLogs = await page.evaluate(() => {
      const data = localStorage.getItem("fittrack_weight_logs");
      return data ? JSON.parse(data) : null;
    });

    // Deve ter pelo menos um registro
    expect(weightLogs).not.toBeNull();
    expect(Array.isArray(weightLogs)).toBe(true);
    expect(weightLogs.length).toBeGreaterThan(0);

    // Verifica que converteu vírgula para ponto
    const lastLog = weightLogs[weightLogs.length - 1];
    expect(lastLog.weight).toBe(75.5);
  });

  test("deve registrar peso contextual (Estou com 80)", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia peso contextual
    const input = page.locator('textarea[placeholder*="Digite"]');
    await input.fill("Estou com 80");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação
    await expect(page.getByText(/✓ Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica localStorage
    const weightLogs = await page.evaluate(() => {
      const data = localStorage.getItem("fittrack_weight_logs");
      return data ? JSON.parse(data) : null;
    });

    expect(weightLogs).not.toBeNull();
    const lastLog = weightLogs[weightLogs.length - 1];
    expect(lastLog.weight).toBe(80);
  });

  test("deve persistir peso no localStorage com estrutura correta", async ({
    page,
  }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia peso
    const input = page.locator('textarea[placeholder*="Digite"]');
    await input.fill("Meu peso atual é 77.5kg");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação
    await expect(page.getByText(/✓ Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica localStorage
    const weightLogs = await page.evaluate(() => {
      const data = localStorage.getItem("fittrack_weight_logs");
      return data ? JSON.parse(data) : null;
    });

    // Deve ter pelo menos um registro
    expect(weightLogs).not.toBeNull();
    expect(Array.isArray(weightLogs)).toBe(true);
    expect(weightLogs.length).toBeGreaterThan(0);

    // Verifica estrutura do registro
    const log = weightLogs[0];
    expect(log).toHaveProperty("id");
    expect(log).toHaveProperty("weight");
    expect(log).toHaveProperty("date");
    expect(log).toHaveProperty("timestamp");
    expect(log).toHaveProperty("rawText");

    // Peso deve ser número válido
    expect(typeof log.weight).toBe("number");
    expect(log.weight).toBeGreaterThanOrEqual(30);
    expect(log.weight).toBeLessThanOrEqual(300);

    // ID deve seguir padrão
    expect(log.id).toMatch(/^weight_/);

    // Date deve ser formato YYYY-MM-DD
    expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("deve mostrar toast de confirmação após registro", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia peso
    const input = page.locator('textarea[placeholder*="Digite"]');
    await input.fill("Peso de hoje: 78kg");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda toast de confirmação "Peso registrado!"
    await expect(page.getByText(/Peso registrado/i)).toBeVisible({
      timeout: 30000,
    });
  });
});
