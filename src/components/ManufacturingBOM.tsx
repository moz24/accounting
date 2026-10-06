import React, { useState } from 'react';
import { Archive, Plus, Play, CheckCircle2, AlertTriangle, Layers, Box, Hammer, ArrowRight } from 'lucide-react';
import { BillOfMaterials, ProductionOrder, InventoryItem } from '../types/accounting';
import { INITIAL_BOM } from '../data/angolaPgcData';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface ManufacturingBOMProps {
  inventory: InventoryItem[];
  locale?: Locale;
  onExecuteProduction: (bom: BillOfMaterials, quantityToProduce: number) => void;
}

export const ManufacturingBOM: React.FC<ManufacturingBOMProps> = ({
  inventory,
  locale = 'pt',
  onExecuteProduction,
}) => {
  const t = TRANSLATIONS[locale];
  const [bom, setBom] = useState<BillOfMaterials>(INITIAL_BOM);
  const [productionQty, setProductionQty] = useState<number>(40); // e.g. 40 batches (800 sacks)
  const [productionHistory, setProductionHistory] = useState<ProductionOrder[]>([
    {
      id: 'PO-2026-001',
      orderNumber: 'OP AGT2026/001',
      bomId: INITIAL_BOM.id,
      finishedGoodName: INITIAL_BOM.finishedGoodName,
      quantityToProduce: 1000,
      status: 'COMPLETED',
      startDate: '2026-10-01',
      completionDate: '2026-10-02',
      actualScrapProduced: 12,
      totalProductionCost: 3045000,
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Finished good item
  const finishedGood = inventory.find((i) => i.id === bom.finishedGoodId);

  // Calculate material requirements for the specified batch run
  const batchMultiplier = productionQty / bom.batchYieldQuantity;

  const handleRunProduction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onExecuteProduction(bom, productionQty);

      const newOrder: ProductionOrder = {
        id: `PO-${Date.now().toString().slice(-4)}`,
        orderNumber: `OP AGT2026/${(productionHistory.length + 1).toString().padStart(3, '0')}`,
        bomId: bom.id,
        finishedGoodName: bom.finishedGoodName,
        quantityToProduce: productionQty,
        status: 'COMPLETED',
        startDate: new Date().toISOString().split('T')[0],
        completionDate: new Date().toISOString().split('T')[0],
        actualScrapProduced: Math.round(productionQty * 0.02),
        totalProductionCost: productionQty * bom.totalUnitCost,
      };

      setProductionHistory([newOrder, ...productionHistory]);
      setIsProcessing(false);
      setSuccessMessage(locale === 'pt' 
        ? `Ordem de Produção ${newOrder.orderNumber} executada com sucesso! Stock de matérias-primas baixado e ${productionQty} unidades de ${bom.finishedGoodName} adicionadas ao Armazém.`
        : `Production Order ${newOrder.orderNumber} successfully executed! Raw materials backflushed and ${productionQty} units of ${bom.finishedGoodName} added to warehouse.`);
      setTimeout(() => setSuccessMessage(''), 6000);
    }, 600);
  };

  return (
    <div className="space-y-3">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <Archive className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.mfgTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.mfgSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs bg-[#001733] text-amber-300 border border-[#002d62]">
            MÓDULO INDUSTRIAL PGC (CLASSE 2 & 7)
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-2.5 rounded-xs bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Layout: BOM Details + Run Production Order Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: BOM Structure & Components (Span 2) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  Ficha Técnica Activa (Bill of Materials)
                </span>
                <h2 className="text-xs font-bold text-white font-mono">
                  {bom.finishedGoodName}
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  Código: {bom.bomCode} • Rendimento por Lote: {bom.batchYieldQuantity} unidades
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Custo Unitário Calculado:</span>
                <span className="text-sm font-bold font-mono-num text-amber-400">
                  {bom.totalUnitCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz / un
                </span>
              </div>
            </div>

            {/* Components Table */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                Matérias-Primas & Insumos Industriais Requeridos
              </div>

              <div className="overflow-x-auto">
                <table className="w-full accounting-grid text-xs">
                  <thead>
                    <tr>
                      <th className="w-24">Código</th>
                      <th>Matéria-Prima</th>
                      <th className="w-20 text-right">Qtd/Lote</th>
                      <th className="w-16 text-center">Unidade</th>
                      <th className="w-28 text-right">Custo Unit.</th>
                      <th className="w-20 text-right">Quebra %</th>
                      <th className="w-32 text-right">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-num">
                    {bom.components.map((comp) => (
                      <tr key={comp.itemId}>
                        <td className="text-slate-400">{comp.itemCode}</td>
                        <td className="font-sans font-medium text-slate-200">{comp.name}</td>
                        <td className="text-right text-white font-semibold">{comp.quantityRequired}</td>
                        <td className="text-center font-sans text-slate-400">{comp.unit}</td>
                        <td className="text-right text-slate-300">
                          {comp.unitCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                        </td>
                        <td className="text-right text-amber-400">
                          {comp.scrapPercent}%
                        </td>
                        <td className="text-right font-bold text-white">
                          {comp.totalCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overheads & Labor */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Mão-de-Obra Directa (MOD):</div>
                <div className="text-xs font-bold font-mono-num text-amber-400 mt-0.5">
                  {bom.laborCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz / lote
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Gastos Gerais Fabris (GGF):</div>
                <div className="text-xs font-bold font-mono-num text-amber-400 mt-0.5">
                  {bom.overheadCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz / lote
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Production Execution Terminal */}
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
            <div className="flex items-center space-x-2 text-white border-b border-slate-700 pb-1.5">
              <Hammer className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                Executar Ordem de Fabrico (OP)
              </h3>
            </div>

            <p className="text-[11px] text-slate-400">
              O motor deduzirá automaticamente as matérias-primas do armazém e creditará o produto acabado com valorização CMP.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-300 mb-1">
                  Quantidade a Produzir ({finishedGood?.unit || 'UN'})
                </label>
                <input
                  type="number"
                  min="20"
                  step="20"
                  value={productionQty}
                  onChange={(e) => setProductionQty(parseInt(e.target.value) || 20)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-xs font-mono-num text-white focus:outline-hidden focus:border-amber-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                  Equivale a {(productionQty / bom.batchYieldQuantity).toFixed(1)} lotes industriais completos.
                </span>
              </div>

              {/* Requirement Summary */}
              <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 space-y-1 text-xs font-mono-num">
                <div className="font-bold text-slate-300 mb-1 text-[10px] uppercase font-sans">Matérias a Consumir:</div>
                {bom.components.map((c) => {
                  const required = (c.quantityRequired * batchMultiplier).toFixed(2);
                  return (
                    <div key={c.itemId} className="flex justify-between text-slate-400 text-[11px]">
                      <span className="font-sans">{c.name}:</span>
                      <span className="font-semibold text-slate-200">
                        {required} {c.unit}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
                  <span className="font-sans text-[10px] uppercase">Custo Total:</span>
                  <span className="text-amber-400">
                    {(productionQty * bom.totalUnitCost).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunProduction}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-xs font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>
                  {isProcessing ? 'A Processar Baixas de Stock...' : 'Lançar Ordem de Fabrico'}
                </span>
              </button>
            </div>
          </div>

          {/* Recent Production History */}
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Ordens Recentes Concluídas
            </div>
            <div className="space-y-1.5 text-xs">
              {productionHistory.map((po) => (
                <div key={po.id} className="p-2 rounded-xs bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono-num font-bold text-white text-xs">{po.orderNumber}</div>
                    <div className="text-[10px] text-slate-400">{po.startDate} • {po.quantityToProduce} sacos</div>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 rounded-xs bg-emerald-950 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-800">
                      CONCLUÍDO
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
