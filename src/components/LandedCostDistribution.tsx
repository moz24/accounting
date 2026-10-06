import React, { useState } from 'react';
import { Ship, CheckCircle2, Calculator } from 'lucide-react';
import { LandedCostImport, InventoryItem } from '../types/accounting';
import { INITIAL_LANDED_COST } from '../data/angolaPgcData';
import { Locale, TRANSLATIONS } from '../lib/translations';

interface LandedCostDistributionProps {
  inventory: InventoryItem[];
  locale?: Locale;
  onApplyLandedCost: (landedCost: LandedCostImport) => void;
}

export const LandedCostDistribution: React.FC<LandedCostDistributionProps> = ({
  inventory,
  locale = 'pt',
  onApplyLandedCost,
}) => {
  const t = TRANSLATIONS[locale];
  const [landedCost] = useState<LandedCostImport>(INITIAL_LANDED_COST);
  const [allocationMethod, setAllocationMethod] = useState<'BY_VALUE' | 'BY_WEIGHT'>('BY_VALUE');
  const [isApplied, setIsApplied] = useState(false);

  // Recalculate totals
  const totalExtra = 
    landedCost.seaFreightCost + 
    landedCost.customsDuty + 
    landedCost.portTerminalFees + 
    landedCost.marineInsurance;

  // Dynamically compute allocation based on BY_VALUE vs BY_WEIGHT
  const computedItemsAllocated = landedCost.itemsAllocated.map((item) => {
    const inv = inventory.find((i) => i.id === item.itemId);
    const weightPerUnit = inv?.weightKg || (item.itemCode === 'VAR-12MM' ? 10.6 : 7.2);
    const totalLineValue = item.quantity * item.originalCost;
    const totalLineWeight = item.quantity * weightPerUnit;

    return {
      ...item,
      totalLineValue,
      totalLineWeight,
      weightPerUnit,
    };
  });

  const totalShipmentValue = computedItemsAllocated.reduce((s, i) => s + i.totalLineValue, 0);
  const totalShipmentWeight = computedItemsAllocated.reduce((s, i) => s + i.totalLineWeight, 0);

  const dynamicItemsAllocated = computedItemsAllocated.map((item) => {
    let allocatedTotal = 0;
    if (allocationMethod === 'BY_VALUE') {
      allocatedTotal = totalShipmentValue > 0 ? (item.totalLineValue / totalShipmentValue) * totalExtra : 0;
    } else {
      allocatedTotal = totalShipmentWeight > 0 ? (item.totalLineWeight / totalShipmentWeight) * totalExtra : 0;
    }

    const allocatedCostPerUnit = Math.round(allocatedTotal / item.quantity);
    const newUnitCmpCost = item.originalCost + allocatedCostPerUnit;

    return {
      itemId: item.itemId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      originalCost: item.originalCost,
      allocatedCostPerUnit,
      newUnitCmpCost,
      quantity: item.quantity,
    };
  });

  const handleApply = () => {
    onApplyLandedCost({
      ...landedCost,
      totalExtraCost: totalExtra,
      allocationMethod,
      itemsAllocated: dynamicItemsAllocated,
    });
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 5000);
  };

  return (
    <div className="space-y-3">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#002244] border border-[#003366] rounded-xs px-3 py-2 text-white shadow-xs">
        <div className="flex items-center space-x-2">
          <Ship className="w-4 h-4 text-amber-400" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider font-mono">
              {t.lcTitle}
            </h1>
            <p className="text-[10px] text-slate-300">
              {t.lcSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs bg-[#001733] text-amber-300 border border-[#002d62]">
            {t.lcBadge}
          </span>
        </div>
      </div>

      {isApplied && (
        <div className="p-2.5 rounded-xs bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.lcSuccessNotice}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Shipment & Expenses Sheet (Span 2) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {t.lcBillOfLading}
                </span>
                <h2 className="text-xs font-bold text-white font-mono">
                  {landedCost.shipmentReference}
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  {landedCost.portOfEntry} • {t.lcBroker} {landedCost.customsBroker}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.lcExtraExpenses}</span>
                <span className="text-sm font-bold font-mono-num text-amber-400">
                  {totalExtra.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                </span>
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-num">
              <div className="p-2 bg-slate-950 rounded-xs border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-sans font-medium">{t.lcSeaFreight}</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {landedCost.seaFreightCost.toLocaleString('pt-AO')} Kz
                </div>
              </div>

              <div className="p-2 bg-slate-950 rounded-xs border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-sans font-medium">{t.lcCustomsDuty}</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {landedCost.customsDuty.toLocaleString('pt-AO')} Kz
                </div>
              </div>

              <div className="p-2 bg-slate-950 rounded-xs border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-sans font-medium">{t.lcTerminalFees}</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {landedCost.portTerminalFees.toLocaleString('pt-AO')} Kz
                </div>
              </div>

              <div className="p-2 bg-slate-950 rounded-xs border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-sans font-medium">{t.lcInsurance}</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {landedCost.marineInsurance.toLocaleString('pt-AO')} Kz
                </div>
              </div>
            </div>

            {/* Items Allocated Table */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {t.lcItemsTableTitle}
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">{t.lcAllocationMethod}</span>
                  <select
                    value={allocationMethod}
                    onChange={(e) => setAllocationMethod(e.target.value as any)}
                    className="bg-slate-950 text-white border border-slate-700 rounded-xs px-2 py-0.5 text-xs focus:outline-hidden font-medium"
                  >
                    <option value="BY_VALUE">{t.lcByValue}</option>
                    <option value="BY_WEIGHT">{t.lcByWeight}</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full accounting-grid text-xs">
                  <thead>
                    <tr>
                      <th>{t.lcColItem}</th>
                      <th className="w-20 text-right">{t.lcColQty}</th>
                      <th className="w-32 text-right">{t.lcColFobCost}</th>
                      <th className="w-32 text-right">{t.lcColExtraPerUnit}</th>
                      <th className="w-36 text-right">{t.lcColNewCmp}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-num">
                    {dynamicItemsAllocated.map((item) => (
                      <tr key={item.itemId}>
                        <td className="font-sans">
                          <div className="font-bold text-slate-200">{item.itemName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{item.itemCode}</div>
                        </td>
                        <td className="text-right text-white font-semibold">{item.quantity}</td>
                        <td className="text-right text-slate-300">
                          {item.originalCost.toLocaleString('pt-AO')} Kz
                        </td>
                        <td className="text-right text-amber-400 font-semibold">
                          +{item.allocatedCostPerUnit.toLocaleString('pt-AO')} Kz
                        </td>
                        <td className="text-right font-bold text-emerald-400">
                          {item.newUnitCmpCost.toLocaleString('pt-AO')} Kz
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Accounting Entry Preview & Execution */}
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-700 rounded-xs p-3 space-y-3">
            <div className="flex items-center space-x-2 text-white border-b border-slate-700 pb-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                {t.lcPgcEntryTitle}
              </h3>
            </div>

            <p className="text-[11px] text-slate-400">
              {t.lcPgcEntryDesc}
            </p>

            <div className="p-2.5 bg-slate-950 rounded-xs border border-slate-800 space-y-1.5 text-xs font-mono-num">
              <div className="flex justify-between text-slate-300 font-bold">
                <span className="font-sans">D: 21.1 {locale === 'pt' ? 'Compras Mercadorias' : 'Purchases Merchandise'}</span>
                <span className="text-emerald-400">+{totalExtra.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-3 text-[11px]">
                <span className="font-sans">C: 32.1 {locale === 'pt' ? 'Despachante Aduaneiro' : 'Customs Broker'}</span>
                <span>{landedCost.customsDuty.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-3 text-[11px]">
                <span className="font-sans">C: 32.1 {locale === 'pt' ? 'Armador Maersk Line' : 'Maersk Shipping Line'}</span>
                <span>{landedCost.seaFreightCost.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between text-slate-400 pl-3 text-[11px]">
                <span className="font-sans">C: 32.1 {locale === 'pt' ? 'Porto de Luanda DPW' : 'Port of Luanda DPW'}</span>
                <span>{landedCost.portTerminalFees.toLocaleString('pt-AO')} Kz</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2 px-3 rounded-xs font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.lcApplyBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
