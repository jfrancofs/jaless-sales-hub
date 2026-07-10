import type { Cliente, CotizacionGuardada, ResultadoCotizacion, TotalesCotizacion } from '@/types/comercial';
import { money } from '@/lib/utils/format';

type Params = {
  numero: string;
  cliente?: Cliente | null;
  cotizacion?: CotizacionGuardada | null;
  resultados: ResultadoCotizacion[];
  observaciones?: string;
  totales: TotalesCotizacion;
  vendedor?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fechaActual() {
  return new Date().toLocaleDateString('es-PE');
}

export function abrirPdfCotizacion({ numero, cliente, cotizacion, resultados, observaciones, totales, vendedor }: Params) {
  const clienteNombre = cliente?.razon_social || cotizacion?.cliente_razon_social || 'Sin cliente';
  const ruc = cliente?.ruc || cotizacion?.cliente_ruc || '-';
  const direccion = cliente?.direccion || cotizacion?.cliente_direccion || '-';
  const ciudad = cliente?.ciudad || cotizacion?.cliente_ciudad || '-';
  const condicion = cliente?.condicion_pago || cotizacion?.condicion_pago || 'Contado';
  const obs = observaciones || cotizacion?.observaciones || 'Precios expresados en dólares americanos. Validez de la cotización: 7 días.';
  const vendedorNombre = vendedor || cotizacion?.vendedor || 'JALESS';

  const filas = resultados
    .filter((row) => row.estado === 'Exacto')
    .map((row) => `
      <tr>
        <td class="center">${row.item}</td>
        <td>${escapeHtml(row.codigo)}</td>
        <td>${escapeHtml(row.descripcion)}</td>
        <td class="right">${row.cantidad}</td>
        <td class="right">${money(Number(row.precioLista || 0))}</td>
        <td class="right">${Number(row.descuento || 0).toFixed(2)}%</td>
        <td class="right">${money(Number(row.precioFinal || 0))}</td>
        <td class="right bold">${money(Number(row.total || 0))}</td>
      </tr>
    `)
    .join('');

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(numero)} - JALESS IMPORT SAC</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111827; background: #f3f4f6; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 14mm; }
  .top { display: grid; grid-template-columns: 1fr auto; gap: 20px; border-bottom: 4px solid #0f172a; padding-bottom: 14px; }
  .brand { font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #0f172a; }
  .subtitle { margin-top: 4px; color: #334155; font-size: 12px; font-weight: 700; }
  .quote-box { border: 2px solid #0f172a; padding: 10px 14px; text-align: right; min-width: 230px; }
  .quote-title { font-size: 12px; color: #475569; font-weight: 700; }
  .quote-number { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
  .section { margin-top: 18px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; font-size: 12px; }
  .label { color: #475569; font-weight: 700; display: inline-block; min-width: 90px; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 11px; }
  th { background: #0f172a; color: #fff; padding: 8px 6px; border: 1px solid #0f172a; text-align: left; }
  td { padding: 7px 6px; border: 1px solid #cbd5e1; vertical-align: top; }
  .right { text-align: right; }
  .center { text-align: center; }
  .bold { font-weight: 800; }
  .totals { width: 300px; margin-left: auto; margin-top: 14px; font-size: 13px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #cbd5e1; }
  .total-final { font-size: 20px; font-weight: 900; color: #0f172a; }
  .obs { margin-top: 18px; border: 1px solid #cbd5e1; padding: 10px; min-height: 60px; font-size: 12px; }
  .footer { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; font-size: 11px; color: #475569; }
  .signature { margin-top: 38px; border-top: 1px solid #111827; padding-top: 6px; text-align: center; color: #111827; font-weight: 700; }
  .actions { position: fixed; top: 14px; right: 14px; display: flex; gap: 8px; }
  .actions button { border: 0; border-radius: 8px; padding: 10px 14px; font-weight: 800; cursor: pointer; }
  .print { background: #06b6d4; color: #001018; }
  .close { background: #e5e7eb; color: #111827; }
  @media print {
    body { background: #fff; }
    .page { margin: 0; width: auto; min-height: auto; padding: 10mm; }
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="actions">
    <button class="print" onclick="window.print()">Imprimir / Guardar PDF</button>
    <button class="close" onclick="window.close()">Cerrar</button>
  </div>
  <main class="page">
    <div class="top">
      <div>
        <div class="brand">JALESS IMPORT SAC</div>
        <div class="subtitle">Especialistas en todo el Perú</div>
      </div>
      <div class="quote-box">
        <div class="quote-title">COTIZACIÓN</div>
        <div class="quote-number">${escapeHtml(numero)}</div>
        <div style="margin-top:6px;font-size:12px;"><b>Fecha:</b> ${fechaActual()}</div>
      </div>
    </div>

    <section class="section grid">
      <div><span class="label">Cliente:</span> ${escapeHtml(clienteNombre)}</div>
      <div><span class="label">RUC:</span> ${escapeHtml(ruc)}</div>
      <div><span class="label">Dirección:</span> ${escapeHtml(direccion)}</div>
      <div><span class="label">Ciudad:</span> ${escapeHtml(ciudad)}</div>
      <div><span class="label">Moneda:</span> Dólares Americanos (US$)</div>
      <div><span class="label">Condición:</span> ${escapeHtml(condicion)}</div>
      <div><span class="label">Vendedor:</span> ${escapeHtml(vendedorNombre)}</div>
    </section>

    <table>
      <thead>
        <tr>
          <th style="width:45px;">Item</th>
          <th style="width:95px;">Código</th>
          <th>Descripción</th>
          <th style="width:75px;" class="right">Cantidad</th>
          <th style="width:80px;" class="right">P. Unit.</th>
          <th style="width:70px;" class="right">Dscto.</th>
          <th style="width:80px;" class="right">P. Final</th>
          <th style="width:85px;" class="right">Total</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><b>${money(totales.subtotal)}</b></div>
      <div class="totals-row"><span>IGV 18%</span><b>${money(totales.igv)}</b></div>
      <div class="totals-row total-final"><span>Total</span><span>${money(totales.total)}</span></div>
    </div>

    <div class="obs">
      <b>Observaciones:</b><br />
      ${escapeHtml(obs)}
    </div>

    <div class="footer">
      <div>
        <b>Condiciones:</b><br />
        Precios expresados en dólares americanos. Cotización sujeta a disponibilidad y condiciones comerciales acordadas.
      </div>
      <div class="signature">${escapeHtml(vendedorNombre)}<br />JALESS IMPORT SAC</div>
    </div>
  </main>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=1024,height=768');
  if (!ventana) {
    throw new Error('El navegador bloqueó la ventana del PDF. Permite ventanas emergentes para localhost.');
  }

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
}
