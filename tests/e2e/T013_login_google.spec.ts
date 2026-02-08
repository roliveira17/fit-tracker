import { test, expect } from "@playwright/test";

/**
 * T013: Login Google
 *
 * Testa a página de login e os elementos de autenticação.
 * Nota: OAuth real não é testado (requer credenciais),
 * mas valida UI, botões e fluxo "continuar sem conta".
 */
test.describe("T013: Login / Autenticação", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("deve exibir página de login com logo e título", async ({ page }) => {
    await page.goto("/login");

    // Verifica logo e título
    await expect(page.getByText("Fit Track")).toBeVisible();
    await expect(
      page.getByText("Seu corpo, explicado por dados reais")
    ).toBeVisible();
  });

  test("deve exibir botão de login com Google", async ({ page }) => {
    await page.goto("/login");

    const googleButton = page.getByText("Continuar com Google");
    await expect(googleButton).toBeVisible();
  });

  test("deve exibir botão de login com Apple", async ({ page }) => {
    await page.goto("/login");

    const appleButton = page.getByText("Continuar com Apple");
    await expect(appleButton).toBeVisible();
  });

  test("deve exibir opção de continuar sem conta", async ({ page }) => {
    await page.goto("/login");

    const skipButton = page.getByText("Continuar sem conta");
    await expect(skipButton).toBeVisible();
  });

  test("deve navegar ao clicar em 'Continuar sem conta'", async ({
    page,
  }) => {
    await page.goto("/login");

    // Aguarda botão estar visível e clica
    const skipButton = page.getByText("Continuar sem conta");
    await expect(skipButton).toBeVisible({ timeout: 5000 });
    await skipButton.click();

    // Sem onboarding completo, redireciona para /onboarding (ou /home se já fez)
    await expect(page).toHaveURL(/home|onboarding/, { timeout: 5000 });
  });

  test("deve exibir mensagem informativa sobre sincronização", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByText(/dados.*sincronizados.*nuvem|dispon[ií]veis.*dispositivo/i)
    ).toBeVisible();
  });

  test("deve exibir erro quando URL contém parâmetro de erro", async ({
    page,
  }) => {
    await page.goto("/login?error=access_denied&error_description=User+cancelled");

    // Deve mostrar mensagem de erro
    await expect(
      page.getByText(/access.denied|cancelled/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("deve redirecionar para onboarding ao entrar sem login desde tela de boas-vindas", async ({
    page,
  }) => {
    // Acessa raiz sem localStorage → vai para onboarding
    await page.goto("/");
    await expect(page).toHaveURL(/onboarding/);

    // Clica em "Continuar sem login" no onboarding
    const skipLogin = page.getByText("Continuar sem login →");
    if (await skipLogin.isVisible().catch(() => false)) {
      await skipLogin.click();
      await expect(page).toHaveURL(/onboarding\/tour/, { timeout: 5000 });
    }
  });
});
