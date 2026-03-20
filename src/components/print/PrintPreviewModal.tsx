import { X } from 'lucide-react';
import { MarmitaPrintTemplate } from './MarmitaPrintTemplate';
import { EncomendaPrintTemplate } from './EncomendaPrintTemplate';
import { PrintButton } from './PrintButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'marmita' | 'encomenda';
  pedido: any;
  projectName: string;
}

export const PrintPreviewModal = ({ isOpen, onClose, tipo, pedido, projectName }: Props) => {
  if (!isOpen) return null;

  const templateId = tipo === 'marmita' ? 'marmita-print-template' : 'encomenda-print-template';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted">
          <h2 className="text-xl font-semibold text-foreground">
            Preview de Impressão - {tipo === 'marmita' ? 'Marmita' : 'Encomenda'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/50">
          <div id={templateId} className="bg-white rounded-lg shadow-md p-4">
            {tipo === 'marmita' ? (
              <MarmitaPrintTemplate pedido={pedido} projectName={projectName} />
            ) : (
              <EncomendaPrintTemplate pedido={pedido} projectName={projectName} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <PrintButton templateId={templateId} label="Imprimir Comprovante" />
        </div>
      </div>
    </div>
  );
};
