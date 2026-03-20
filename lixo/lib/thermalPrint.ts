const PRINT_SERVER_URL = 'http://localhost:3001';

export interface ThermalPrintResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const checkPrintServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${PRINT_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const printMarmitaThermal = async (
  pedido: any,
  projectName: string
): Promise<ThermalPrintResult> => {
  try {
    const response = await fetch(`${PRINT_SERVER_URL}/print/marmita`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pedido, projectName }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao imprimir' };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Erro ao conectar com servidor de impressão:', error);
    return { 
      success: false, 
      error: 'Servidor de impressão não disponível. Verifique se está rodando.' 
    };
  }
};

export const printEncomendaThermal = async (
  pedido: any,
  projectName: string
): Promise<ThermalPrintResult> => {
  try {
    const response = await fetch(`${PRINT_SERVER_URL}/print/encomenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pedido, projectName }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Erro ao imprimir' };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Erro ao conectar com servidor de impressão:', error);
    return { 
      success: false, 
      error: 'Servidor de impressão não disponível. Verifique se está rodando.' 
    };
  }
};
