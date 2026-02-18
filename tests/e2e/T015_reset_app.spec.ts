import { test, expect } from "@playwright/test";

/**
 * T015: Reset App
 *
 * Testa o fluxo de reset completo do app na página de perfil.
 * Verifica modal de confirmação, cancelamento e reset efetivo.
 */
test.describe("T015: Reset App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Reset",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 80,
          bmr: 1775,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
      localStorage.setItem(
        "fittrack_meals",
        JSON.stringify([
          {
            id: "m1",
            type: "almoco",
            items: [{ name: "Arroz", calories: 200 }],
            totalCalories: 200,
            date: new Date().toISOString(),
          },
        ])
      );
      localStorage.setItem(
        "fittrack_weight_logs",
        JSON.stringify([
          { id: "w1", weight: 80, date: new Date().toISOString() },
        ])
      );
      localStorage.setItem(
        "fittrack_chat_messages",
        JSON.stringify([
          {
            id: "c1",
            role: "user",
            content: "Almocei arroz",
            timestamp: new Date().toISOString(),
          },
        ])
      );
    });
    await page.goto("/profile");
  });

  test("deve exibir botão de resetar app", async ({ page }) => {
    // Expande seção Avançado
    await page.getByText("Avançado").click();

    await expect(page.getByText("Resetar app")).toBeVisible();
    await expect(
      page.getByText(/apaga tudo.*volta ao in[ií]cio/i)
    ).toBeVisible();
  });

  test("deve abrir modal de confirmação ao clicar em resetar", async ({
    page,
  }) => {
    // Expande seção Avançado
    await page.getByText("Avançado").click();

    await page.getByText("Resetar app").click();

    // Modal deve aparecer
    await expect(page.getByText("Resetar tudo?")).toBeVisible({
      timeout: 3000,
    });
    await expect(
      page.getByText(/apagar todos os dados|estado inicial/i)
    ).toBeVisible();
  });

  test("deve fechar modal ao clicar em cancelar", async ({ page }) => {
    // Expande seção Avançado
    await page.getByText("Avançado").click();

    await page.getByText("Resetar app").click();

    // Aguarda modal
    await expect(page.getByText("Resetar tudo?")).toBeVisible({
      timeout: 3000,
    });

    // Clica em Cancelar
    await page.getByRole("button", { name: /cancelar/i }).click();

    // Modal deve fechar
    await expect(page.getByText("Resetar tudo?")).not.toBeVisible({
      timeout: 3000,
    });

    // Dados devem estar intactos
    const profile = await page.evaluate(() =>
      localStorage.getItem("fittrack_user_profile")
    );
    expect(profile).not.toBeNull();
  });

  test("deve manter dados após cancelar reset", async ({ page }) => {
    // Expande seção Avançado
    await page.getByText("Avançado").click();

    await page.getByText("Resetar app").click();
    await expect(page.getByText("Resetar tudo?")).toBeVisible({
      timeout: 3000,
    });
    await page.getByRole("button", { name: /cancelar/i }).click();

    // Verifica que todos os dados estão intactos
    const meals = await page.evaluate(() =>
      localStorage.getItem("fittrack_meals")
    );
    const weight = await page.evaluate(() =>
      localStorage.getItem("fittrack_weight_logs")
    );
    const messages = await page.evaluate(() =>
      localStorage.getItem("fittrack_chat_messages")
    );

    expect(meals).not.toBeNull();
    expect(weight).not.toBeNull();
    expect(messages).not.toBeNull();
  });

  test("deve limpar todos os dados e redirecionar ao confirmar reset", async ({
    page,
  }) => {
    // Expande seção Avançado
    await page.getByText("Avançado").click();

    await page.getByText("Resetar app").click();

    // Aguarda modal
    await expect(page.getByText("Resetar tudo?")).toBeVisible({
      timeout: 3000,
    });

    // Clica no botão de reset (vermelho)
    const resetConfirm = page.getByRole("button", { name: /^resetar$/i });
    await resetConfirm.click();

    // Deve redirecionar para onboarding
    await expect(page).toHaveURL(/onboarding/, { timeout: 5000 });

    // Todos os dados devem ter sido limpos
    const profile = await page.evaluate(() =>
      localStorage.getItem("fittrack_user_profile")
    );
    const onboarding = await page.evaluate(() =>
      localStorage.getItem("fittrack_onboarding_complete")
    );
    const meals = await page.evaluate(() =>
      localStorage.getItem("fittrack_meals")
    );
    const weight = await page.evaluate(() =>
      localStorage.getItem("fittrack_weight_logs")
    );
    const messages = await page.evaluate(() =>
      localStorage.getItem("fittrack_chat_messages")
    );

    expect(profile).toBeNull();
    expect(onboarding).toBeNull();
    expect(meals).toBeNull();
    expect(weight).toBeNull();
    expect(messages).toBeNull();
  });
});
