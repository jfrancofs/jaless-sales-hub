-- JALESS ONE - SEED INICIAL
-- Este archivo contiene datos base opcionales.
-- El catálogo y los clientes reales se cargan con los scripts:
-- node scripts/reimportar-catalogo-inteligente.mjs data/lista-precios.xlsx
-- node scripts/importar-clientes-jaless.mjs data/clientes-jaless.xls

insert into clientes_comerciales (razon_social, ruc, direccion, ciudad, condicion_pago, estado)
values ('Cliente demo descuentos', '00000000000', 'Dirección demo', 'Lima', 'Contado', 'activo')
on conflict do nothing;

insert into descuentos_categoria_cliente (cliente_id, categoria, porcentaje)
select c.id, v.categoria, v.porcentaje
from clientes_comerciales c
cross join (values
  ('O''Rings', 25.00::numeric),
  ('Abrazaderas', 15.00::numeric),
  ('Seguros', 10.00::numeric),
  ('Pines de Expansión', 15.00::numeric),
  ('Pasadores de Horquilla', 15.00::numeric),
  ('Cordones', 20.00::numeric),
  ('Bonded Seal', 15.00::numeric),
  ('Billas de Acero', 15.00::numeric)
) as v(categoria, porcentaje)
where c.ruc = '00000000000'
on conflict (cliente_id, categoria) do update set porcentaje = excluded.porcentaje;
