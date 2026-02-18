import { test, expect } from "@playwright/test";

/**
 * T007: Visualizar Insights
 *
 * Testa a página de insights (design Stitch com tabs):
 * - Estado vazio (sem dados)
 * - Tabs de navegação (Resumo, Dieta, Treino, Sono, Glicemia, Corpo)
 * - StatCards com valores agregados
 * - Troca de período (7, 14, 30 dias)
 * - Geração de recomendações
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

  test("deve exibir gráfico de peso na tab Corpo", async ({ page }) => {
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

    // Tab Resumo mostra StatCard de peso
    await expect(page.getByText("Último peso")).toBeVisible();

    // Clica na tab Corpo para ver gráfico
    await page.getByText("Corpo").click();
    await expect(page.getByText("Evolução do Peso")).toBeVisible();
  });

  test("deve exibir gráfico de calorias na tab Dieta", async ({ page }) => {
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

      const meals = [
        {
          id: "m1",
          type: "lunch",
          items: [{ name: "Arroz", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 42, fat: 0 }],
          totalCalories: 500,
          totalProtein: 30,
          totalCarbs: 60,
          totalFat: 10,
          date: testDates.day2,
          timestamp: new Date().toISOString(),
          rawText: "Almoço",
        },
        {
          id: "m2",
          type: "dinner",
          items: [{ name: "Frango", quantity: 200, unit: "g", calories: 330, protein: 62, carbs: 0, fat: 8 }],
          totalCalories: 600,
          totalProtein: 40,
          totalCarbs: 50,
          totalFat: 15,
          date: testDates.day1,
          timestamp: new Date().toISOString(),
          rawText: "Jantar",
        },
      ];
      localStorage.setItem("fittrack_meals", JSON.stringify(meals));
    }, dates);

    await page.goto("/insights");

    await expect(page.getByText("Média kcal")).toBeVisible();

    // Clica na tab Dieta
    await page.getByText("Dieta").click();
    await expect(page.getByText("Calorias por Dia")).toBeVisible();
  });

  test("deve exibir todos os StatCards com dados completos", async ({ page }) => {
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
        { id: "w1", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));

      const meals = [
        {
          id: "m1",
          type: "lunch",
          items: [],
          totalCalories: 1500,
          totalProtein: 80,
          totalCarbs: 150,
          totalFat: 50,
          date: testDates.day1,
          timestamp: new Date().toISOString(),
          rawText: "Almoço",
        },
      ];
      localStorage.setItem("fittrack_meals", JSON.stringify(meals));

      const workouts = [
        {
          id: "wk1",
          exercises: [{ type: "cardio", name: "Esteira", duration: 30 }],
          totalDuration: 30,
          totalCaloriesBurned: 250,
          date: testDates.day1,
          timestamp: new Date().toISOString(),
          rawText: "Esteira",
        },
      ];
      localStorage.setItem("fittrack_workouts", JSON.stringify(workouts));
    }, dates);

    await page.goto("/insights");

    await expect(page.getByText("Último peso")).toBeVisible();
    await expect(page.getByText("Treinos").first()).toBeVisible();
    await expect(page.getByText("Média kcal")).toBeVisible();
  });

  test("deve trocar período corretamente", async ({ page }) => {
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
        { id: "w1", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    await page.goto("/insights");

    await expect(page.getByText("7 dias")).toBeVisible();
    await expect(page.getByText("14 dias")).toBeVisible();
    await expect(page.getByText("30 dias")).toBeVisible();

    await page.getByText("14 dias").click();
    await expect(page.getByText("Último peso")).toBeVisible();

    await page.getByText("30 dias").click();
    await expect(page.getByText("Último peso")).toBeVisible();
  });

  test("deve gerar insight de peso em queda", async ({ page }) => {
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

    await expect(page.getByText("Peso em queda")).toBeVisible();
  });
});
