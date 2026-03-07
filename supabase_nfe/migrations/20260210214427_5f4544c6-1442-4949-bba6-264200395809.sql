
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQ items são públicos para leitura"
  ON public.faq_items FOR SELECT
  USING (true);

CREATE INDEX idx_faq_items_categoria_ordem ON public.faq_items (categoria, ordem);

-- Seed com dados iniciais
INSERT INTO public.faq_items (categoria, pergunta, resposta, ordem) VALUES
('Horários', 'Qual o horário de funcionamento?', 'Segunda a Sexta: 07h às 18h | Sábado: 07h às 14h | Domingo: 07h às 12h | Feriados: 07h às 15h', 1),
('Entregas', 'Qual a área de entrega?', 'Entregamos em toda a região de Araras e bairros próximos. Taxa de entrega varia de acordo com a distância. Consulte disponibilidade para seu endereço pelo WhatsApp.', 1),
('Pagamentos', 'Quais as formas de pagamento?', 'Aceitamos: Dinheiro, Pix, Cartão de débito e crédito (Visa, Mastercard, Elo). Para encomendas especiais, solicitamos 50% de sinal para confirmar o pedido.', 1),
('Pedidos', 'Como funciona o pedido de marmitas?', 'Você escolhe o tamanho da marmita, a proteína e os acompanhamentos desejados e finaliza o pedido. O tempo de entrega é em média 40-60 minutos.', 1),
('Pedidos', 'Posso fazer encomendas especiais?', 'Sim! Fazemos bolos, tortas, salgados para festas, cestas de café da manhã e tábuas de frios. É necessário fazer o pedido com no mínimo 48h de antecedência.', 2),
('Cancelamentos', 'Qual a política de cancelamento?', 'Pedidos de marmitas podem ser cancelados até 30 minutos após a confirmação. Encomendas especiais: após pagamento do sinal, cancelamentos não são reembolsáveis, mas podem ser reagendados com 24h de antecedência.', 1);
