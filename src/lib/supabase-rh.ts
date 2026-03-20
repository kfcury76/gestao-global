// Re-exporta tudo do client central
export { supabase } from './supabase'
// Alias para compatibilidade
export { supabase as supabaseMarmitas } from './supabase'

// Mock data para quando tabelas não existem
const MOCK_MENU_ITEMS = [
  { id: '1', category: 'protein' as const, name: 'Frango Grelhado', description: 'Peito de frango grelhado', price_modifier: 0, is_available: true, display_order: 1 },
  { id: '2', category: 'protein' as const, name: 'Bife Acebolado', description: 'Bife bovino com cebolas', price_modifier: 3, is_available: true, display_order: 2 },
  { id: '3', category: 'protein' as const, name: 'Peixe Grelhado', description: 'Filé de tilápia grelhado', price_modifier: 2, is_available: true, display_order: 3 },
  { id: '4', category: 'protein' as const, name: 'Ovo Frito', description: 'Dois ovos fritos', price_modifier: 0, is_available: true, display_order: 4 },
  { id: '5', category: 'carb' as const, name: 'Arroz Branco', description: 'Arroz soltinho', price_modifier: 0, is_available: true, display_order: 1 },
  { id: '6', category: 'carb' as const, name: 'Arroz Integral', description: 'Arroz integral nutritivo', price_modifier: 1, is_available: true, display_order: 2 },
  { id: '7', category: 'carb' as const, name: 'Macarrão', description: 'Macarrão ao alho e óleo', price_modifier: 0, is_available: true, display_order: 3 },
  { id: '8', category: 'carb' as const, name: 'Purê de Batata', description: 'Purê cremoso', price_modifier: 1, is_available: true, display_order: 4 },
  { id: '9', category: 'side_dish' as const, name: 'Feijão Preto', description: 'Feijão carioca temperado', price_modifier: 0, is_available: true, display_order: 1 },
  { id: '10', category: 'side_dish' as const, name: 'Feijão Carioca', description: 'Feijão carioca temperado', price_modifier: 0, is_available: true, display_order: 2 },
  { id: '11', category: 'side_dish' as const, name: 'Legumes Salteados', description: 'Mix de legumes', price_modifier: 1, is_available: true, display_order: 3 },
  { id: '12', category: 'side_dish' as const, name: 'Farofa', description: 'Farofa caseira', price_modifier: 0, is_available: true, display_order: 4 },
  { id: '13', category: 'salad' as const, name: 'Salada Verde', description: 'Alface, rúcula e agrião', price_modifier: 0, is_available: true, display_order: 1 },
  { id: '14', category: 'salad' as const, name: 'Salada Completa', description: 'Mix de folhas com tomate e cenoura', price_modifier: 1, is_available: true, display_order: 2 },
  { id: '15', category: 'salad' as const, name: 'Vinagrete', description: 'Tomate, cebola e pimentão', price_modifier: 0, is_available: true, display_order: 3 },
]

const MOCK_MEAL_SIZES = [
  { id: '1', size_name: 'Pequena', size_slug: 'pequena', description: 'Ideal para lanche', base_price: 12, display_order: 1, is_active: true },
  { id: '2', size_name: 'Média', size_slug: 'media', description: 'Porção padrão', base_price: 15, display_order: 2, is_active: true },
  { id: '3', size_name: 'Grande', size_slug: 'grande', description: 'Porção generosa', base_price: 18, display_order: 3, is_active: true },
]

// Tipos
export interface MenuItem {
  id: string
  category: 'protein' | 'carb' | 'side_dish' | 'salad' | 'extra'
  name: string
  description?: string
  price_modifier: number
  is_available: boolean
  display_order: number
}

export interface CorporateMenuItem extends MenuItem {
  price: number
  corporate_client: string
}

export interface MealSize {
  id: string
  size_name: string
  size_slug: string
  description: string
  base_price: number
  display_order: number
  is_active: boolean
}

export interface CorporateMealSize extends MealSize {
  corporate_price: number
}

export interface Order {
  id?: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_neighborhood?: string
  customer_reference?: string

  // Tamanho da marmita
  meal_size: string
  meal_size_name: string

  protein: string
  carb: string
  side_dish?: string
  salad?: string
  drinks?: Array<{ name: string; price: number }>
  observations?: string

  base_price: number
  extras_price: number
  delivery_fee: number
  total_price: number

  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'money' | 'mercado_pago' | 'delivery'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  needs_change?: boolean
  change_for?: number

  delivery_type: 'delivery' | 'pickup'
  order_status?: string
  corporate_client?: string | null
  source: string
  created_at?: string

  // Campos do banco externo
  discount?: number
  final_total?: number
  protein_id?: string
  carb_id?: string
  side_id?: string
  salad_id?: string
  drink_id?: string
  delivery_zone_id?: string

  // Mercado Pago
  mp_payment_id?: string
  mp_preference_id?: string
  mp_qr_code?: string
  mp_qr_code_base64?: string

  // Acompanhamentos e itens
  sides?: string[]
  items?: Array<{ name: string; price: number; quantity: number }>
}

export interface PriceItem {
  id: string
  category: 'size' | 'delivery' | 'extra'
  item_slug: string
  price: number
  is_active: boolean
  display_order: number
}

// Buscar cardápio com fallback para mock
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('display_order')

    console.log('📊 Query [menu_items] DATA:', data)
    console.log('📊 Query [menu_items] ERROR:', error)

    if (error) {
      console.warn('⚠️ Tabela menu_items não existe, usando mock:', error.message)
      return MOCK_MENU_ITEMS
    }

    return data || []
  } catch (err) {
    console.error('💥 Erro ao buscar itens de menu, usando mock:', err)
    return MOCK_MENU_ITEMS
  }
}

/**
 * Busca tamanhos de marmita com mock se tabelas não existirem
 */
export async function fetchMealSizes(): Promise<MealSize[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('meal_sizes')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    console.log('📊 Query [meal_sizes] DATA:', data)
    console.log('📊 Query [meal_sizes] ERROR:', error)

    if (error) {
      console.warn('⚠️ Tabela meal_sizes não existe, usando mock:', error.message)
      return MOCK_MEAL_SIZES
    }

    return data || []
  } catch (err) {
    console.error('💥 Erro ao buscar tamanhos de marmita, usando mock:', err)
    return MOCK_MEAL_SIZES
  }
}

/**
 * Busca preços de itens (tamanho, entrega, extras)
 */
export async function fetchPriceItems(): Promise<PriceItem[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('price_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    console.log('📊 Query [price_items] DATA:', data)
    console.log('📊 Query [price_items] ERROR:', error)

    if (error) {
      console.warn('⚠️ Tabela price_items não existe')
      return []
    }

    return data || []
  } catch (err) {
    console.error('Erro ao buscar itens de preço:', err)
    return []
  }
}

/**
 * Cria um novo pedido de marmita
 * Mapeia campos do Order interface para as colunas reais da tabela marmita_orders
 */
export async function createOrder(orderData: Order): Promise<Order | null> {
  try {
    console.log('📊 createOrder: Iniciando criação de pedido...')

    // Payload usando APENAS colunas reais da tabela marmita_orders:
    // id, customer_name, customer_phone, delivery_address, protein_id, size_id,
    // delivery_zone_id, total_price, delivery_fee, discount, final_total,
    // payment_method, status, notes, preference_id, payment_id, sides, items
    const marmitaOrderData = {
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      delivery_address: orderData.customer_address || null,
      protein_id: orderData.protein_id || null,
      size_id: null as string | null,
      delivery_zone_id: orderData.delivery_zone_id || null,
      total_price: orderData.total_price,
      delivery_fee: orderData.delivery_fee || 0,
      discount: orderData.discount || 0,
      final_total: orderData.final_total || orderData.total_price,
      payment_method: orderData.payment_method,
      status: orderData.order_status || 'pending',
      notes: orderData.observations || null,
      preference_id: orderData.mp_preference_id || null,
      payment_id: orderData.mp_payment_id || null,
      sides: orderData.sides || [],
      items: orderData.items || [],
    }

    console.log('📊 Final payload para marmita_orders:', JSON.stringify(marmitaOrderData, null, 2))

    const { data, error } = await supabaseMarmitas
      .from('marmita_orders')
      .insert([marmitaOrderData])
      .select('*')

    console.log('📊 Query [marmita_orders - insert] DATA:', data)
    console.log('📊 Query [marmita_orders - insert] ERROR:', JSON.stringify(error, null, 2))

    if (error) {
      console.error('❌ Erro ao criar pedido:', JSON.stringify(error, null, 2))
      throw error
    }

    if (data && data.length > 0) {
      console.log('✅ Pedido criado com sucesso:', data[0])
      return data[0] as Order
    }

    return null
  } catch (err) {
    console.error('❌ Erro ao criar pedido:', JSON.stringify(err, null, 2))
    throw err
  }
}

// Buscar pedidos por telefone
export async function fetchOrdersByPhone(phone: string): Promise<Order[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('marmita_orders')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar pedidos:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err)
    return []
  }
}

// ==================== CATÁLOGO ====================

export interface CatalogSection {
  slug: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  is_for_sale: boolean
}

export interface Product {
  sku: string
  section_slug: string
  name: string
  description?: string
  features?: string[]
  image_url?: string
  min_order_hours: number
  is_active: boolean
  display_order: number
  section_name?: string
  is_for_sale?: boolean
  prices?: Array<{
    price_table: string
    price_table_name: string
    price: number
    is_active: boolean
  }>
}

export interface WeeklyAvailability {
  sku: string
  name: string
  section_slug: string
  day_of_week: number
  is_available: boolean
  is_highlight: boolean
  notes?: string
}

export interface Drink {
  sku: string
  name: string
  description?: string
  volume_ml?: number
  temperature: string
  is_alcoholic: boolean
  is_available: boolean
  display_order: number
  prices?: Array<{
    price_table: string
    price_table_name: string
    price: number
    is_active: boolean
  }>
}

/**
 * Busca seções do catálogo
 */
export async function fetchCatalogSections(): Promise<CatalogSection[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('catalog_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    console.log('📊 Query [catalog_sections] DATA:', data)
    console.log('📊 Query [catalog_sections] ERROR:', error)

    if (error) {
      console.warn('⚠️ Tabela catalog_sections não existe')
      return []
    }

    return data || []
  } catch (err) {
    console.error('Erro ao buscar seções:', err)
    return []
  }
}

/**
 * Busca produtos por seção
 */
export async function fetchProductsBySection(sectionSlug: string, priceTable: string = 'default'): Promise<(Product & { currentPrice: number })[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('v_products_with_prices')
      .select('*')
      .eq('section_slug', sectionSlug)
      .eq('is_active', true)
      .order('display_order')

    console.log('📊 Query [v_products_with_prices] DATA:', data)
    console.log('📊 Query [v_products_with_prices] ERROR:', error)

    if (error) {
      console.warn('⚠️ View v_products_with_prices não existe')
      return []
    }

    return (data || []).map(product => ({
      ...product,
      currentPrice: product.prices?.find((p: { price_table: string }) => p.price_table === priceTable)?.price || 0
    }))
  } catch (err) {
    console.error('Erro ao buscar produtos:', err)
    return []
  }
}

/**
 * Busca disponibilidade semanal
 */
export async function fetchWeeklyAvailability(): Promise<WeeklyAvailability[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('v_weekly_availability')
      .select('*')

    console.log('📊 Query [v_weekly_availability] DATA:', data)
    console.log('📊 Query [v_weekly_availability] ERROR:', error)

    if (error) {
      console.warn('⚠️ View v_weekly_availability não existe')
      return []
    }

    return data || []
  } catch (err) {
    console.error('Erro ao buscar disponibilidade:', err)
    return []
  }
}

/**
 * Busca bebidas - com mock se tabela não existir
 */
const MOCK_DRINKS: (Drink & { currentPrice: number })[] = [
  { sku: 'bebida-1', name: 'Água Mineral 500ml', description: 'Água sem gás', volume_ml: 500, temperature: 'gelada', is_alcoholic: false, is_available: true, display_order: 1, currentPrice: 3.00 },
  { sku: 'bebida-2', name: 'Refrigerante Lata', description: 'Coca-Cola, Guaraná ou Fanta', volume_ml: 350, temperature: 'gelada', is_alcoholic: false, is_available: true, display_order: 2, currentPrice: 5.00 },
  { sku: 'bebida-3', name: 'Suco Natural 300ml', description: 'Laranja, Limão ou Maracujá', volume_ml: 300, temperature: 'gelada', is_alcoholic: false, is_available: true, display_order: 3, currentPrice: 7.00 },
]

export async function fetchDrinks(priceTable: string = 'default'): Promise<(Drink & { currentPrice: number })[]> {
  try {
    console.log('📊 Query [v_drinks_with_prices]: Iniciando busca...')

    const { data, error } = await supabaseMarmitas
      .from('v_drinks_with_prices')
      .select('*')
      .order('display_order')

    console.log('📊 Query [v_drinks_with_prices] DATA:', data)
    console.log('📊 Query [v_drinks_with_prices] ERROR:', error)

    if (error) {
      console.warn('⚠️ View v_drinks_with_prices não existe, usando mock:', error.message)
      return MOCK_DRINKS
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Nenhuma bebida cadastrada, usando mock')
      return MOCK_DRINKS
    }

    return data.map(drink => ({
      ...drink,
      currentPrice: drink.prices?.find((p: { price_table: string }) => p.price_table === priceTable)?.price || 0
    }))
  } catch (err) {
    console.error('💥 Erro ao buscar bebidas, usando mock:', err)
    return MOCK_DRINKS
  }
}

/**
 * Enviar lead (Experiências/Reservas)
 */
export async function sendLead(leadData: {
  name: string
  phone: string
  email?: string
  interest_type: 'experiencias' | 'reservas' | 'orcamento'
  message?: string
}): Promise<void> {
  try {
    const { error } = await supabaseMarmitas
      .from('leads')
      .insert([leadData])

    if (error) {
      console.error('Erro ao enviar lead:', error)
      throw error
    }
  } catch (err) {
    console.error('Erro ao enviar lead:', err)
    throw err
  }
}

// ==================== RECURSOS HUMANOS ====================

export interface TimeSheetSummary {
  id?: string;
  reference_month: string;
  employee_id?: string; // Se usarmos a tabela cruzada
  employee_name: string; // Salvo direto do PDF por praticidade
  total_normal_hours?: string;
  total_overtime_65: string;
  total_overtime_100: string;
  total_night_shift: string;
  total_delays: string;
  total_faults: string;
  inconsistencies?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Salva consolidado mensal de horas (vindo do parser PDF/Excel)
 * Usa UPSERT baseado no reference_month + employee_name
 */
export async function saveTimeSheetSummary(records: TimeSheetSummary[], referenceMonth: string): Promise<boolean> {
  try {
    console.log('📊 saveTimeSheetSummary: Preparando inserção/atualização...');

    const payload = records.map(r => ({
      reference_month: referenceMonth,
      employee_name: r.employee_name,
      total_overtime_65: r.total_overtime_65,
      total_overtime_100: r.total_overtime_100,
      total_night_shift: r.total_night_shift,
      total_delays: r.total_delays,
      total_faults: r.total_faults
    }));

    // O onConflict assume que criamos uma restrição UNIQUE(reference_month, employee_name) no banco
    // Caso não tenha, ele fará insert comum.
    const { error } = await supabaseMarmitas
      .from('time_sheets_summary')
      .upsert(payload, { onConflict: 'reference_month, employee_name' });

    if (error) {
      console.error('❌ Erro ao salvar fechamento de ponto:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('💥 Erro no saveTimeSheetSummary:', err);
    throw err;
  }
}

/**
 * Busca histórico do fechamento de um mês específico
 */
export async function fetchTimeSheetsByMonth(referenceMonth: string): Promise<TimeSheetSummary[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('time_sheets_summary')
      .select('*')
      .eq('reference_month', referenceMonth)
      .order('employee_name');

    if (error) {
      console.warn('Erro ao buscar fechamento:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Erro geral ao buscar fechamentos:', err);
    return [];
  }
}

// ==================== MÓDULO FINANCEIRO (DRE) ====================

export interface FinancialCategory {
  id: string;
  parent_id: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  description: string | null;
  system_managed: boolean;
  is_active: boolean;
}

export interface FinancialTransaction {
  id?: string;
  reference_date: string;
  description: string;
  amount: number;
  category_id?: string | null;
  cost_center_id?: string | null;
  import_batch_id?: string | null;
  document_number?: string | null;
  supplier_client_name?: string | null;
  status?: 'PENDING_CLASSIFICATION' | 'CLASSIFIED' | 'RECONCILED' | 'IGNORED';
}

/**
 * Busca as categorias financeiras (Plano de Contas)
 */
export async function fetchFinancialCategories(): Promise<FinancialCategory[]> {
  try {
    const { data, error } = await supabaseMarmitas
      .from('financial_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.warn('⚠️ Erro (ou tabela não existe) em financial_categories:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('💥 fetchFinancialCategories:', err);
    return [];
  }
}

/**
 * Salva um lote de transações vindas do Excel/PDF (Processo de Conciliação)
 */
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<boolean> {
  try {
    console.log(`📊 Salvando ${transactions.length} transações financeiras...`);
    const { error } = await supabaseMarmitas
      .from('financial_transactions')
      .insert(transactions);

    if (error) {
      console.error('❌ Erro no insert financial_transactions:', error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('💥 saveFinancialTransactions:', err);
    throw err;
  }
}

