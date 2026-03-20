import escpos from 'escpos';
import Network from 'escpos-network';

// Configurar encoding para caracteres brasileiros
escpos.Network = Network;

export class ElginPrinter {
  constructor(ip, port) {
    this.ip = ip;
    this.port = port;
    this.device = null;
    this.printer = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.device = new Network(this.ip, this.port);
      
      this.device.open((error) => {
        if (error) {
          console.error('Erro ao conectar na impressora:', error);
          reject(error);
          return;
        }
        
        this.printer = new escpos.Printer(this.device, {
          encoding: 'UTF-8'
        });
        
        console.log(`✅ Conectado na impressora Elgin: ${this.ip}:${this.port}`);
        resolve();
      });
    });
  }

  async printMarmita(pedido, projectName) {
    try {
      await this.connect();

      this.printer
        // Cabeçalho
        .align('CT')
        .style('B')
        .size(1, 1)
        .text(projectName)
        .style('NORMAL')
        .size(0, 0)
        .text('Comprovante - Marmita')
        .text('--------------------------------')
        .feed(1)
        // Dados do Pedido
        .align('LT')
        .style('B')
        .text(`Pedido #${pedido.numero_pedido}`)
        .style('NORMAL')
        .text(new Date(pedido.created_at).toLocaleString('pt-BR'))
        .feed(1)
        // Cliente
        .style('B')
        .text('CLIENTE:')
        .style('NORMAL')
        .text(pedido.cliente_nome)
        .text(pedido.cliente_telefone)
        .text(pedido.cliente_endereco)
        .text(`${pedido.cliente_bairro}`);
        
      if (pedido.cliente_complemento) {
        this.printer.text(`Compl: ${pedido.cliente_complemento}`);
      }

      this.printer
        .feed(1)
        .text('--------------------------------')
        // Itens
        .style('B')
        .text('ITENS:')
        .style('NORMAL');

      pedido.itens.forEach(item => {
        const total = (item.preco * item.quantidade).toFixed(2);
        this.printer
          .text(`${item.quantidade}x ${item.nome}`)
          .tableCustom([
            { text: '', align: 'LEFT', width: 0.6 },
            { text: `R$ ${total}`, align: 'RIGHT', width: 0.4 }
          ]);
      });

      this.printer
        .feed(1)
        .text('--------------------------------')
        // Totais
        .tableCustom([
          { text: 'Subtotal:', align: 'LEFT', width: 0.6 },
          { text: `R$ ${(pedido.total - pedido.taxa_entrega).toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ])
        .tableCustom([
          { text: 'Taxa Entrega:', align: 'LEFT', width: 0.6 },
          { text: `R$ ${pedido.taxa_entrega.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ])
        .text('--------------------------------')
        .style('B')
        .size(1, 1)
        .tableCustom([
          { text: 'TOTAL:', align: 'LEFT', width: 0.6 },
          { text: `R$ ${pedido.total.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ])
        .style('NORMAL')
        .size(0, 0)
        .feed(1);

      // Observações
      if (pedido.observacoes) {
        this.printer
          .text('--------------------------------')
          .style('B')
          .text('OBSERVACOES:')
          .style('NORMAL')
          .text(pedido.observacoes)
          .feed(1);
      }

      // Rodapé
      this.printer
        .text('--------------------------------')
        .align('CT')
        .text('Obrigado pela preferencia!')
        .feed(2)
        .cut()
        .close();

      console.log('✅ Impressão de marmita concluída!');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao imprimir:', error);
      throw error;
    }
  }

  async printEncomenda(pedido, projectName) {
    try {
      await this.connect();

      this.printer
        // Cabeçalho
        .align('CT')
        .style('B')
        .size(1, 1)
        .text(projectName)
        .style('NORMAL')
        .size(0, 0)
        .text('Comprovante - Encomenda')
        .text('--------------------------------')
        .feed(1)
        // Dados do Pedido
        .align('LT')
        .style('B')
        .text(`Encomenda #${pedido.numero_pedido}`)
        .style('NORMAL')
        .text(`Pedido: ${new Date(pedido.created_at).toLocaleDateString('pt-BR')}`)
        .feed(1)
        // Cliente
        .style('B')
        .text('CLIENTE:')
        .style('NORMAL')
        .text(pedido.cliente_nome)
        .text(pedido.cliente_telefone)
        .feed(1)
        // Detalhes da Encomenda
        .style('B')
        .text('DETALHES:')
        .style('NORMAL')
        .text(`Tipo: ${pedido.tipo_encomenda}`)
        .text(`Entrega: ${new Date(pedido.data_entrega).toLocaleDateString('pt-BR')}`)
        .text(`Horario: ${pedido.hora_entrega}`)
        .feed(1)
        .text('--------------------------------')
        // Itens
        .style('B')
        .text('ITENS:')
        .style('NORMAL');

      pedido.itens.forEach(item => {
        const total = (item.valor_unitario * item.quantidade).toFixed(2);
        this.printer
          .text(item.descricao)
          .tableCustom([
            { text: `${item.quantidade}x R$ ${item.valor_unitario.toFixed(2)}`, align: 'LEFT', width: 0.6 },
            { text: `R$ ${total}`, align: 'RIGHT', width: 0.4 }
          ]);
      });

      this.printer
        .feed(1)
        .text('--------------------------------')
        .style('B')
        .size(1, 1)
        .tableCustom([
          { text: 'TOTAL:', align: 'LEFT', width: 0.6 },
          { text: `R$ ${pedido.valor_total.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
        ])
        .style('NORMAL')
        .size(0, 0);

      // Sinal
      if (pedido.valor_sinal && pedido.valor_sinal > 0) {
        const restante = pedido.valor_total - pedido.valor_sinal;
        this.printer
          .tableCustom([
            { text: 'Sinal Pago:', align: 'LEFT', width: 0.6 },
            { text: `R$ ${pedido.valor_sinal.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
          ])
          .style('B')
          .tableCustom([
            { text: 'RESTANTE:', align: 'LEFT', width: 0.6 },
            { text: `R$ ${restante.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
          ])
          .style('NORMAL');
      }

      this.printer.feed(1);

      // Observações
      if (pedido.observacoes) {
        this.printer
          .text('--------------------------------')
          .style('B')
          .text('OBSERVACOES:')
          .style('NORMAL')
          .text(pedido.observacoes)
          .feed(1);
      }

      // Rodapé
      this.printer
        .text('--------------------------------')
        .align('CT')
        .text('Obrigado pela confianca!')
        .text('Retirar na data/hora combinados')
        .feed(2)
        .cut()
        .close();

      console.log('✅ Impressão de encomenda concluída!');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao imprimir:', error);
      throw error;
    }
  }
}
