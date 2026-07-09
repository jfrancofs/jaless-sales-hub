import type { Cliente } from '@/types/comercial';

function clienteLabel(cliente: Cliente) {
  return cliente.ruc ? `${cliente.razon_social} - ${cliente.ruc}` : cliente.razon_social;
}

type Props = {
  clientes: Cliente[];
  clienteId: string;
  onChange: (clienteId: string) => void;
  onNuevoCliente?: () => void;
  onEditarDescuentos?: () => void;
};

export function ClienteSelector({ clientes, clienteId, onChange, onNuevoCliente, onEditarDescuentos }: Props) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5 lg:col-span-2">
      <label className="block text-sm font-bold mb-2">Cliente</label>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
        <select className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-3" value={clienteId} onChange={(event) => onChange(event.target.value)}>
          <option value="">Sin cliente / sin descuento</option>
          {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{clienteLabel(cliente)}</option>)}
        </select>
        <button type="button" onClick={onNuevoCliente} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg px-4 py-3">
          + Nuevo cliente
        </button>
        <button type="button" onClick={onEditarDescuentos} disabled={!clienteId} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-lg px-4 py-3">
          Descuentos
        </button>
      </div>
      <div className="text-xs text-slate-400 mt-2">Clientes disponibles: {clientes.length}. Si no hay descuento configurado para una categoría, se aplica 0%.</div>
    </div>
  );
}
