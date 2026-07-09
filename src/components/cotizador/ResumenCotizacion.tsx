import { fechaCorta } from '@/lib/utils/format';

type Props = { numero: string };

export function ResumenCotizacion({ numero }: Props) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5">
      <div className="text-sm text-slate-400">Cotización</div>
      <div className="text-xl font-bold">{numero}</div>
      <div className="text-sm mt-2">Fecha: {fechaCorta()}</div>
    </div>
  );
}
