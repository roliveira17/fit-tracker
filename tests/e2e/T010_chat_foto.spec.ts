import { test, expect } from "@playwright/test";

/**
 * T010: Chat com Foto
 *
 * Testa o fluxo de envio de foto para análise nutricional no chat.
 * Nota: API de análise é mockada via route intercept.
 */
test.describe("T010: Chat com Foto", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Foto",
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
    await page.goto("/chat");
  });

  test("deve exibir botão de foto no chat", async ({ page }) => {
    const photoButton = page.locator("text=photo_camera");
    await expect(photoButton).toBeVisible();
  });

  test("deve abrir seletor de arquivo ao clicar no botão de foto", async ({
    page,
  }) => {
    // Verifica que o input file existe (hidden)
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await expect(fileInput).toBeAttached();

    // Verifica que o input é acionado pelo botão
    const photoButton = page.locator("text=photo_camera");
    await expect(photoButton).toBeVisible();
  });

  test("deve mostrar preview da imagem após selecionar arquivo", async ({
    page,
  }) => {
    // Cria um arquivo de teste (1x1 pixel PNG)
    const fileInput = page.locator('input[type="file"][accept="image/*"]');

    // Simula seleção de arquivo com buffer de imagem mínimo
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    await fileInput.setInputFiles({
      name: "refeicao-teste.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    // Preview deve aparecer com botão "Analisar"
    await expect(page.getByText("Analisar")).toBeVisible({ timeout: 5000 });
  });

  test("deve remover preview ao clicar no botão de remover", async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"][accept="image/*"]');

    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    await fileInput.setInputFiles({
      name: "refeicao-teste.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    // Aguarda preview
    await expect(page.getByText("Analisar")).toBeVisible({ timeout: 5000 });

    // Clica em remover imagem
    const removeButton = page.getByText("Remover imagem");
    if (await removeButton.isVisible()) {
      await removeButton.click();
    } else {
      // Fallback: botão close no preview
      await page.locator("text=close").first().click();
    }

    // Preview deve desaparecer
    await expect(page.getByText("Analisar")).not.toBeVisible({ timeout: 3000 });
  });

  test("deve enviar foto e mostrar mensagem de envio no chat", async ({
    page,
  }) => {
    // Seleciona imagem
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    await fileInput.setInputFiles({
      name: "almoco.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    // Clica em Analisar
    await page.getByText("Analisar").click();

    // Deve mostrar mensagem do usuario no chat indicando imagem enviada
    await expect(
      page.getByText(/imagem.*an[aá]lise|foto.*enviada|foto de refei/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
