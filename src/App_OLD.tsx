import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Pedidos from '@/pages/Pedidos';
import AdminPedidos from '@/pages/AdminPedidos';
import Financeiro from '@/pages/Financeiro';
import Configuracoes from '@/pages/Configuracoes';
import Encomendas from '@/pages/Encomendas';
import Corporativo from '@/pages/Corporativo';
import CorporateOrder from '@/pages/CorporateOrder';
import SpecialOrdersAdmin from '@/pages/SpecialOrdersAdmin';
import MarmitariaPOS from '@/pages/MarmitariaPOS';
import Marmitaria from '@/pages/Marmitaria';
import RH from '@/pages/RH';
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

// Layout
import { AdminLayout } from '@/components/layout/AdminLayout';

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
          {/* 1. ROTAS FIXAS PRIMEIRO */}
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="admin/pedidos" element={<AdminPedidos />} />
            <Route path="admin/encomendas" element={<Encomendas />} />
            <Route path="admin/corporativo" element={<Corporativo />} />
            <Route path="admin/special-orders" element={<SpecialOrdersAdmin />} />
            <Route path="marmitaria" element={<Marmitaria />} />
            <Route path="marmita-pos" element={<MarmitariaPOS />} />

            {/* ROTAS DE RH */}
            <Route path="rh" element={<RH />} />
            <Route path="rh/dashboard" element={<RHDashboard />} />
            <Route path="rh/funcionarios" element={<Funcionarios />} />
            <Route path="rh/folha" element={<FolhaPagamento />} />
            <Route path="rh/importar" element={<ImportarSecullum />} />
            <Route path="rh/contracheques" element={<Contracheques />} />

            {/* ROTAS DE RECEITAS */}
            <Route path="receitas" element={<Receitas />} />
            <Route path="receitas/importar-nfe" element={<ImportarNFe />} />
            <Route path="receitas/importar-extrato" element={<ImportarExtrato />} />
            <Route path="receitas/conciliacao" element={<Conciliacao />} />

            {/* ROTAS CMV */}
            <Route path="cmv" element={<CMV />} />
            <Route path="cmv/receitas" element={<ReceitasCRUD />} />
            <Route path="cmv/ingredientes" element={<Ingredientes />} />
            <Route path="cmv/custos-fixos" element={<CustosFixos />} />

            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          {/* 2. ROTAS DINÂMICAS POR ÚLTIMO */}
          <Route path="/marmita/:slug" element={<CorporateOrder />} />
          <Route path="/:slug" element={<CorporateOrder />} />
        </Routes>
      </BrowserRouter>

      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
}

export default App;
