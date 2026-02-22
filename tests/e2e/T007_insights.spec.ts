import { test, expect } from "@playwright/test";

/**
 * T007: Visualizar Insights
 *
 * Testa a página de insights (design Stitch — ScoreRing + domain sections):
 * - Estado vazio (sem dados)
 * - Secao Corpo com dados de peso
 * - Secao Nutricao com dados de refeicoes
 * - Score composto e secoes com dados completos
 * - Troca de período (7, 14, 30 dias)
 * - Recomendacao de peso em queda
 */
test.describe("T007: Visualizar Insights", () => {
  // Helper para gerar data no formato YYYY-MM-DD
  const formatDate = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
  };

  // Pré-calcula datas para uso nos testes (evita serialização de funções)
  const dates = {
    today: formatDate(0),
    day1: formatDate(1),
    day2: formatDate(2),
    day3: formatDate(3),
    day4: formatDate(4),
    day5: formatDate(5),
    day6: formatDate(6),
  };

  test("deve mostrar empty state quando não há dados", async ({ page }) => {
    // Simula usuário sem dados
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Insights",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");
      localStorage.removeItem("fittrack_meals");
      localStorage.removeItem("fittrack_workouts");
      localStorage.removeItem("fittrack_weight_logs");
    });

    await page.goto("/insights");
    await expect(page).toHaveURL(/insights/);

    await expect(page.getByText("Sem dados ainda")).toBeVisible();
    await expect(page.getByText("Ir para o Chat")).toBeVisible();
  });

  test("deve exibir secao Corpo com dados de peso", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((testDates) => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Insights",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");

      const weightLogs = [
        { id: "w1", weight: 76, date: testDates.day5, timestamp: new Date().toISOString(), rawText: "76kg" },
        { id: "w2", weight: 75.5, date: testDates.day3, timestamp: new Date().toISOString(), rawText: "75.5kg" },
        { id: "w3", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    await page.goto("/insights");

    // Secao Corpo mostra peso atual e sparkline (3+ entries)
    await expect(page.getByText("Peso atual")).toBeVisible();
    await expect(page.getByText("Evolucao do peso")).toBeVisible();
  });

  test("deve exibir secao Nutricao com dados de refeicoes", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((testDates) => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Insights",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");

      // Nutricao precisa de 3+ dias com comida para ativar dominio
      const meals = [
        {
          id: "m1",
          type: "lunch",
          items: [{ name: "Arroz", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 42, fat: 0 }],
          totalCalories: 500,
          totalProtein: 30,
          totalCarbs: 60,
          totalFat: 10,
          date: testDates.day3,
          timestamp: new Date().toISOString(),
          rawText: "Almoco",
        },
        {
          id: "m2",
          type: "dinner",
          items: [{ name: "Frango", quantity: 200, unit: "g", calories: 330, protein: 62, carbs: 0, fat: 8 }],
          totalCalories: 600,
          totalProtein: 40,
          totalCarbs: 50,
          totalFat: 15,
          date: testDates.day2,
          timestamp: new Date().toISOString(),
          rawText: "Jantar",
        },
        {
          id: "m3",
          type: "lunch",
          items: [{ name: "Salada", quantity: 200, unit: "g", calories: 120, protein: 5, carbs: 10, fat: 3 }],
          totalCalories: 450,
          totalProtein: 25,
          totalCarbs: 55,
          totalFat: 8,
          date: testDates.day1,
          timestamp: new Date().toISOString(),
          rawText: "Almoco",
        },
      ];
      localStorage.setItem("fittrack_meals", JSON.stringify(meals));
    }, dates);

    await page.goto("/insights");

    // Secao Nutricao mostra consumo medio e macros
    await expect(page.getByText("Consumo medio")).toBeVisible();
    await expect(page.getByText("Macros (media diaria)")).toBeVisible();
  });

  test("deve exibir Score e secoes com dados completos", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((testDates) => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Insights",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");

      // Corpo: 2+ pesos para ativar dominio
      const weightLogs = [
        { id: "w1", weight: 75.5, date: testDates.day3, timestamp: new Date().toISOString(), rawText: "75.5kg" },
        { id: "w2", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));

      // Nutricao: 3+ dias com comida para ativar dominio
      const meals = [
        {
          id: "m1",
          type: "lunch",
          items: [],
          totalCalories: 1500,
          totalProtein: 80,
          totalCarbs: 150,
          totalFat: 50,
          date: testDates.day3,
          timestamp: new Date().toISOString(),
          rawText: "Almoco",
        },
        {
          id: "m2",
          type: "dinner",
          items: [],
          totalCalories: 1400,
          totalProtein: 70,
          totalCarbs: 140,
          totalFat: 45,
          date: testDates.day2,
          timestamp: new Date().toISOString(),
          rawText: "Jantar",
        },
        {
          id: "m3",
          type: "lunch",
          items: [],
          totalCalories: 1600,
          totalProtein: 85,
          totalCarbs: 160,
          totalFat: 55,
          date: testDates.day1,
          timestamp: new Date().toISOString(),
          rawText: "Almoco",
        },
      ];
      localStorage.setItem("fittrack_meals", JSON.stringify(meals));
    }, dates);

    await page.goto("/insights");

    // ScoreRing visivel
    await expect(page.getByText("Seu Score")).toBeVisible();
    // Secao Corpo ativa
    await expect(page.getByText("Peso atual")).toBeVisible();
    // Secao Nutricao ativa
    await expect(page.getByText("Consumo medio")).toBeVisible();
  });

  test("deve trocar periodo corretamente", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((testDates) => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Insights",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");

      // Corpo: 2+ pesos para ativar dominio
      const weightLogs = [
        { id: "w1", weight: 75.5, date: testDates.day3, timestamp: new Date().toISOString(), rawText: "75.5kg" },
        { id: "w2", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    await page.goto("/insights");

    await expect(page.getByText("7 dias")).toBeVisible();
    await expect(page.getByText("14 dias")).toBeVisible();
    await expect(page.getByText("30 dias")).toBeVisible();

    // Troca de periodo mantem Score e secoes visiveis
    await page.getByText("14 dias").click();
    await expect(page.getByText("Seu Score")).toBeVisible();

    await page.getByText("30 dias").click();
    await expect(page.getByText("Seu Score")).toBeVisible();
  });

  test("deve gerar recomendacao de peso em queda", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((testDates) => {
      localStorage.setItem(
        "fittrack_user_profile",
        JSON.stringify({
          name: "Teste Insights",
          gender: "masculino",
          birthDate: "1990-01-01",
          height: 175,
          weight: 75,
          bmr: 1717,
          createdAt: new Date().toISOString(),
        })
      );
      localStorage.setItem("fittrack_onboarding_complete", "true");

      const weightLogs = [
        { id: "w1", weight: 77, date: testDates.day6, timestamp: new Date().toISOString(), rawText: "77kg" },
        { id: "w2", weight: 76.5, date: testDates.day4, timestamp: new Date().toISOString(), rawText: "76.5kg" },
        { id: "w3", weight: 76, date: testDates.day2, timestamp: new Date().toISOString(), rawText: "76kg" },
        { id: "w4", weight: 75, date: testDates.today, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    await page.goto("/insights");

    // Recomendacao de peso em queda: observation mostra diff + action mostra conselho
    await expect(page.getByText(/kg no per/).first()).toBeVisible();
    await expect(page.getByText(/Continue no ritmo/).first()).toBeVisible();
  });
});
