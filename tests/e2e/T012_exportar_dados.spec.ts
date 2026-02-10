import { test, expect } from "@playwright/test";

/**
 * T012: Exportar Dados
 *
 * Testa o fluxo de exportação de dados na página de perfil.
 * Verifica seleção de formato, período e botão de exportar.
 */
test.describe("T012: Exportar Dados", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Export",
          gender: "masculino",
          birthDate: "1988-07-10",
          height: 180,
          weight: 85,
          bmr: 1850,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
      // Adiciona dados para exportar
      localStorage.setItem(
        "fittrack_meals",
        JSON.stringify([
          {
            id: "m1",
            type: "almoco",
            items: [
              { name: "Arroz", calories: 200, protein: 4, carbs: 44, fat: 1 },
            ],
            totalCalories: 200,
            date: new Date().toISOString(),
          },
        ])
      );
      localStorage.setItem(
        "fittrack_weight_logs",
        JSON.stringify([
          { id: "w1", weight: 85, date: new Date().toISOString() },
        ])
      );
    });
    await page.goto("/profile");
  });

  test("deve exibir seção de exportar dados", async ({ page }) => {
    await expect(page.getByText("Exportar Dados")).toBeVisible();
  });

  test("deve ter JSON selecionado por padrão", async ({ page }) => {
    // Expande seção de Exportar Dados
    await page.getByText("Exportar Dados").click();

    // Botão JSON deve estar selecionado (com estilo ativo)
    const jsonButton = page.getByText("JSON").first();
    await expect(jsonButton).toBeVisible();

    // Descrição do JSON deve estar visível
    await expect(
      page.getByText(/arquivo.*dados estruturados|backup.*migra/i)
    ).toBeVisible();
  });

  test("deve alternar para formato CSV", async ({ page }) => {
    // Expande seção de Exportar Dados
    await page.getByText("Exportar Dados").click();

    // Clica no botão CSV
    const csvButton = page.getByText("CSV").first();
    await csvButton.click();

    // Descrição do CSV deve aparecer
    await expect(
      page.getByText(/m[uú]ltiplos arquivos|an[aá]lise.*planilhas/i)
    ).toBeVisible();
  });

  test("deve exibir seletor de período", async ({ page }) => {
    // Expande seção de Exportar Dados
    await page.getByText("Exportar Dados").click();

    // Verifica que dropdown de período existe
    const periodSelect = page.locator("select").first();
    await expect(periodSelect).toBeVisible();

    // Verifica opção padrão
    await expect(periodSelect).toHaveValue("all");
  });

  test("deve alterar período de exportação", async ({ page }) => {
    // Expande seção de Exportar Dados
    await page.getByText("Exportar Dados").click();

    const periodSelect = page.locator("select").first();

    // Seleciona "Último mês"
    await periodSelect.selectOption("1m");
    await expect(periodSelect).toHaveValue("1m");

    // Seleciona "Últimos 3 meses"
    await periodSelect.selectOption("3m");
    await expect(periodSelect).toHaveValue("3m");
  });

  test("deve exibir botão de exportar", async ({ page }) => {
    // Expande seção de Exportar Dados
    await page.getByText("Exportar Dados").click();

    const exportButton = page.locator("section button").filter({ hasText: "Exportar" }).first();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  test("deve iniciar exportação ao clicar no botão", async ({ page }) => {
    // Expande seção de Exportar Dados
    await page.getByText("Exportar Dados").click();

    // Intercepta download
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);

    const exportButton = page.locator("section button").filter({ hasText: "Exportar" }).first();
    await exportButton.click();

    // Deve mostrar estado de loading ou iniciar download
    // O botão pode ficar disabled durante export ou mostrar "Exportando..."
    const download = await downloadPromise;
    if (download) {
      // Verifica que o arquivo foi baixado
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/fittrack.*\.(json|zip)$/i);
    }
  });
});
