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
    // ETAPA 4: Formulário de perfil (design Stitch)
    // ========================================
    // Verifica título
    await expect(page.getByText("Configuração de Perfil")).toBeVisible();

    // Preenche nome
    await page.getByPlaceholder("Seu nome").fill("Teste QA");

    // Seleciona gênero (radio card)
    await page.getByText("Masculino").click();

    // Preenche peso
    await page.getByPlaceholder("0").first().fill("80");

    // Preenche altura
    await page.getByPlaceholder("0").nth(1).fill("175");

    // Idade: stepper começa em 25, incrementar para 34 (9 cliques)
    // Ou simplesmente verificar que o stepper funciona (default 25 é válido)

    // Clica em "Começar Jornada"
    await page.getByRole("button", { name: /Começar Jornada/ }).click();

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
    expect(profileData.bmr).toBeGreaterThan(1500);

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

    // Tenta submeter sem preencher (nome e gênero vazios, peso/altura vazios)
    await page.getByRole("button", { name: /Começar Jornada/ }).click();

    // Verifica mensagens de erro
    await expect(page.getByText("Nome é obrigatório")).toBeVisible();
    await expect(page.getByText("Selecione uma opção")).toBeVisible();
    await expect(page.getByText("Obrigatório").first()).toBeVisible();

    // Verifica que não navegou
    await expect(page).toHaveURL(/onboarding\/profile/);
  });

  test("deve validar idade mínima de 13 anos", async ({ page }) => {
    // Limpa localStorage e navega para perfil
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/onboarding/profile");

    // Preenche campos válidos
    await page.getByPlaceholder("Seu nome").fill("Criança");
    await page.getByText("Masculino").click();
    await page.getByPlaceholder("0").first().fill("40");
    await page.getByPlaceholder("0").nth(1).fill("150");

    // Decrementa idade até 12 (abaixo do mínimo)
    // Default é 25, o stepper bloqueia em 13, mas vamos testar o limite
    // Clicar - 13 vezes para ir de 25 → 12 (stepper bloqueia em 13)
    const decrementButton = page.getByRole("button").filter({ has: page.locator('text="remove"') });
    for (let i = 0; i < 13; i++) {
      await decrementButton.click();
    }

    // Stepper deveria parar em 13 (não vai a 12)
    await expect(page.getByText("13")).toBeVisible();

    await page.getByRole("button", { name: /Começar Jornada/ }).click();

    // Com idade 13, deve passar validação e navegar
    await expect(page).toHaveURL(/chat/, { timeout: 5000 });
  });
});
