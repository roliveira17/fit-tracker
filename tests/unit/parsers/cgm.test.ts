import * as XLSX from "xlsx";
import { parseCGMXlsx, cgmReadingsToSupabaseFormat } from "@/lib/parsers/cgm";

/**
 * Helper: cria um buffer XLSX a partir de dados em array
 */
function createXlsxBuffer(data: unknown[][]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return buf;
}

describe("parseCGMXlsx", () => {
  describe("deteccao de formato", () => {
    it("detecta SiSensing pelo nome do arquivo", () => {
      const data = [
        ["Date", "Glucose (mg/dL)"],
        ["2026-01-15 08:30:00", 95],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "SiSensingCGM-export.xlsx");
      expect(result.metadata.device).toBe("SiSensing CGM");
    });

    it("detecta FreeStyle pelo nome do arquivo", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:30:00", 95],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "FreeStyle-Libre-data.xlsx");
      expect(result.metadata.fileName).toBe("FreeStyle-Libre-data.xlsx");
    });

    it("usa parser generico para formato desconhecido", () => {
      const data = [
        ["timestamp", "value"],
        ["2026-01-15 08:30:00", 100],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "random-cgm.xlsx");
      expect(result.readings.length).toBe(1);
    });
  });

  describe("parsing de datas", () => {
    it("parseia formato ISO (YYYY-MM-DD HH:mm:ss)", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:30:00", 110],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings[0].date).toBe("2026-01-15");
      expect(result.readings[0].time).toBe("08:30:00");
    });

    it("parseia formato ISO com T (YYYY-MM-DDThh:mm:ss)", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15T14:45:00", 120],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings[0].date).toBe("2026-01-15");
      expect(result.readings[0].time).toBe("14:45:00");
    });

    it("parseia formato SiSensing (DD-MM-YYYY HH:mm GMT-3)", () => {
      const data = [
        ["Date", "Glucose"],
        ["15-01-2026 08:30 GMT-3", 100],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "SiSensingCGM.xlsx");
      expect(result.readings[0].date).toBe("2026-01-15");
      expect(result.readings[0].time).toBe("08:30:00");
    });

    it("parseia formato BR (DD/MM/YYYY HH:mm)", () => {
      const data = [
        ["Data", "Glicose"],
        ["15/01/2026 08:30", 95],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings[0].date).toBe("2026-01-15");
    });

    it("registra erro para data invalida", () => {
      const data = [
        ["Date", "Glucose"],
        ["invalid-date", 100],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Data/hora inválida");
    });
  });

  describe("conversao de unidades", () => {
    it("mantem mg/dL quando valor >= 30", () => {
      const data = [
        ["Date", "Glucose (mg/dL)"],
        ["2026-01-15 08:00:00", 95],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings[0].glucose).toBe(95);
    });

    it("converte mmol/L para mg/dL quando valor < 30", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:00:00", 5.3],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      // 5.3 * 18 = 95.4 → arredonda para 95
      expect(result.readings[0].glucose).toBe(95);
    });

    it("converte explicitamente quando unidade e mmol/L", () => {
      const data = [
        ["Date", "Glucose", "Unit"],
        ["2026-01-15 08:00:00", 6.1, "mmol/L"],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      // 6.1 * 18 = 109.8 → 110
      expect(result.readings[0].glucose).toBe(110);
    });
  });

  describe("validacao de range", () => {
    it("aceita glicose no range valido (20-600)", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:00:00", 70],
        ["2026-01-15 09:00:00", 180],
        ["2026-01-15 10:00:00", 250],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings.length).toBe(3);
    });

    it("rejeita glicose abaixo de 20 mg/dL (com unidade explicita)", () => {
      // Sem unidade, 15 seria interpretado como mmol/L (15 * 18 = 270 mg/dL, valido)
      // Com unidade mg/dL, 15 fica abaixo do range minimo de 20
      const data = [
        ["Date", "Glucose", "Unit"],
        ["2026-01-15 08:00:00", 15, "mg/dL"],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings.length).toBe(0);
      expect(result.errors[0]).toContain("fora do range");
    });

    it("rejeita glicose acima de 600", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:00:00", 650],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings.length).toBe(0);
    });

    it("ignora linhas sem valor de glicose valido", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:00:00", ""],
        ["2026-01-15 09:00:00", "abc"],
        ["2026-01-15 10:00:00", 100],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings.length).toBe(1);
      expect(result.readings[0].glucose).toBe(100);
    });
  });

  describe("metadata", () => {
    it("calcula dateRange corretamente", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-10 08:00:00", 90],
        ["2026-01-12 14:00:00", 110],
        ["2026-01-15 20:00:00", 95],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "test.xlsx");
      expect(result.metadata.dateRange?.start).toBe("2026-01-10");
      expect(result.metadata.dateRange?.end).toBe("2026-01-15");
      expect(result.metadata.totalReadings).toBe(3);
    });

    it("preserva fileName na metadata", () => {
      const data = [
        ["Date", "Glucose"],
        ["2026-01-15 08:00:00", 100],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "meu_arquivo.xlsx");
      expect(result.metadata.fileName).toBe("meu_arquivo.xlsx");
    });
  });

  describe("edge cases", () => {
    it("retorna resultado vazio para planilha vazia", () => {
      const data = [["Date", "Glucose"]];
      const result = parseCGMXlsx(createXlsxBuffer(data), "empty.xlsx");
      expect(result.readings.length).toBe(0);
      expect(result.errors[0]).toContain("insuficientes");
    });

    it("lida com buffer vazio graciosamente", () => {
      // ArrayBuffer(0) gera workbook vazio, nao erro de leitura
      const result = parseCGMXlsx(new ArrayBuffer(0), "bad.xlsx");
      expect(result.readings.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("detecta colunas por heuristica quando headers nao batem", () => {
      const data = [
        ["col_a", "col_b"],
        ["2026-01-15 08:00:00", 100],
      ];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      // Usa heuristica: col 0 = data, col 1 = glicose
      expect(result.readings.length).toBe(1);
    });

    it("processa varias leituras em sequencia", () => {
      const readings = Array.from({ length: 100 }, (_, i) => [
        `2026-01-15 ${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}:00`,
        80 + Math.floor(Math.random() * 80),
      ]);
      const data = [["Date", "Glucose"], ...readings];
      const result = parseCGMXlsx(createXlsxBuffer(data), "cgm.xlsx");
      expect(result.readings.length).toBe(100);
    });
  });
});

describe("cgmReadingsToSupabaseFormat", () => {
  it("converte leituras para formato Supabase", () => {
    const readings = [
      { glucose: 95, date: "2026-01-15", time: "08:30:00", measurementType: "cgm" as const, device: "SiSensing" },
      { glucose: 110, date: "2026-01-15", time: "09:00:00", measurementType: "cgm" as const },
    ];
    const result = cgmReadingsToSupabaseFormat(readings);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      glucose: 95,
      date: "2026-01-15",
      time: "08:30:00",
      type: "cgm",
      device: "SiSensing",
      notes: undefined,
    });
    expect(result[1].device).toBeUndefined();
  });
});
