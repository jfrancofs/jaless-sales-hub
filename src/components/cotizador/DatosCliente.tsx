import type { Cliente } from '@/types/comercial';

type Props = { cliente: Cliente | null };

export function DatosCliente({ cliente }: Props) {
  if (!cliente) return null;

  return (
    <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-700 p-5 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      <div><b>Razón social:</b> {cliente.razon_social}</div>
      <div><b>RUC:</b> {cliente.ruc || '-'}</div>
      <div className="md:col-span-2"><b>Dirección:</b> {cliente.direccion || '-'}</div>
      <div><b>Ciudad:</b> {cliente.ciudad || '-'}</div>
      <div><b>Condición:</b> {cliente.condicion_pago || 'Contado'}</div>
    </div>
  );
}
