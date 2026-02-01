import { test, expect } from "@playwright/test";

/**
 * T002: Navegação Principal
 *
 * Testa a BottomNav e navegação entre telas principais:
 * Home ↔ Insights ↔ Import ↔ Profile
 * FAB → Chat
 */
test.describe("T002: Navegação Principal", () => {
  // Setup: completa onboarding antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Simula usuário já cadastrado via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Nav",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 80,
          bmr: 1775,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
    });

    // Vai para home
    await page.goto("/home");
    await expect(page).toHaveURL(/home/);
  });

  test("deve navegar entre todas as telas via BottomNav", async ({ page }) => {
    // ========================================
    // Verifica que está na Home
    // ========================================
    await expect(page.locator('a[href="/home"]').first()).toBeVisible();

    // ========================================
    // Home → Insights
    // ========================================
    await page.locator('a[href="/insights"]').first().click({ force: true });
    await expect(page).toHaveURL(/insights/);

    // ========================================
    // Insights → Import/Diário
    // ========================================
    await page.locator('a[href="/import"]').first().click({ force: true });
    await expect(page).toHaveURL(/import/);

    // ========================================
    // Import → Profile
    // ========================================
    await page.locator('a[href="/profile"]').first().click({ force: true });
    await expect(page).toHaveURL(/profile/);

    // ========================================
    // Profile → Home
    // ========================================
    await page.locator('a[href="/home"]').first().click({ force: true });
    await expect(page).toHaveURL(/home/);
  });

  test("deve destacar item ativo na BottomNav", async ({ page }) => {
    // Na Home, verifica que link Home tem cor primária
    const homeLink = page.locator('a[href="/home"]').first();
    await expect(homeLink).toHaveClass(/text-primary/);

    // Navega para Insights
    await page.locator('a[href="/insights"]').first().click({ force: true });
    await expect(page).toHaveURL(/insights/);

    // Verifica que Insights agora está ativo
    const insightsLink = page.locator('a[href="/insights"]').first();
    await expect(insightsLink).toHaveClass(/text-primary/);
  });

  test("FAB central deve navegar para Chat", async ({ page }) => {
    // Na Home, o FAB é um componente separado com texto "Fit AI"
    // ou ícone "auto_awesome" ou "add" dependendo da página
    const fabFitAI = page.locator("button").filter({ hasText: "Fit AI" });
    const fabAdd = page.locator("button").filter({ hasText: "add" });

    // Tenta clicar no FAB disponível (Fit AI na Home, add em outras telas)
    if (await fabFitAI.isVisible()) {
      await fabFitAI.click({ force: true });
    } else if (await fabAdd.first().isVisible()) {
      await fabAdd.first().click({ force: true });
    }

    // Verifica navegação para chat
    await expect(page).toHaveURL(/chat/);
  });

  test("deve manter navegação funcional após múltiplas transições", async ({
    page,
  }) => {
    // Navega várias vezes para garantir estabilidade
    const routes = ["/insights", "/import", "/profile", "/home", "/insights"];

    for (const route of routes) {
      await page.locator(`a[href="${route}"]`).first().click({ force: true });
      await expect(page).toHaveURL(new RegExp(route.slice(1)));
    }
  });
});
