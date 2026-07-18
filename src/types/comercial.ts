
export type VendedorJaless = {
  id: string;
  nombre: string;
  correo?: string | null;
  telefono?: string | null;
  rol: 'administrador' | 'supervisor' | 'vendedor';
  estado?: string | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
};

export type Producto = {
  codigo: string;
  descripcion: string;
  categoria: string;
  precio_usd_sin_igv: number | string;
  clave_busqueda: string;
};

export type Cliente = {
  id: string;
  razon_social: string;
  ruc?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  condicion_pago?: string | null;
  estado?: string | null;
};

export type ResultadoCotizacion = {
  item: number;
  estado: 'Exacto' | 'No encontrado' | 'Múltiples';
  codigo: string;
  descripcion: string;
  categoria: string;
  interpretado: string;
  clave: string;
  cantidad: number;
  precioLista: number;
  descuento: number;
  precioFinal: number;
  total: number;
  opciones?: Producto[];
};

export type TotalesCotizacion = {
  subtotal: number;
  igv: number;
  total: number;
};


export type CotizacionGuardada = {
  id: string;
  numero: string;
  fecha: string;
  cliente_id?: string | null;
  cliente_razon_social?: string | null;
  cliente_ruc?: string | null;
  cliente_direccion?: string | null;
  cliente_ciudad?: string | null;
  condicion_pago?: string | null;
  subtotal: number;
  igv: number;
  total: number;
  observaciones?: string | null;
  pedido_original?: string | null;
  estado: string;
  vendedor?: string | null;
};

export type CotizacionDetalleGuardada = {
  id: string;
  cotizacion_id: string;
  item: number;
  estado: string;
  codigo: string;
  descripcion: string;
  categoria: string;
  clave_busqueda: string;
  cantidad: number;
  precio_lista: number;
  descuento: number;
  precio_final: number;
  total: number;
};
