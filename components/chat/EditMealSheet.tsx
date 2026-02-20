"use client";

import { useState, useCallback, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";

export interface EditableFoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface EditMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  foods: EditableFoodItem[];
  onSave: (foods: EditableFoodItem[]) => void;
}

export function EditMealSheet({ isOpen, onClose, foods, onSave }: EditMealSheetProps) {
  const [items, setItems] = useState<EditableFoodItem[]>(foods);

  // Sync items when foods prop changes (sheet reopens)
  useEffect(() => {
    if (foods.length > 0) {
      setItems(foods);
    }
  }, [foods]);

  const updateItem = useCallback((index: number, field: keyof EditableFoodItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = items.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = items.reduce((sum, item) => sum + item.fat, 0);

  const handleSave = () => {
    onSave(items);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Editar Refeição">
      {/* Food items */}
      <div className="space-y-4 mb-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(i, "name", e.target.value)}
                className="w-full bg-transparent text-gray-800 font-medium text-[15px] border-none p-0 focus:ring-0 focus:outline-none"
                placeholder="Nome do alimento"
              />
              <input
                type="text"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                className="w-full bg-transparent text-[#816965] text-sm border-none p-0 focus:ring-0 focus:outline-none"
                placeholder="Quantidade (ex: 150g)"
              />
              <div className="flex gap-3 text-[11px] text-[#816965]">
                <span>{item.calories} kcal</span>
                <span>{item.protein}g prot</span>
                <span>{item.carbs}g carb</span>
                <span>{item.fat}g gord</span>
              </div>
            </div>
            <button
              onClick={() => removeItem(i)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors shrink-0 mt-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-center text-[#816965] text-sm py-4">
            Nenhum alimento. Adicione via chat.
          </p>
        )}
      </div>

      {/* Totals */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-[#816965] uppercase tracking-wide">Total</span>
          <span className="font-serif-display text-xl text-gray-800">{totalCalories} kcal</span>
        </div>
        <div className="flex gap-4 text-xs text-[#816965]">
          <span>{totalProtein}g prot</span>
          <span>{totalCarbs}g carb</span>
          <span>{totalFat}g gord</span>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={items.length === 0}
        className="w-full bg-[#d46211] hover:bg-[#b8550e] active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-[#d46211]/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[20px]">check_circle</span>
        Salvar no Diário
      </button>
    </BottomSheet>
  );
}
