import { test, expect } from "@playwright/test";

/**
 * T009: Barcode Scanner
 *
 * Testa a abertura do scanner de código de barras no chat.
 * Nota: mock de câmera não é viável em E2E, então testa até a abertura do modal.
 */
test.describe("T009: Barcode Scanner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Barcode",
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

  test("deve exibir botão de barcode no chat", async ({ page }) => {
    const barcodeButton = page.locator("text=barcode_scanner");
    await expect(barcodeButton).toBeVisible();
  });

  test("deve abrir modal do scanner ao clicar no botão", async ({ page }) => {
    const barcodeButton = page.locator("text=barcode_scanner");
    await barcodeButton.click();

    // Modal do scanner deve aparecer
    const scannerHeader = page.locator("text=Escanear Código de Barras");
    await expect(scannerHeader).toBeVisible();
  });

  test("deve fechar modal ao clicar no botão fechar", async ({ page }) => {
    const barcodeButton = page.locator("text=barcode_scanner");
    await barcodeButton.click();

    const scannerHeader = page.locator("text=Escanear Código de Barras");
    await expect(scannerHeader).toBeVisible();

    // Clica no botão fechar
    const closeButton = page.locator("text=close").first();
    await closeButton.click();

    // Modal deve desaparecer
    await expect(scannerHeader).not.toBeVisible();
  });
});
