import type { Cliente, ResultadoCotizacion, TotalesCotizacion } from '@/types/comercial';
import { fechaArchivo, fechaCorta } from '@/lib/utils/format';

type Params = {
  resultados: ResultadoCotizacion[];
  cliente: Cliente | null;
  numero: string;
  observaciones: string;
  totales: TotalesCotizacion;
  vendedor?: string;
};

export async function exportarExcelCotizacion({ resultados, cliente, numero, observaciones, totales, vendedor }: Params) {
  const XLSX = await import('xlsx');
  const clienteNombre = cliente?.razon_social || 'Sin cliente';
  const ciudad = cliente?.ciudad || '';
  const ruc = cliente?.ruc || '';
  const direccion = cliente?.direccion || '';
  const condicion = cliente?.condicion_pago || 'Contado';

  const header = [
    ['JALESS IMPORT SAC'],
    ['Cotización Comercial - Todo el Perú'],
    [],
    ['N° Cotización:', numero, '', 'Fecha:', fechaCorta()],
    ['Cliente:', clienteNombre, '', 'RUC:', ruc],
    ['Dirección:', direccion, '', 'Ciudad:', ciudad],
    ['Moneda:', 'Dólares Americanos (US$)', '', 'Condición:', condicion],
    ['Vendedor:', vendedor || 'JALESS', '', '', ''],
    [],
    ['Ítem', 'Código', 'Descripción', 'Cantidad', 'P. Unit. (US$)', 'Dscto. %', 'P. Final (US$)', 'Total (US$)'],
  ];

  const body = resultados.map((row) => [row.item, row.codigo, row.descripcion, row.cantidad, row.precioLista, row.descuento, row.precioFinal, row.total]);
  const footerStart = header.length + body.length + 2;
  const data = [
    ...header,
    ...body,
    [],
    ['', '', '', '', '', '', 'Subtotal:', totales.subtotal],
    ['', '', '', '', '', '', 'IGV (18%):', totales.igv],
    ['', '', '', '', '', '', 'Total General:', totales.total],
    [],
    ['Observaciones:', observaciones],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 52 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 16 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: footerStart + 3, c: 1 }, e: { r: footerStart + 3, c: 7 } },
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      if (c >= 4 || c === 3) {
        if (r >= 9 && typeof ws[addr].v === 'number') ws[addr].z = c === 3 ? '0' : '0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Cotización');
  XLSX.writeFile(wb, `Cotizacion_Jaless_${fechaArchivo()}.xlsx`);
}
