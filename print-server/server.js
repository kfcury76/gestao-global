import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ElginPrinter } from './lib/elgin-printer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    printer: {
      ip: process.env.PRINTER_IP,
      port: process.env.PRINTER_PORT
    }
  });
});

// Imprimir Marmita
app.post('/print/marmita', async (req, res) => {
  try {
    const { pedido, projectName } = req.body;
    
    if (!pedido) {
      return res.status(400).json({ error: 'Dados do pedido são obrigatórios' });
    }

    const printer = new ElginPrinter(
      process.env.PRINTER_IP,
      parseInt(process.env.PRINTER_PORT)
    );

    await printer.printMarmita(pedido, projectName || 'Empório Cosí');

    res.json({ 
      success: true, 
      message: 'Impressão enviada com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao imprimir marmita:', error);
    res.status(500).json({ 
      error: 'Erro ao imprimir',
      details: error.message 
    });
  }
});

// Imprimir Encomenda
app.post('/print/encomenda', async (req, res) => {
  try {
    const { pedido, projectName } = req.body;
    
    if (!pedido) {
      return res.status(400).json({ error: 'Dados do pedido são obrigatórios' });
    }

    const printer = new ElginPrinter(
      process.env.PRINTER_IP,
      parseInt(process.env.PRINTER_PORT)
    );

    await printer.printEncomenda(pedido, projectName || 'Empório Cosí');

    res.json({ 
      success: true, 
      message: 'Impressão enviada com sucesso!' 
    });

  } catch (error) {
    console.error('Erro ao imprimir encomenda:', error);
    res.status(500).json({ 
      error: 'Erro ao imprimir',
      details: error.message 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🖨️  Servidor de impressão rodando na porta ${PORT}`);
  console.log(`📍 Impressora configurada: ${process.env.PRINTER_IP}:${process.env.PRINTER_PORT}`);
});
