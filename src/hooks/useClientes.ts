'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Cliente } from '@/types/comercial';
import { listarClientes } from '@/services/clientesService';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const recargarClientes = useCallback(async () => {
    try {
      const data = await listarClientes();
      setClientes(data);
    } catch (error) {
      console.error(error);
      setClientes([]);
    }
  }, []);

  useEffect(() => {
    recargarClientes();
  }, [recargarClientes]);

  return { clientes, setClientes, recargarClientes };
}
