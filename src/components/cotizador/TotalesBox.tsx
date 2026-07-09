import type { TotalesCotizacion } from '@/types/comercial';
import { money } from '@/lib/utils/format';

type Props = { totales: TotalesCotizacion };

export function TotalesBox({ totales }: Props) {
  return (
    <div className="mt-5 bg-slate-950 border border-slate-700 rounded-xl p-6 text-right space-y-2">
      <div>Subtotal: <b>{money(totales.subtotal)}</b></div>
      <div>IGV 18%: <b>{money(totales.igv)}</b></div>
      <div className="text-3xl font-bold">Total: {money(totales.total)}</div>
    </div>
  );
}
