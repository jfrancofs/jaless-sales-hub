'use client';

import { useCallback, useEffect, useState } from 'react';
import { obtenerDescuentosCliente } from '@/services/clientesService';

export function useDescuentosCliente(clienteId: string) {
  const [descuentos, setDescuentos] = useState<Record<string, number>>({});

  const recargarDescuentos = useCallback(async () => {
    if (!clienteId) {
      setDescuentos({});
      return;
    }

    try {
      const data = await obtenerDescuentosCliente(clienteId);
      setDescuentos(data);
    } catch (error) {
      console.error(error);
      setDescuentos({});
    }
  }, [clienteId]);

  useEffect(() => {
    recargarDescuentos();
  }, [recargarDescuentos]);

  return { descuentos, setDescuentos, recargarDescuentos };
}
