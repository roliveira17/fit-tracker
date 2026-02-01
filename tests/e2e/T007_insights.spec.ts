import { test, expect } from "@playwright/test";

/**
 * T007: Visualizar Insights
 *
 * Testa a página de insights:
 * - Estado vazio (sem dados)
 * - Exibição de gráficos com dados
 * - StatCards com valores agregados
 * - Troca de período (7, 14, 30 dias)
 * - Geração de insights
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
      // Limpa todos os dados
      localStorage.removeItem("fittrack_meals");
      localStorage.removeItem("fittrack_workouts");
      localStorage.removeItem("fittrack_weight_logs");
    });

    // Vai para insights
    await page.goto("/insights");
    await expect(page).toHaveURL(/insights/);

    // Verifica empty state
    await expect(page.getByText("Sem dados ainda")).toBeVisible();
    await expect(page.getByText("Ir para o Chat")).toBeVisible();
  });

  test("deve exibir gráfico de peso quando há dados", async ({ page }) => {
    // Configura usuário com dados de peso
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

      // Adiciona dados de peso
      const weightLogs = [
        { id: "w1", weight: 76, date: testDates.day5, timestamp: new Date().toISOString(), rawText: "76kg" },
        { id: "w2", weight: 75.5, date: testDates.day3, timestamp: new Date().toISOString(), rawText: "75.5kg" },
        { id: "w3", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    // Vai para insights
    await page.goto("/insights");

    // Verifica que gráfico de peso é exibido
    await expect(page.getByText("Evolução do Peso")).toBeVisible();

    // Verifica StatCard de último peso
    await expect(page.getByText("Último peso")).toBeVisible();
    // Verifica que o valor 75.0 é exibido (pode aparecer múltiplas vezes)
    await expect(page.getByText("75.0").first()).toBeVisible();
  });

  test("deve exibir gráfico de calorias quando há dados de refeições", async ({
    page,
  }) => {
    // Configura usuário com dados de refeições
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

      // Adiciona dados de refeições
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

    // Vai para insights
    await page.goto("/insights");

    // Verifica que gráfico de calorias é exibido
    await expect(page.getByText("Calorias por Dia")).toBeVisible();

    // Verifica StatCard de média kcal
    await expect(page.getByText("Média kcal")).toBeVisible();
  });

  test("deve exibir todos os StatCards com dados completos", async ({
    page,
  }) => {
    // Configura usuário com dados completos
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

      // Peso
      const weightLogs = [
        { id: "w1", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));

      // Refeições
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

      // Treinos
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

    // Vai para insights
    await page.goto("/insights");

    // Verifica todos os StatCards
    await expect(page.getByText("Último peso")).toBeVisible();
    await expect(page.getByText("Treinos")).toBeVisible();
    await expect(page.getByText("Média kcal")).toBeVisible();
  });

  test("deve trocar período corretamente", async ({ page }) => {
    // Configura usuário com dados
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

      // Peso
      const weightLogs = [
        { id: "w1", weight: 75, date: testDates.day1, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    // Vai para insights
    await page.goto("/insights");

    // Verifica seletores de período
    await expect(page.getByText("7 dias")).toBeVisible();
    await expect(page.getByText("14 dias")).toBeVisible();
    await expect(page.getByText("30 dias")).toBeVisible();

    // Clica em 14 dias
    await page.getByText("14 dias").click();

    // Verifica que a página ainda funciona
    await expect(page.getByText("Evolução do Peso")).toBeVisible();

    // Clica em 30 dias
    await page.getByText("30 dias").click();

    // Verifica que a página ainda funciona
    await expect(page.getByText("Evolução do Peso")).toBeVisible();
  });

  test("deve gerar insight de peso em queda", async ({ page }) => {
    // Configura dados que geram insight de perda de peso
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

      // Peso em queda (perda > 0.5kg)
      const weightLogs = [
        { id: "w1", weight: 77, date: testDates.day6, timestamp: new Date().toISOString(), rawText: "77kg" },
        { id: "w2", weight: 76.5, date: testDates.day4, timestamp: new Date().toISOString(), rawText: "76.5kg" },
        { id: "w3", weight: 76, date: testDates.day2, timestamp: new Date().toISOString(), rawText: "76kg" },
        { id: "w4", weight: 75, date: testDates.today, timestamp: new Date().toISOString(), rawText: "75kg" },
      ];
      localStorage.setItem("fittrack_weight_logs", JSON.stringify(weightLogs));
    }, dates);

    // Vai para insights
    await page.goto("/insights");

    // Verifica insight de peso em queda
    await expect(page.getByText("Peso em queda")).toBeVisible();
  });
});
