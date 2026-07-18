'use client';

import { useMemo, useRef, useState } from 'react';
import { construirLineasPedidoImagenDesdePalabras, construirLineasPedidoImagenDesdeTSV, convertirLineasATexto, extraerPalabrasDesdeBlocks, type EstadoLineaImagen, type LineaPedidoImagen } from '@/lib/ocr/pedidoImagen';

type Props = {
  open: boolean;
  onClose: () => void;
  onUsarPedido: (texto: string, modo: 'reemplazar' | 'agregar') => void;
};

type ImagenSeleccionada = {
  file: File;
  url: string;
};

const estilosEstado: Record<EstadoLineaImagen, string> = {
  Confirmado: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200',
  Revisar: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
  'No encontrado': 'border-red-500/50 bg-red-950/30 text-red-200',
};


async function prepararImagenParaOCR(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = bitmap.width < 1800 ? 3 : bitmap.width < 2800 ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    throw new Error('No se pudo preparar la imagen para OCR.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Alto contraste para tablas y capturas de Excel. Conserva letras y números,
  // pero aclara fondos y líneas tenues que suelen confundir a Tesseract.
  for (let i = 0; i < data.length; i += 4) {
    const gris = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    const ajustado = gris < 175 ? Math.max(0, gris - 35) : 255;
    data[i] = ajustado;
    data[i + 1] = ajustado;
    data[i + 2] = ajustado;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo convertir la imagen preparada.'));
    }, 'image/png', 1);
  });
}

type ResultadoOCRImagen = {
  text: string;
  tsv: string;
  lineasTabla: ReturnType<typeof construirLineasPedidoImagenDesdeTSV>;
};

export function PedidoImagenModal({ open, onClose, onUsarPedido }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imagenes, setImagenes] = useState<ImagenSeleccionada[]>([]);
  const [lineas, setLineas] = useState<LineaPedidoImagen[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [estadoProceso, setEstadoProceso] = useState('');
  const [error, setError] = useState('');

  const resumen = useMemo(() => {
    return {
      confirmadas: lineas.filter((linea) => linea.estado === 'Confirmado').length,
      revisar: lineas.filter((linea) => linea.estado === 'Revisar').length,
      noEncontradas: lineas.filter((linea) => linea.estado === 'No encontrado').length,
    };
  }, [lineas]);

  function seleccionarArchivos(files: FileList | null) {
    if (!files?.length) return;

    const nuevas = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));

    setImagenes((actuales) => [...actuales, ...nuevas]);
    setLineas([]);
    setError('');
  }

  function quitarImagen(index: number) {
    setImagenes((actuales) => {
      const copia = [...actuales];
      const [quitada] = copia.splice(index, 1);
      if (quitada) URL.revokeObjectURL(quitada.url);
      return copia;
    });
    setLineas([]);
  }

  async function procesarImagenes() {
    if (imagenes.length === 0) {
      setError('Selecciona al menos una imagen.');
      return;
    }

    setProcesando(true);
    setProgreso(0);
    setError('');
    setEstadoProceso('Preparando lector de imágenes...');

    try {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('spa', 1, {
        logger: (mensaje) => {
          if (typeof mensaje.progress === 'number') {
            setProgreso(Math.round(mensaje.progress * 100));
          }
          if (mensaje.status) setEstadoProceso(mensaje.status);
        },
      });

      await worker.setParameters({
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      });

      const resultadosOCR: ResultadoOCRImagen[] = [];
      for (let i = 0; i < imagenes.length; i += 1) {
        setEstadoProceso(`Preparando imagen ${i + 1} de ${imagenes.length}...`);
        const imagenPreparada = await prepararImagenParaOCR(imagenes[i].file);

        // En tablas, SINGLE_BLOCK conserva mejor las filas. Tesseract.js 6 solo
        // devuelve TSV cuando se solicita expresamente en el tercer argumento.
        await worker.setParameters({
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        });

        setEstadoProceso(`Leyendo tabla ${i + 1} de ${imagenes.length}...`);
        const resultadoTabla = await worker.recognize(
          imagenPreparada,
          { rotateAuto: true },
          { text: true, tsv: true, blocks: true }
        );
        const dataTabla = resultadoTabla.data as typeof resultadoTabla.data & {
          tsv?: string;
          blocks?: unknown;
        };
        const lineasTablaTSV = construirLineasPedidoImagenDesdeTSV(
          dataTabla.tsv || '',
          dataTabla.text || ''
        );
        const lineasTablaBlocks = construirLineasPedidoImagenDesdePalabras(
          extraerPalabrasDesdeBlocks(dataTabla.blocks),
          dataTabla.text || ''
        );
        const productosTSV = lineasTablaTSV.filter((linea) => linea.fuente === 'tabla').length;
        const productosBlocks = lineasTablaBlocks.filter((linea) => linea.fuente === 'tabla').length;
        const lineasTabla = productosBlocks > productosTSV ? lineasTablaBlocks : lineasTablaTSV;

        // Si no reconstruyó al menos tres productos de tabla, hacemos una segunda
        // pasada en modo disperso. Esto ayuda con fotos, listas y tablas con celdas vacías.
        const productosTabla = lineasTabla.filter((linea) => linea.fuente === 'tabla').length;
        if (productosTabla >= 4) {
          resultadosOCR.push({
            text: dataTabla.text || '',
            tsv: dataTabla.tsv || '',
            lineasTabla,
          });
          continue;
        }

        await worker.setParameters({
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        });

        setEstadoProceso(`Buscando celdas ${i + 1} de ${imagenes.length}...`);
        const resultadoDisperso = await worker.recognize(
          imagenPreparada,
          { rotateAuto: true },
          { text: true, tsv: true, blocks: true }
        );
        const dataDispersa = resultadoDisperso.data as typeof resultadoDisperso.data & {
          tsv?: string;
          blocks?: unknown;
        };
        const lineasDispersasTSV = construirLineasPedidoImagenDesdeTSV(
          dataDispersa.tsv || '',
          dataDispersa.text || ''
        );
        const lineasDispersasBlocks = construirLineasPedidoImagenDesdePalabras(
          extraerPalabrasDesdeBlocks(dataDispersa.blocks),
          dataDispersa.text || ''
        );
        const productosDispersosTSV = lineasDispersasTSV.filter((linea) => linea.fuente === 'tabla').length;
        const productosDispersosBlocks = lineasDispersasBlocks.filter((linea) => linea.fuente === 'tabla').length;
        const lineasDispersas =
          productosDispersosBlocks > productosDispersosTSV
            ? lineasDispersasBlocks
            : lineasDispersasTSV;

        const tablasA = lineasTabla.filter((linea) => linea.fuente === 'tabla').length;
        const tablasB = lineasDispersas.filter((linea) => linea.fuente === 'tabla').length;
        resultadosOCR.push({
          text: tablasB > tablasA ? dataDispersa.text || '' : dataTabla.text || '',
          tsv: tablasB > tablasA ? dataDispersa.tsv || '' : dataTabla.tsv || '',
          lineasTabla: tablasB > tablasA ? lineasDispersas : lineasTabla,
        });
      }

      await worker.terminate();
      const nuevasLineas = resultadosOCR.flatMap((resultado) => resultado.lineasTabla);
      setLineas(nuevasLineas);

      if (nuevasLineas.length === 0) {
        setError('No se pudo extraer texto. Prueba con una imagen más nítida o recórtala antes de cargarla.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.');
    } finally {
      setProcesando(false);
      setProgreso(0);
      setEstadoProceso('');
    }
  }

  function actualizarLinea(id: string, cambios: Partial<LineaPedidoImagen>) {
    setLineas((actuales) => actuales.map((linea) => (linea.id === id ? { ...linea, ...cambios } : linea)));
  }

  function eliminarLinea(id: string) {
    setLineas((actuales) => actuales.filter((linea) => linea.id !== id));
  }

  function aplicar(modo: 'reemplazar' | 'agregar') {
    const texto = convertirLineasATexto(lineas);
    if (!texto.trim()) {
      setError('No hay líneas para usar en el pedido.');
      return;
    }

    if (resumen.revisar > 0 || resumen.noEncontradas > 0) {
      const continuar = window.confirm(
        `Todavía hay ${resumen.revisar + resumen.noEncontradas} línea(s) que requieren revisión. ¿Deseas continuar de todos modos?`
      );
      if (!continuar) return;
    }

    onUsarPedido(texto, modo);
    limpiarYCerrar();
  }

  function limpiarYCerrar() {
    imagenes.forEach((imagen) => URL.revokeObjectURL(imagen.url));
    setImagenes([]);
    setLineas([]);
    setError('');
    setProgreso(0);
    setEstadoProceso('');
    onClose();
  }

  function cerrar() {
    if (procesando) return;
    limpiarYCerrar();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 p-4 overflow-y-auto">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-700 p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.35em] text-cyan-400">JALESS AI VISION</p>
            <h2 className="mt-2 text-3xl font-bold">Leer pedido desde imagen</h2>
            <p className="mt-2 text-sm text-slate-300">Carga fotos, capturas de Excel o listas manuscritas. Revisa el resultado antes de cotizar.</p>
          </div>
          <button type="button" onClick={cerrar} className="rounded-xl bg-slate-800 px-4 py-2 font-bold hover:bg-slate-700">Cerrar</button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(event) => seleccionarArchivos(event.target.files)}
              />
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl bg-cyan-500 px-4 py-3 font-bold text-black hover:bg-cyan-400">Cargar / tomar foto</button>
                <button type="button" onClick={procesarImagenes} disabled={procesando || imagenes.length === 0} className="rounded-xl bg-emerald-500 px-4 py-3 font-bold text-black hover:bg-emerald-400 disabled:opacity-50">{procesando ? 'Leyendo...' : 'Leer imágenes'}</button>
              </div>
              <p className="mt-3 text-xs text-slate-400">Para manuscritos, usa buena luz, enfoca de frente y evita sombras. La revisión humana es obligatoria.</p>
            </div>

            {procesando && (
              <div className="rounded-2xl border border-cyan-700 bg-cyan-950/30 p-4">
                <div className="flex justify-between text-sm"><span>{estadoProceso || 'Procesando...'}</span><b>{progreso}%</b></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${progreso}%` }} /></div>
              </div>
            )}

            {error && <div className="rounded-xl border border-red-500 bg-red-950/40 p-4 text-red-200">{error}</div>}

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {imagenes.map((imagen, index) => (
                <div key={`${imagen.file.name}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
                  <img src={imagen.url} alt={imagen.file.name} className="max-h-72 w-full rounded-xl object-contain bg-black" />
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-300">
                    <span className="truncate">{imagen.file.name}</span>
                    <button type="button" onClick={() => quitarImagen(index)} className="text-red-300 hover:text-red-200">Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-700 bg-emerald-950/30 p-3"><div className="text-xs text-slate-300">Confirmadas</div><div className="text-2xl font-bold text-emerald-300">{resumen.confirmadas}</div></div>
              <div className="rounded-xl border border-amber-700 bg-amber-950/30 p-3"><div className="text-xs text-slate-300">Revisar</div><div className="text-2xl font-bold text-amber-300">{resumen.revisar}</div></div>
              <div className="rounded-xl border border-red-700 bg-red-950/30 p-3"><div className="text-xs text-slate-300">No encontrado</div><div className="text-2xl font-bold text-red-300">{resumen.noEncontradas}</div></div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden">
              <div className="grid grid-cols-[125px_1fr_72px] gap-3 bg-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-300">
                <span>Estado</span><span>Texto detectado / editable</span><span>Acción</span>
              </div>
              <div className="max-h-[610px] overflow-y-auto">
                {lineas.length === 0 && <div className="p-8 text-center text-slate-400">Carga imágenes y presiona “Leer imágenes”.</div>}
                {lineas.map((linea) => (
                  <div key={linea.id} className="grid grid-cols-1 gap-3 border-t border-slate-800 p-4 md:grid-cols-[125px_1fr_72px]">
                    <select
                      value={linea.estado}
                      onChange={(event) => actualizarLinea(linea.id, { estado: event.target.value as EstadoLineaImagen })}
                      className={`h-11 rounded-xl border px-2 text-xs font-bold ${estilosEstado[linea.estado]}`}
                    >
                      <option value="Confirmado">Confirmado</option>
                      <option value="Revisar">Revisar</option>
                      <option value="No encontrado">No encontrado</option>
                    </select>
                    <div>
                      <input
                        value={linea.texto}
                        onChange={(event) => actualizarLinea(linea.id, { texto: event.target.value })}
                        className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 font-mono text-sm"
                      />
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                        {linea.original !== linea.texto && <span>Original OCR: {linea.original}</span>}
                        {typeof linea.confianza === 'number' && <span>Confianza: {linea.confianza}%</span>}
                        {linea.fuente && <span>Modo: {linea.fuente === 'tabla' ? 'tabla' : 'texto'}</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => eliminarLinea(linea.id)} className="h-11 rounded-xl border border-red-700 px-2 text-xs font-bold text-red-300 hover:bg-red-950/40">Quitar</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row">
              <button type="button" onClick={() => aplicar('agregar')} disabled={lineas.length === 0} className="rounded-xl bg-slate-700 px-6 py-3 font-bold hover:bg-slate-600 disabled:opacity-50">Agregar al pedido actual</button>
              <button type="button" onClick={() => aplicar('reemplazar')} disabled={lineas.length === 0} className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-black hover:bg-cyan-400 disabled:opacity-50">Usar como nuevo pedido</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
