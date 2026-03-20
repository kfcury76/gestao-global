import { Printer } from 'lucide-react';
import { printElement } from '@/lib/formatters';

interface Props {
  templateId: string;
  label?: string;
}

export const PrintButton = ({ templateId, label = 'Imprimir' }: Props) => {
  const handlePrint = () => {
    printElement(templateId);
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      <Printer size={18} />
      {label}
    </button>
  );
};
