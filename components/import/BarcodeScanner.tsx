"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { lookupBarcode } from "@/lib/barcode-cache";
import { offProductToMealItem, isLiquidProduct, type NormalizedProduct } from "@/lib/openfoodfacts";

interface BarcodeScannerProps {
  onProductScanned: (product: NormalizedProduct) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({
  onProductScanned,
  onError,
  onClose,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Verificando cache...");
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Loading states progressivos
  useEffect(() => {
    if (isLoading) {
      setLoadingMessage("Verificando cache...");
      const t1 = setTimeout(() => setLoadingMessage("Buscando no Open Food Facts..."), 1000);
      const t2 = setTimeout(() => setLoadingMessage("Conexao lenta... aguarde"), 3000);
      loadingTimersRef.current = [t1, t2];
    } else {
      loadingTimersRef.current.forEach(clearTimeout);
      loadingTimersRef.current = [];
    }
    return () => {
      loadingTimersRef.current.forEach(clearTimeout);
      loadingTimersRef.current = [];
    };
  }, [isLoading]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Ignora erros ao parar
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScan = useCallback(
    async (decodedText: string) => {
      // Evita processar o mesmo código múltiplas vezes
      if (decodedText === lastScannedCode || isLoading) {
        return;
      }

      setLastScannedCode(decodedText);
      setIsLoading(true);
      setError(null);

      // Para o scanner enquanto busca
      await stopScanner();

      try {
        console.log("Barcode escaneado:", decodedText);

        const { product, source } = await lookupBarcode(decodedText);

        if (product) {
          console.log(`Produto encontrado (${source}):`, product.productName);
          onProductScanned(product);
        } else {
          setError(`Produto não encontrado: ${decodedText}`);
          onError?.(`Produto não encontrado: ${decodedText}`);

          // Permite escanear novamente após 2s
          setTimeout(() => {
            setLastScannedCode(null);
            setError(null);
          }, 2000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao buscar produto";
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    },
    [lastScannedCode, isLoading, stopScanner, onProductScanned, onError]
  );

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current) {
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode("barcode-scanner-container", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Câmera traseira
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        handleScan,
        () => {} // Ignora erros de decodificação (normal quando não há barcode)
      );

      setIsScanning(true);
      setCameraPermission("granted");
      setError(null);
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);

      if (err instanceof Error) {
        if (err.message.includes("Permission denied") || err.message.includes("NotAllowedError")) {
          setCameraPermission("denied");
          setError("Permissão de câmera negada. Por favor, permita o acesso à câmera.");
        } else if (err.message.includes("NotFoundError")) {
          setError("Nenhuma câmera encontrada no dispositivo.");
        } else {
          setError(`Erro ao acessar câmera: ${err.message}`);
        }
      }
    }
  }, [handleScan]);

  // Inicia scanner ao montar
  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <header className="flex items-center justify-between bg-black/80 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">Escanear Código de Barras</h2>
        <button
          type="button"
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="rounded-full p-2 text-white hover:bg-white/10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* Scanner Area */}
      <div className="relative flex flex-1 items-center justify-center">
        <div
          id="barcode-scanner-container"
          ref={containerRef}
          className="h-full w-full"
        />

        {/* Overlay com guia */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[150px] w-[250px]">
              {/* Cantos do guia */}
              <div className="absolute left-0 top-0 h-6 w-6 border-l-4 border-t-4 border-primary" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-4 border-t-4 border-primary" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-primary" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-primary" />

              {/* Linha de scan animada */}
              <div className="absolute left-2 right-2 top-1/2 h-0.5 animate-pulse bg-primary" />
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="mb-4 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-white">{loadingMessage}</p>
            {loadingMessage.includes("lenta") && (
              <button
                type="button"
                onClick={() => {
                  setIsLoading(false);
                  setLastScannedCode(null);
                  startScanner();
                }}
                className="mt-4 rounded-lg bg-white/20 px-6 py-2 text-sm font-medium text-white hover:bg-white/30"
              >
                Cancelar
              </button>
            )}
          </div>
        )}

        {/* Error overlay */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-8">
            <span className="material-symbols-outlined mb-4 text-5xl text-error">error</span>
            <p className="mb-4 text-center text-white">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLastScannedCode(null);
                startScanner();
              }}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-black"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Permission denied */}
        {cameraPermission === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-8">
            <span className="material-symbols-outlined mb-4 text-5xl text-warning">
              videocam_off
            </span>
            <p className="mb-2 text-center text-lg font-semibold text-white">
              Acesso à câmera negado
            </p>
            <p className="mb-6 text-center text-sm text-white/70">
              Para escanear códigos de barras, permita o acesso à câmera nas configurações do navegador.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/20 px-6 py-2 font-medium text-white"
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* Footer com instruções */}
      <footer className="bg-black/80 px-4 py-4 text-center">
        <p className="text-sm text-white/70">
          Posicione o código de barras dentro da área marcada
        </p>
      </footer>
    </div>
  );
}

/**
 * Componente de resultado do scan
 */
interface ScannedProductCardProps {
  product: NormalizedProduct;
  onAddToMeal: (grams: number) => void;
  onScanAnother: () => void;
  onClose: () => void;
}

export function ScannedProductCard({
  product,
  onAddToMeal,
  onScanAnother,
  onClose,
}: ScannedProductCardProps) {
  const [grams, setGrams] = useState(100);
  const unit = isLiquidProduct(product) ? "ml" : "g";
  const mealItem = offProductToMealItem(product, grams);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-dark border border-white/5 p-6">
        {/* Header com imagem */}
        <div className="mb-4 flex items-start gap-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="size-20 rounded-lg bg-white/10 object-contain"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-lg bg-white/10">
              <span className="material-symbols-outlined text-3xl text-white/40">
                inventory_2
              </span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{product.productName}</h3>
            {product.brand && (
              <p className="text-sm text-white/60">{product.brand}</p>
            )}
            {product.quantity && (
              <p className="text-xs text-white/40">{product.quantity}</p>
            )}

            {/* Badges */}
            <div className="mt-2 flex gap-2">
              {product.nutriscore && (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    product.nutriscore === "A"
                      ? "bg-green-500/20 text-green-400"
                      : product.nutriscore === "B"
                        ? "bg-lime-500/20 text-lime-400"
                        : product.nutriscore === "C"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : product.nutriscore === "D"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                  }`}
                >
                  Nutri-Score {product.nutriscore}
                </span>
              )}
              {product.novaGroup && (
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  NOVA {product.novaGroup}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Seletor de quantidade */}
        <div className="mb-4">
          <label className="mb-2 block text-sm text-white/60">Quantidade ({unit})</label>
          <div className="flex items-center gap-2">
            {[50, 100, 150, 200].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrams(g)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  grams === g
                    ? "bg-primary text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {g}{unit}
              </button>
            ))}
          </div>
        </div>

        {/* Nutrição */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-primary">{mealItem.calories}</p>
            <p className="text-xs text-white/60">kcal</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-white">{mealItem.protein}g</p>
            <p className="text-xs text-white/60">Proteína</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-white">{mealItem.carbs}g</p>
            <p className="text-xs text-white/60">Carbs</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-white">{mealItem.fat}g</p>
            <p className="text-xs text-white/60">Gordura</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onScanAnother}
            className="flex-1 rounded-lg bg-white/10 py-3 font-medium text-white hover:bg-white/20"
          >
            Escanear outro
          </button>
          <button
            type="button"
            onClick={() => onAddToMeal(grams)}
            className="flex-1 rounded-lg bg-primary py-3 font-medium text-black hover:bg-primary/90"
          >
            Adicionar
          </button>
        </div>

        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm text-white/40 hover:text-white/60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
