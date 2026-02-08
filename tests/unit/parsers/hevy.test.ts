import { parseHevyCSV } from "@/lib/parsers/hevy";

/**
 * Helper: cria CSV a partir de linhas
 */
function createCSV(lines: string[]): string {
  return lines.join("\n");
}

const HEADER = '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"';

describe("parseHevyCSV", () => {
  describe("parsing basico", () => {
    it("parseia um treino simples com 1 exercicio e 1 set", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino Reto",,"",0,"normal",80,10,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0].date).toBe("2026-01-15");
      expect(result.workouts[0].exercises).toHaveLength(1);
      expect(result.workouts[0].exercises[0].name).toBe("Supino Reto");
      expect(result.workouts[0].exercises[0].sets).toBe(1);
    });

    it("parseia treino com multiplos sets do mesmo exercicio", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino Reto",,"",0,"normal",80,10,,,',
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino Reto",,"",1,"normal",80,8,,,',
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino Reto",,"",2,"normal",80,6,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0].exercises[0].sets).toBe(3);
      expect(result.workouts[0].exercises[0].reps).toBe(8); // avg(10,8,6) = 8
    });

    it("parseia treino com multiplos exercicios", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino Reto",,"",0,"normal",80,10,,,',
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Desenvolvimento",,"",0,"normal",40,12,,,',
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Triceps Corda",,"",0,"normal",30,15,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0].exercises).toHaveLength(3);
    });
  });

  describe("parsing de datas Hevy", () => {
    it("parseia formato DD MMM YYYY, HH:mm", () => {
      const csv = createCSV([
        HEADER,
        '"1","12 Jan 2026, 12:17","12 Jan 2026, 13:07","","Agachamento",,"",0,"normal",100,8,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts[0].date).toBe("2026-01-12");
    });

    it("parseia meses diferentes corretamente", () => {
      const months = [
        { str: "1 Feb 2026, 10:00", expected: "2026-02-01" },
        { str: "15 Mar 2026, 10:00", expected: "2026-03-15" },
        { str: "20 Dec 2026, 10:00", expected: "2026-12-20" },
      ];

      for (const { str, expected } of months) {
        const csv = createCSV([
          HEADER,
          `"1","${str}","${str}","","Exercicio",,"",0,"normal",50,10,,,`,
        ]);
        const result = parseHevyCSV(csv, []);
        expect(result.workouts[0].date).toBe(expected);
      }
    });

    it("calcula duracao a partir de start/end time", () => {
      const csv = createCSV([
        HEADER,
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:30","","Supino",,"",0,"normal",80,10,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts[0].totalDuration).toBe(90); // 1h30min = 90min
    });
  });

  describe("agrupamento por sessao", () => {
    it("agrupa exercicios pela mesma sessao (titulo + data)", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Agachamento",,"",0,"normal",100,8,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0].exercises).toHaveLength(2);
    });

    it("separa sessoes de dias diferentes", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
        '"Treino A","16 Jan 2026, 10:00","16 Jan 2026, 11:00","","Supino",,"",0,"normal",82,10,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(2);
    });

    it("separa sessoes com titulos diferentes no mesmo dia", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
        '"Treino B","15 Jan 2026, 14:00","15 Jan 2026, 15:00","","Agachamento",,"",0,"normal",100,8,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(2);
    });
  });

  describe("deteccao de duplicatas", () => {
    it("pula treinos ja existentes por data", () => {
      const csv = createCSV([
        HEADER,
        '"Treino A","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
        '"Treino B","16 Jan 2026, 10:00","16 Jan 2026, 11:00","","Supino",,"",0,"normal",82,10,,,',
      ]);
      const existingWorkouts = [
        {
          id: "existing-1",
          date: "2026-01-15",
          exercises: [],
          timestamp: "2026-01-15T10:00:00",
        },
      ] as any[];
      const result = parseHevyCSV(csv, existingWorkouts);
      expect(result.workouts).toHaveLength(1); // Apenas 16 Jan
      expect(result.duplicatesSkipped).toBe(1);
      expect(result.workouts[0].date).toBe("2026-01-16");
    });
  });

  describe("calculo de calorias", () => {
    it("estima calorias queimadas por exercicio", () => {
      const csv = createCSV([
        HEADER,
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      // Formula: sets * avgReps * avgWeight * 0.05
      // 1 * 10 * 80 * 0.05 = 40
      expect(result.workouts[0].exercises[0].caloriesBurned).toBe(40);
    });

    it("calcula totalCaloriesBurned como soma dos exercicios", () => {
      const csv = createCSV([
        HEADER,
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Agachamento",,"",0,"normal",100,8,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      const ex1Cal = result.workouts[0].exercises[0].caloriesBurned || 0;
      const ex2Cal = result.workouts[0].exercises[1].caloriesBurned || 0;
      expect(result.workouts[0].totalCaloriesBurned).toBe(ex1Cal + ex2Cal);
    });
  });

  describe("edge cases", () => {
    it("retorna erro para arquivo vazio", () => {
      const result = parseHevyCSV("", []);
      expect(result.workouts).toHaveLength(0);
      expect(result.errors[0]).toContain("vazio");
    });

    it("retorna erro para CSV so com header", () => {
      const result = parseHevyCSV(HEADER, []);
      expect(result.workouts).toHaveLength(0);
    });

    it("retorna erro para formato nao-Hevy", () => {
      const csv = createCSV([
        '"name","age","city"',
        '"João","25","SP"',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(0);
      expect(result.errors[0]).toContain("não reconhecido");
    });

    it("ignora linhas com dados insuficientes", () => {
      const csv = createCSV([
        HEADER,
        '"1"',
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
    });

    it("lida com peso zero", () => {
      const csv = createCSV([
        HEADER,
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Flexao",,"",0,"normal",0,20,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
      expect(result.workouts[0].exercises[0].caloriesBurned).toBe(0);
    });

    it("gera rawText com titulo da sessao", () => {
      const csv = createCSV([
        HEADER,
        '"Peito e Triceps","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Supino",,"",0,"normal",80,10,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts[0].rawText).toContain("Peito e Triceps");
    });

    it("parseia CSV com valores contendo aspas", () => {
      const csv = createCSV([
        HEADER,
        '"1","15 Jan 2026, 10:00","15 Jan 2026, 11:00","","Leg Press 45""",,"",0,"normal",200,12,,,',
      ]);
      const result = parseHevyCSV(csv, []);
      expect(result.workouts).toHaveLength(1);
    });
  });
});
