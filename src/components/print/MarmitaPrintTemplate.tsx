import { formatCurrency, formatDate } from '@/lib/formatters';

interface MarmitaItem {
  nome: string;
  quantidade: number;
  preco: number;
}

interface MarmitaPedido {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_endereco: string;
  cliente_bairro: string;
  cliente_complemento?: string;
  itens: MarmitaItem[];
  total: number;
  taxa_entrega: number;
  observacoes?: string;
  created_at: string;
}

interface Props {
  pedido: MarmitaPedido;
  projectName: string;
}

export const MarmitaPrintTemplate = ({ pedido, projectName }: Props) => {
  return (
    <div className="p-6 max-w-md mx-auto bg-white text-black font-mono text-sm">
      {/* Cabeçalho */}
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
        <div className="text-2xl mb-2">🏪 {projectName}</div>
        <div className="text-lg font-bold">Comprovante de Pedido - Marmita</div>
      </div>

      {/* Dados do Pedido */}
      <div className="flex justify-between border-b border-dashed border-gray-300 pb-2 mb-4">
        <div className="font-bold">
          Pedido #{pedido.numero_pedido}
        </div>
        <div className="text-gray-600">
          {formatDate(pedido.created_at)}
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="font-bold mb-2">Cliente:</div>
        <div>Nome: {pedido.cliente_nome}</div>
        <div>Telefone: {pedido.cliente_telefone}</div>
        <div>Endereço: {pedido.cliente_endereco}</div>
        <div>Bairro: {pedido.cliente_bairro}</div>
        {pedido.cliente_complemento && (
          <div>Complemento: {pedido.cliente_complemento}</div>
        )}
      </div>

      {/* Itens do Pedido */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="font-bold mb-2">Itens:</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Produto</th>
              <th className="text-center py-1">Qtd</th>
              <th className="text-right py-1">Valor</th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-1">{item.nome}</td>
                <td className="text-center py-1">{item.quantidade}</td>
                <td className="text-right py-1">
                  {formatCurrency(item.preco * item.quantidade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
        <div className="flex justify-between py-1">
          <span>Subtotal:</span>
          <span>{formatCurrency(pedido.total - pedido.taxa_entrega)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Taxa de Entrega:</span>
          <span>{formatCurrency(pedido.taxa_entrega)}</span>
        </div>
        <div className="flex justify-between py-1 font-bold text-lg">
          <span>TOTAL:</span>
          <span>{formatCurrency(pedido.total)}</span>
        </div>
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
        <div className="text-gray-600">Obrigado pela preferência!</div>
      </div>
    </div>
  );
};
