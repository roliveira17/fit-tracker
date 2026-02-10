import { test, expect } from "@playwright/test";

/**
 * T006: Registro de Treino
 *
 * Testa o registro de exercícios via chat:
 * - Cardio simples (esteira)
 * - Musculação (supino)
 * - Múltiplos exercícios
 * - Persistência no localStorage
 * - Toast de confirmação
 */
test.describe("T006: Registro de Treino", () => {
  // Setup: configura usuário antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Simula usuário já cadastrado via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Treino",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 80,
          bmr: 1775,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
      // Limpa dados anteriores
      localStorage.removeItem("fittrack_chat_messages");
      localStorage.removeItem("fittrack_workouts");
    });

    // Vai para chat
    await page.goto("/chat");
    await expect(page).toHaveURL(/chat/);
  });

  test("deve registrar treino cardio simples", async ({ page }) => {
    // Aumenta timeout para aguardar resposta da IA
    test.setTimeout(60000);

    // Digita mensagem de treino
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Fiz 30 minutos de esteira hoje");

    // Clica no botão enviar
    const sendButton = page.locator("button").filter({ hasText: "send" });
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Aguarda resposta da IA com confirmação de registro
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica que a resposta menciona esteira ou cardio
    await expect(
      page.getByText(/esteira|cardio|corrida/i).first()
    ).toBeVisible();
  });

  test("deve registrar treino de musculação", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia treino de musculação
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Fiz supino 4 séries de 8 repetições");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica que menciona supino ou musculação
    await expect(
      page.getByText(/supino|musculação|peito/i).first()
    ).toBeVisible();
  });

  test("deve registrar múltiplos exercícios", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia múltiplos exercícios
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Treinei peito e tríceps: supino, crucifixo e tríceps corda");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("deve persistir treino no localStorage", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia treino
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Corri 5km em 25 minutos");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda confirmação
    await expect(page.getByText(/Registrado/i).first()).toBeVisible({
      timeout: 30000,
    });

    // Verifica localStorage
    const workouts = await page.evaluate(() => {
      const data = localStorage.getItem("fittrack_workouts");
      return data ? JSON.parse(data) : null;
    });

    // Deve ter pelo menos um treino
    expect(workouts).not.toBeNull();
    expect(Array.isArray(workouts)).toBe(true);
    expect(workouts.length).toBeGreaterThan(0);

    // Verifica estrutura do treino
    const workout = workouts[0];
    expect(workout).toHaveProperty("id");
    expect(workout).toHaveProperty("exercises");
    expect(workout).toHaveProperty("date");
    expect(workout).toHaveProperty("timestamp");
    expect(workout).toHaveProperty("rawText");

    // ID deve seguir padrão
    expect(workout.id).toMatch(/^workout_/);

    // Exercises deve ser array
    expect(Array.isArray(workout.exercises)).toBe(true);
    expect(workout.exercises.length).toBeGreaterThan(0);

    // Cada exercício deve ter nome e tipo
    const exercise = workout.exercises[0];
    expect(exercise).toHaveProperty("name");
    expect(exercise).toHaveProperty("type");
  });

  test("deve mostrar toast de confirmação após registro", async ({ page }) => {
    // Aumenta timeout
    test.setTimeout(60000);

    // Envia treino
    const input = page.locator('textarea[placeholder*="Ask"]');
    await input.fill("Fiz 45 minutos de bicicleta ergométrica");

    const sendButton = page.locator("button").filter({ hasText: "send" });
    await sendButton.click();

    // Aguarda toast de confirmação (usa .first() pois card title também contém texto similar)
    await expect(page.getByText(/Treino registrado/i).first()).toBeVisible({
      timeout: 30000,
    });
  });
});
