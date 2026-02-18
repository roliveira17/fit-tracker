import { test, expect } from "@playwright/test";

/**
 * T004: Registro de Refeição
 *
 * Testa o registro de refeições via chat:
 * - Envio de refeição com quantidades
 * - Verificação de resposta com confirmação
 * - Persistência no localStorage
 * - Exibição na Home
 */
test.describe("T004: Registro de Refeição", () => {
  // Setup: configura usuário antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Simula usuário já cadastrado via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Refeicao",
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
      localStorage.removeItem("fittrack_meals");
    });

    // Vai para chat
    await page.goto("/chat");
    await expect(page).toHaveURL(/chat/);
  });

  test("deve registrar refeição com quantidades via chat", async ({ page }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Digita mensagem com quantidades específicas (mais provável de ser registrada diretamente)
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Almocei 150g de arroz branco e 200g de frango grelhado");

    // Clica no botão enviar
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Aguarda resposta da IA com card Stitch de confirmação (ex: "Almoço Registrado")
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica que a resposta contém informações nutricionais
    await expect(page.getByText(/kcal/i).first()).toBeVisible();
  });

  test("deve persistir refeição no localStorage", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia refeição com quantidades específicas
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Comi 200g de frango grelhado com 100g de batata doce");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação (card Stitch)
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica localStorage
    const meals = await page.evaluate(() => {
      const data = localStorage.getItem("fittrack_meals");
      return data ? JSON.parse(data) : null;
    });

    // Deve ter pelo menos uma refeição
    expect(meals).not.toBeNull();
    expect(Array.isArray(meals)).toBe(true);
    expect(meals.length).toBeGreaterThan(0);

    // Verifica estrutura da refeição
    const meal = meals[0];
    expect(meal).toHaveProperty("id");
    expect(meal).toHaveProperty("date");
    expect(meal).toHaveProperty("items");
    expect(meal).toHaveProperty("totalCalories");
    expect(meal).toHaveProperty("totalProtein");

    // Valores devem ser números positivos
    expect(meal.totalCalories).toBeGreaterThan(0);
    expect(meal.totalProtein).toBeGreaterThan(0);
  });

  test("deve registrar refeição com quantidades específicas", async ({
    page,
  }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Digita mensagem com quantidades específicas
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Comi 200g de frango grelhado com salada");

    // Clica no botão enviar
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Aguarda confirmação (card Stitch com título "X Registrado")
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica que a resposta menciona frango (usa first() para evitar múltiplos elementos)
    await expect(page.getByText(/frango/i).first()).toBeVisible();
  });

  test("deve exibir refeição na Home após registro", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(90000);

    // Registra refeição com quantidades
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Jantei 250g de salmão grelhado com legumes");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação (card Stitch)
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Navega para Home
    await page.locator('a[href="/home"]').first().click({ force: true });
    await expect(page).toHaveURL(/home/);

    // Aguarda carregamento da página
    await page.waitForLoadState("networkidle");

    // Verifica que há calorias registradas no resumo (valor > 0)
    await expect(page.getByText(/\d+\s*kcal/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("deve mostrar toast de confirmação após registro", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Registra refeição com quantidades específicas em gramas
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Café da manhã: 100g de ovos mexidos e 50g de pão integral");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda toast de confirmação "Refeição registrada!"
    await expect(page.getByText(/Refeição registrada/i).first()).toBeVisible({
      timeout: 30000,
    });
  });
});
