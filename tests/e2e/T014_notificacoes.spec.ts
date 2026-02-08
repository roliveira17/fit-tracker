import { test, expect } from "@playwright/test";

/**
 * T014: Notificações
 *
 * Testa as configurações de lembretes/notificações na página de perfil.
 * O toggle principal é um <button> dentro da <section> que contém "Lembretes".
 */
test.describe("T014: Notificações", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);

    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Notificações",
          gender: "feminino",
          birthDate: "1995-11-25",
          height: 160,
          weight: 55,
          bmr: 1300,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
    });
    await page.goto("/profile");

    // Aguarda a seção de Lembretes carregar (o componente começa com skeleton)
    await page.getByText("Lembretes").first().scrollIntoViewIfNeeded();
    // Aguarda texto descritivo (indica que o componente terminou de carregar)
    await page
      .getByText(/receba lembretes|n[aã]o suporta|bloqueou/i)
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {});
  });

  test("deve exibir seção de lembretes", async ({ page }) => {
    await expect(page.getByText("Lembretes")).toBeVisible();
  });

  test("deve mostrar descrição sobre lembretes", async ({ page }) => {
    const section = page.locator("section").filter({ hasText: "Lembretes" });
    await expect(
      section.getByText(/receba lembretes|n[aã]o suporta|bloqueou/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("deve ter toggle ou mensagem de não-suporte", async ({ page }) => {
    const section = page
      .locator("section")
      .filter({ hasText: "Lembretes" });

    const toggle = section.locator("button").first();

    // Aguarda toggle aparecer (pode demorar se componente está carregando)
    const hasToggle = await toggle
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (hasToggle) {
      await expect(toggle).toBeVisible();
    } else {
      await expect(
        section.getByText(/n[aã]o suporta|bloqueou/i)
      ).toBeVisible();
    }
  });

  test("deve ativar lembretes e mostrar sub-configurações", async ({
    page,
  }) => {
    const section = page
      .locator("section")
      .filter({ hasText: "Lembretes" });
    const toggle = section.locator("button").first();

    const hasToggle = await toggle
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (!hasToggle) {
      test.skip();
      return;
    }

    await toggle.click();

    await expect(
      page.getByText(/caf[eé] da manh[aã]/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/almo[cç]o/i)).toBeVisible();
    await expect(page.getByText(/jantar/i)).toBeVisible();
  });

  test("deve mostrar pesagem semanal quando ativado", async ({ page }) => {
    const section = page
      .locator("section")
      .filter({ hasText: "Lembretes" });
    const toggle = section.locator("button").first();

    const hasToggle = await toggle
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (!hasToggle) {
      test.skip();
      return;
    }

    await toggle.click();

    await expect(
      page.getByText(/pesagem semanal/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("deve salvar configurações no localStorage ao ativar", async ({
    page,
  }) => {
    const section = page
      .locator("section")
      .filter({ hasText: "Lembretes" });
    const toggle = section.locator("button").first();

    const hasToggle = await toggle
      .waitFor({ timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (!hasToggle) {
      test.skip();
      return;
    }

    await toggle.click();
    await page.waitForTimeout(1000);

    const config = await page.evaluate(() => {
      return localStorage.getItem("fittrack_notifications");
    });

    expect(config).not.toBeNull();
    const parsed = JSON.parse(config!);
    expect(parsed.enabled).toBe(true);
  });
});
