import { test, expect } from "@playwright/test";

/**
 * T008: Editar Perfil
 *
 * Testa a edição de perfil do usuário:
 * - Visualizar dados do perfil
 * - Editar nome, peso, altura
 * - Validações de campos
 * - Recálculo de BMR
 * - Cancelar edição
 * - Persistência no localStorage
 */
test.describe("T008: Editar Perfil", () => {
  // Setup: configura usuário antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Simula usuário já cadastrado via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Usuario",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717, // Calculado: 10*75 + 6.25*175 - 5*35 + 5 = 1717
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
    });

    // Vai para profile
    await page.goto("/profile");
    await expect(page).toHaveURL(/profile/);
  });

  test("deve exibir dados do perfil corretamente", async ({ page }) => {
    // Verifica que dados são exibidos
    await expect(page.getByText("Teste Usuario")).toBeVisible();
    await expect(page.getByText("masculino", { exact: false })).toBeVisible();
    await expect(page.getByText("175 cm")).toBeVisible();
    await expect(page.getByText("75 kg")).toBeVisible();
    await expect(page.getByText(/\d+ kcal\/dia/)).toBeVisible(); // BMR

    // Verifica botão Editar
    await expect(page.getByText("Editar")).toBeVisible();
  });

  test("deve editar nome e salvar", async ({ page }) => {
    // Clica em Editar
    await page.getByText("Editar").click();

    // Verifica que está em modo edição (inputs visíveis)
    const nomeInput = page.locator('input[type="text"]').first();
    await expect(nomeInput).toBeVisible();

    // Altera o nome
    await nomeInput.fill("Maria Silva");

    // Clica em Salvar
    await page.getByRole("button", { name: "Salvar" }).click();

    // Verifica toast de confirmação
    await expect(page.getByText(/Perfil atualizado/i)).toBeVisible();

    // Verifica que nome foi atualizado
    await expect(page.getByText("Maria Silva")).toBeVisible();
  });

  test("deve recalcular BMR ao alterar peso", async ({ page }) => {
    // Captura BMR inicial
    const bmrInitial = await page.evaluate(() => {
      const profile = JSON.parse(
        localStorage.getItem("fittrack_user_profile") || "{}"
      );
      return profile.bmr;
    });

    // Clica em Editar
    await page.getByText("Editar").click();

    // Altera o peso para 80kg
    const pesoInput = page.locator('input[type="number"][step="0.1"]');
    await pesoInput.fill("80");

    // Salva
    await page.getByRole("button", { name: "Salvar" }).click();

    // Aguarda toast
    await expect(page.getByText(/Perfil atualizado/i)).toBeVisible();

    // Verifica que BMR foi recalculado
    const bmrNew = await page.evaluate(() => {
      const profile = JSON.parse(
        localStorage.getItem("fittrack_user_profile") || "{}"
      );
      return profile.bmr;
    });

    // BMR deve ter aumentado (peso maior = BMR maior)
    expect(bmrNew).toBeGreaterThan(bmrInitial);
  });

  test("deve mostrar erro para idade menor que 13 anos", async ({ page }) => {
    // Clica em Editar
    await page.getByText("Editar").click();

    // Altera data de nascimento para ano recente (< 13 anos)
    const currentYear = new Date().getFullYear();
    const birthDateInput = page.locator('input[type="date"]');
    await birthDateInput.fill(`${currentYear - 10}-01-01`); // 10 anos

    // Tenta salvar
    await page.getByRole("button", { name: "Salvar" }).click();

    // Verifica mensagem de erro
    await expect(page.getByText(/Idade mínima: 13 anos/i)).toBeVisible();
  });

  test("deve mostrar erro para altura fora do range", async ({ page }) => {
    // Clica em Editar
    await page.getByText("Editar").click();

    // Altera altura para valor inválido (< 120)
    const alturaInput = page
      .locator('input[type="number"]')
      .filter({ hasNotText: "0.1" })
      .first();
    await alturaInput.fill("100");

    // Tenta salvar
    await page.getByRole("button", { name: "Salvar" }).click();

    // Verifica mensagem de erro
    await expect(page.getByText(/Altura entre 120-250 cm/i)).toBeVisible();
  });

  test("deve mostrar erro para peso fora do range", async ({ page }) => {
    // Clica em Editar
    await page.getByText("Editar").click();

    // Altera peso para valor inválido (< 35)
    const pesoInput = page.locator('input[type="number"][step="0.1"]');
    await pesoInput.fill("30");

    // Tenta salvar
    await page.getByRole("button", { name: "Salvar" }).click();

    // Verifica mensagem de erro
    await expect(page.getByText(/Peso entre 35-300 kg/i)).toBeVisible();
  });

  test("deve cancelar edição e restaurar valores", async ({ page }) => {
    // Clica em Editar
    await page.getByText("Editar").click();

    // Altera o nome
    const nomeInput = page.locator('input[type="text"]').first();
    const nomeOriginal = await nomeInput.inputValue();
    await nomeInput.fill("Nome Alterado");

    // Clica em Cancelar
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Verifica que voltou ao modo visualização
    await expect(page.getByText("Editar")).toBeVisible();

    // Verifica que nome original está exibido
    await expect(page.getByText(nomeOriginal)).toBeVisible();
  });

  test("deve persistir alterações no localStorage", async ({ page }) => {
    // Clica em Editar
    await page.getByText("Editar").click();

    // Altera o nome
    const nomeInput = page.locator('input[type="text"]').first();
    await nomeInput.fill("Persistido User");

    // Salva
    await page.getByRole("button", { name: "Salvar" }).click();

    // Aguarda toast
    await expect(page.getByText(/Perfil atualizado/i)).toBeVisible();

    // Verifica localStorage
    const profile = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("fittrack_user_profile") || "{}");
    });

    expect(profile.name).toBe("Persistido User");

    // Recarrega página
    await page.reload();

    // Verifica que nome persistiu
    await expect(page.getByText("Persistido User")).toBeVisible();
  });
});
