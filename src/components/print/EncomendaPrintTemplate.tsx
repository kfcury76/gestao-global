import { formatCurrency, formatDate } from '@/lib/formatters';

interface EncomendaItem {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

interface EncomendaPedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo_encomenda: string;
  data_entrega: string;
  hora_entrega: string;
  itens: EncomendaItem[];
  valor_total: number;
  valor_sinal?: number;
  observacoes?: string;
  created_at: string;
}

interface Props {
  pedido: EncomendaPedido;
  projectName: string;
}

export const EncomendaPrintTemplate = ({ pedido, projectName }: Props) => {
  const valorRestante = pedido.valor_total - (pedido.valor_sinal || 0);

  return (
    <div className="p-6 max-w-md mx-auto bg-white text-black font-mono text-sm">
      {/* Cabeçalho */}
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
        <div className="text-2xl mb-2">🏪 {projectName}</div>
        <div className="text-lg font-bold">Comprovante de Encomenda</div>
      </div>

      {/* Dados do Pedido */}
      <div className="flex justify-between border-b border-dashed border-gray-300 pb-2 mb-4">
        <div className="font-bold">
          Encomenda #{pedido.numero_pedido}
        </div>
        <div className="text-gray-600">
          Pedido em: {formatDate(pedido.created_at)}
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="font-bold mb-2">Cliente:</div>
        <div>Nome: {pedido.cliente_nome}</div>
        <div>Telefone: {pedido.cliente_telefone}</div>
      </div>

      {/* Dados da Encomenda */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="font-bold mb-2">Detalhes da Encomenda:</div>
        <div>Tipo: {pedido.tipo_encomenda}</div>
        <div>Data de Entrega: {new Date(pedido.data_entrega).toLocaleDateString('pt-BR')}</div>
        <div>Horário: {pedido.hora_entrega}</div>
      </div>

      {/* Itens */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="font-bold mb-2">Itens:</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Descrição</th>
              <th className="text-center py-1">Qtd</th>
              <th className="text-right py-1">Valor Unit.</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-1">{item.descricao}</td>
                <td className="text-center py-1">{item.quantidade}</td>
                <td className="text-right py-1">
                  {formatCurrency(item.valor_unitario)}
                </td>
                <td className="text-right py-1">
                  {formatCurrency(item.valor_unitario * item.quantidade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Valores */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="flex justify-between py-1 font-bold">
          <span>Valor Total:</span>
          <span>{formatCurrency(pedido.valor_total)}</span>
        </div>
        {pedido.valor_sinal && pedido.valor_sinal > 0 && (
          <>
            <div className="flex justify-between py-1 text-green-600">
              <span>Sinal Pago:</span>
              <span>{formatCurrency(pedido.valor_sinal)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-lg">
              <span>Valor Restante:</span>
              <span className="text-red-600">
                {formatCurrency(valorRestante)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Observações */}
      {pedido.observacoes && (
        <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
          <div className="font-bold mb-1">Observações:</div>
          <div className="text-gray-700">{pedido.observacoes}</div>
        </div>
      )}

      {/* Rodapé */}
      <div className="text-center pt-4">
        <div className="text-gray-600">Obrigado pela confiança!</div>
        <div className="text-xs text-gray-500 mt-2">
          Retirar na data e horário combinados
        </div>
      </div>
    </div>
  );
};
