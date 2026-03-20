import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Pages
import Home from '@/pages/Home';
import RHDashboard from '@/pages/RHDashboard';
import Funcionarios from '@/pages/Funcionarios';
import FolhaPagamento from '@/pages/FolhaPagamento';
import ImportarSecullum from '@/pages/ImportarSecullum';
import Contracheques from '@/pages/Contracheques';
import Receitas from '@/pages/Receitas';
import ImportarNFe from '@/pages/ImportarNFe';
import ImportarExtrato from '@/pages/ImportarExtrato';
import Conciliacao from '@/pages/Conciliacao';
import CMV from '@/pages/CMV';
import ReceitasCRUD from '@/pages/ReceitasCRUD';
import Ingredientes from '@/pages/Ingredientes';
import CustosFixos from '@/pages/CustosFixos';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* HOME */}
          <Route path="/" element={<Home />} />

          {/* ROTAS CMV */}
          <Route path="/cmv" element={<CMV />} />
          <Route path="/cmv/receitas" element={<ReceitasCRUD />} />
          <Route path="/cmv/ingredientes" element={<Ingredientes />} />
          <Route path="/cmv/custos-fixos" element={<CustosFixos />} />

          {/* ROTAS DE RH */}
          <Route path="/rh/dashboard" element={<RHDashboard />} />
          <Route path="/rh/funcionarios" element={<Funcionarios />} />
          <Route path="/rh/folha" element={<FolhaPagamento />} />
          <Route path="/rh/importar" element={<ImportarSecullum />} />
          <Route path="/rh/contracheques" element={<Contracheques />} />

          {/* ROTAS DE RECEITAS */}
          <Route path="/receitas" element={<Receitas />} />
          <Route path="/receitas/importar-nfe" element={<ImportarNFe />} />
          <Route path="/receitas/importar-extrato" element={<ImportarExtrato />} />
          <Route path="/receitas/conciliacao" element={<Conciliacao />} />
        </Routes>
      </BrowserRouter>

      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
}

export default App;
