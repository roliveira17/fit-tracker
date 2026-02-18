"use client";

import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useImportLogic } from "@/hooks/useImportLogic";
import {
  ImportHeroHeader,
  ActiveSourceCard,
  ConnectMoreGrid,
  ImportHistoryTable,
} from "@/components/import/calma";
import {
  BarcodeScanner,
  ScannedProductCard,
} from "@/components/import/BarcodeScanner";
import type { SourceType } from "@/hooks/useImportLogic";

/**
 * Pagina de Importacao de Dados — "Importar com Calma"
 */
export default function ImportPage() {
  const {
    isLoading,
    importStatus,
    importStats,
    history,
    showScanner,
    scannedProduct,
    expandedSource,
    setExpandedSource,
    setShowScanner,
    setScannedProduct,
    handleFileSelect,
    handleDismissResult,
    handleProductScanned,
    handleAddScannedProduct,
  } = useImportLogic();

  if (isLoading) {
    return (
      <ScreenContainer className="">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-calma-primary border-t-transparent" />
            <p className="text-calma-text-muted">Carregando...</p>
          </div>
        </div>
      </ScreenContainer>
    );
  }

  const isProcessing = importStatus === "processing";

  const toggleSource = (source: SourceType) => {
    if (isProcessing && expandedSource !== source) return;
    setExpandedSource(expandedSource === source ? null : source);
  };

  return (
    <ScreenContainer className="">
      <div className="flex flex-1 flex-col">
        {/* Hero header with top bar */}
        <div className="-mx-6">
          <ImportHeroHeader />
        </div>

        <div className="flex flex-col gap-8 pb-4">
          {/* Active Sources */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-calma-text">
                Active Sources
              </h2>
              <span className="text-xs bg-calma-accent-20 text-calma-primary px-2 py-1 rounded-full font-medium">
                Running Smoothly
              </span>
            </div>
            <div className="space-y-4">
              <ActiveSourceCard
                source="apple_health"
                isExpanded={expandedSource === "apple_health"}
                onToggle={() => toggleSource("apple_health")}
                importStatus={importStatus}
                importStats={importStats}
                onFileSelect={handleFileSelect}
                onDismissResult={handleDismissResult}
                isProcessing={isProcessing}
              />
              <ActiveSourceCard
                source="hevy"
                isExpanded={expandedSource === "hevy"}
                onToggle={() => toggleSource("hevy")}
                importStatus={importStatus}
                importStats={importStats}
                onFileSelect={handleFileSelect}
                onDismissResult={handleDismissResult}
                isProcessing={isProcessing}
              />
              <ActiveSourceCard
                source="cgm"
                isExpanded={expandedSource === "cgm"}
                onToggle={() => toggleSource("cgm")}
                importStatus={importStatus}
                importStats={importStats}
                onFileSelect={handleFileSelect}
                onDismissResult={handleDismissResult}
                isProcessing={isProcessing}
              />
              <ActiveSourceCard
                source="barcode"
                isExpanded={false}
                onToggle={() => setShowScanner(true)}
                importStatus={importStatus}
                importStats={importStats}
                onFileSelect={handleFileSelect}
                onDismissResult={handleDismissResult}
                onScannerOpen={() => setShowScanner(true)}
                isProcessing={isProcessing}
              />
            </div>
          </section>

          {/* Connect More */}
          <ConnectMoreGrid />

          {/* Import History */}
          <ImportHistoryTable records={history} />
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onProductScanned={handleProductScanned}
          onError={(error) => console.error("Scanner error:", error)}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scanned Product Card */}
      {scannedProduct && (
        <ScannedProductCard
          product={scannedProduct}
          onAddToMeal={handleAddScannedProduct}
          onScanAnother={() => {
            setScannedProduct(null);
            setShowScanner(true);
          }}
          onClose={() => setScannedProduct(null)}
        />
      )}
    </ScreenContainer>
  );
}
