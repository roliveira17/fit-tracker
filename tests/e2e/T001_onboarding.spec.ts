import { test, expect } from "@playwright/test";

/**
 * T001: Onboarding Completo
 *
 * Testa o fluxo completo de onboarding:
 * 1. Boas-vindas → 2. Tour (4 steps) → 3. Perfil → 4. Chat
 */
test.describe("T001: Onboarding Completo", () => {
  test("deve completar onboarding e chegar no chat", async ({ page }) => {
    // ========================================
    // ETAPA 0: Limpa localStorage
    // ========================================
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // ========================================
    // ETAPA 1: Acesso inicial - redireciona para onboarding
    // ========================================
    await page.goto("/");
    await expect(page).toHaveURL(/onboarding/);

    // ========================================
    // ETAPA 2: Tela de boas-vindas
    // ========================================
    // Verifica título
    await expect(page.getByText("Fit Track")).toBeVisible();

    // Verifica botões de login
    await expect(page.getByText("Continuar com Apple")).toBeVisible();
    await expect(page.getByText("Continuar com Google")).toBeVisible();
    await expect(page.getByText("Continuar sem login →")).toBeVisible();

    // Clica em "Continuar sem login"
    await page.getByText("Continuar sem login →").click();

    // Verifica navegação para tour
    await expect(page).toHaveURL(/onboarding\/tour/);

    // ========================================
    // ETAPA 3: Tour de features (4 passos)
    // ========================================
    // Step 1
    await expect(page.getByText("Todos os seus dados, sem ruído")).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();

    // Step 2
    await expect(page.getByText("Veja o progresso que realmente importa")).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();

    // Step 3
    await expect(page.getByText("Um coach direto, baseado em dados")).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();

    // Step 4 (último - botão muda para "Começar")
    await expect(page.getByText("Você no controle")).toBeVisible();
    await expect(page.getByRole("button", { name: "Começar" })).toBeVisible();
    await page.getByRole("button", { name: "Começar" }).click();

    // Verifica navegação para perfil
    await expect(page).toHaveURL(/onboarding\/profile/);

    // ========================================
    // ETAPA 4: Formulário de perfil
    // ========================================
    // Verifica título
    await expect(page.getByText("Perfil Básico")).toBeVisible();

    // Preenche nome
    await page.locator("#name").fill("Teste QA");

    // Seleciona gênero
    await page.locator("#gender").selectOption("masculino");

    // Preenche data de nascimento (1990-05-15 = ~34 anos)
    await page.locator("#birthDate").fill("1990-05-15");

    // Preenche altura
    await page.locator("#height").fill("175");

    // Preenche peso
    await page.locator("#weight").fill("80");

    // Clica em Continuar
    await page.getByRole("button", { name: "Continuar" }).click();

    // ========================================
    // ETAPA 5: Verificação final
    // ========================================
    // Aguarda navegação para chat
    await expect(page).toHaveURL(/chat/, { timeout: 5000 });

    // Verifica localStorage
    const profile = await page.evaluate(() => {
      return localStorage.getItem("fittrack_user_profile");
    });
    expect(profile).not.toBeNull();

    const profileData = JSON.parse(profile!);
    expect(profileData.name).toBe("Teste QA");
    expect(profileData.gender).toBe("masculino");
    expect(profileData.height).toBe(175);
    expect(profileData.weight).toBe(80);
    expect(profileData.bmr).toBeGreaterThan(1700); // BMR esperado ~1775

    // Verifica flag de onboarding
    const onboardingComplete = await page.evaluate(() => {
      return localStorage.getItem("fittrack_onboarding_complete");
    });
    expect(onboardingComplete).toBe("true");
  });

  test("deve mostrar erros de validação com campos vazios", async ({ page }) => {
    // Limpa localStorage e navega para perfil
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/onboarding/profile");

    // Tenta submeter sem preencher
    await page.getByRole("button", { name: "Continuar" }).click();

    // Verifica mensagens de erro
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Selecione uma opção")).toBeVisible();
    await expect(page.getByText("Data de nascimento é obrigatória")).toBeVisible();
    await expect(page.getByText("Altura é obrigatória")).toBeVisible();
    await expect(page.getByText("Peso é obrigatório")).toBeVisible();

    // Verifica que não navegou
    await expect(page).toHaveURL(/onboarding\/profile/);
  });

  test("deve validar idade mínima de 13 anos", async ({ page }) => {
    // Limpa localStorage e navega para perfil
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/onboarding/profile");

    // Preenche com data recente (criança)
    await page.locator("#name").fill("Criança");
    await page.locator("#gender").selectOption("masculino");
    await page.locator("#birthDate").fill("2020-01-01"); // ~6 anos
    await page.locator("#height").fill("150");
    await page.locator("#weight").fill("40");

    await page.getByRole("button", { name: "Continuar" }).click();

    // Verifica erro de idade
    await expect(page.getByText("Idade mínima é 13 anos")).toBeVisible();
  });
});
