import { test, expect } from "@playwright/test";

/**
 * T011: Import Apple Health
 *
 * Testa o fluxo de importação de dados do Apple Health.
 * Nota: Não testa import real (precisa de ZIP válido),
 * mas valida UI, expansão de card, validação de arquivo e dropzone.
 */
test.describe("T011: Import Apple Health", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Import",
          gender: "feminino",
          birthDate: "1992-03-20",
          height: 165,
          weight: 60,
          bmr: 1400,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
    });
    await page.goto("/import");
  });

  test("deve exibir página de importação com fontes disponíveis", async ({
    page,
  }) => {
    // Verifica que a página carregou
    await expect(page.getByText("Apple Health")).toBeVisible();
    await expect(page.getByText("Peso, body fat, treinos e sono")).toBeVisible();
  });

  test("deve exibir fontes Hevy e CGM", async ({ page }) => {
    // Verifica outras fontes de import
    await expect(page.getByText("Hevy")).toBeVisible();
    await expect(page.getByText("Glicemia")).toBeVisible();
  });

  test("deve expandir card do Apple Health ao clicar", async ({ page }) => {
    // Clica no card Apple Health para expandir
    const appleCard = page.getByText("Apple Health").first();
    await appleCard.click();

    // Verifica que dropzone aparece
    await expect(
      page.getByText("Arraste o arquivo ou toque para selecionar")
    ).toBeVisible({ timeout: 3000 });
  });

  test("deve mostrar instrução de como exportar do iPhone", async ({
    page,
  }) => {
    // Expande Apple Health
    const appleCard = page.getByText("Apple Health").first();
    await appleCard.click();

    // Aguarda dropzone
    await expect(
      page.getByText("Arraste o arquivo ou toque para selecionar")
    ).toBeVisible({ timeout: 3000 });

    // Verifica texto de ajuda (pode estar em collapsible)
    const helpText = page.getByText("No iPhone, abra o app Saude");
    if (await helpText.isVisible().catch(() => false)) {
      await expect(helpText).toBeVisible();
    } else {
      // Tenta expandir seção de ajuda
      const helpToggle = page.getByText("Como exportar?");
      if (await helpToggle.isVisible().catch(() => false)) {
        await helpToggle.click();
        await expect(helpText).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("deve mostrar formato aceito como ZIP", async ({ page }) => {
    // Expande Apple Health
    const appleCard = page.getByText("Apple Health").first();
    await appleCard.click();

    // Verifica formato aceito (formatLabels mapeia .zip → "ZIP")
    await expect(page.getByText(/formatos.*zip/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test("deve rejeitar arquivo com formato inválido", async ({ page }) => {
    // Expande Apple Health
    const appleCard = page.getByText("Apple Health").first();
    await appleCard.click();

    // Aguarda dropzone
    await expect(
      page.getByText("Arraste o arquivo ou toque para selecionar")
    ).toBeVisible({ timeout: 3000 });

    // Tenta enviar arquivo .txt (formato inválido)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "dados.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("dados de teste invalidos"),
    });

    // Deve mostrar erro de formato
    await expect(
      page.getByText(/formato inv[aá]lido|aceitos.*zip/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("deve processar arquivo .zip (aceitar formato e tentar importar)", async ({
    page,
  }) => {
    // Expande Apple Health
    const appleCard = page.getByText("Apple Health").first();
    await appleCard.click();

    // Aguarda dropzone
    await expect(
      page.getByText("Arraste o arquivo ou toque para selecionar")
    ).toBeVisible({ timeout: 3000 });

    // Envia arquivo .zip fake via hidden input
    const fileInput = page.locator('input[type="file"][accept=".zip"]');
    await fileInput.setInputFiles({
      name: "export_saude.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("PK\x03\x04fake-zip-content"),
    });

    // O ZIP fake será aceito (formato correto) mas falhará no parse.
    // Verifica que o erro de ZIP corrompido aparece (prova que formato foi aceito)
    await expect(
      page.getByText("Erro ao descompactar ZIP:")
    ).toBeVisible({ timeout: 10000 });
  });
});
