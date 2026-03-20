import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/formatters'
import { Loader2, ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RouteSize {
  id: string
  nome: string
  label: string
  descricao: string | null
  peso_ml: string | null
  preco: number
  ativo: boolean
}

interface MenuItem {
  id: string
  categoria: string
  nome: string
  preco_adicional: number
  ativo: boolean
}

interface CorporateRoute {
  id: string
  slug: string
  empresa_nome: string
  logo_url: string | null
  cor_primaria: string
  ativo: boolean
  require_matricula: boolean
  require_setor: boolean
  require_centro_custo: boolean
  frete_fixo?: number
  tamanhos: RouteSize[]
}

const CATEGORIAS = [
  { value: 'proteina', label: 'Proteína', icon: '🥩' },
  { value: 'acompanhamento', label: 'Acompanhamento', icon: '🥗' },
  { value: 'extra', label: 'Extra', icon: '➕' },
] as const

export default function CorporateOrder() {
  const { slug } = useParams<{ slug: string }>()

  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({})
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [matricula, setMatricula] = useState('')
  const [setor, setSetor] = useState('')
  const [centroCusto, setCentroCusto] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Fetch corporate route
  const { data: route, isLoading: loadingRoute, error: routeError } = useQuery({
    queryKey: ['corporate-route', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_routes')
        .select(`*, tamanhos:corporate_route_sizes(*)`)
        .eq('slug', slug!)
        .eq('ativo', true)
        .single()
      if (error) throw error
      return data as CorporateRoute
    },
    enabled: !!slug,
  })

  // Fetch menu items
  const { data: menuItems } = useQuery({
    queryKey: ['corporate-menu-items-public', route?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_menu_items')
        .select('*')
        .eq('corporate_route_id', route!.id)
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data as MenuItem[]
    },
    enabled: !!route?.id,
  })

  const toggleItem = (categoria: string, itemId: string) => {
    setSelectedItems(prev => {
      const current = prev[categoria] || []
      if (current.includes(itemId)) {
        return { ...prev, [categoria]: current.filter(id => id !== itemId) }
      }
      // For proteins, only allow one selection
      if (categoria === 'proteina') {
        return { ...prev, [categoria]: [itemId] }
      }
      return { ...prev, [categoria]: [...current, itemId] }
    })
  }

  const selectedSizeObj = route?.tamanhos?.find(t => t.id === selectedSize)

  // Extra total includes protein + extras preco_adicional
  const extraTotal = Object.values(selectedItems).flat().reduce((sum, itemId) => {
    const item = menuItems?.find(m => m.id === itemId)
    return sum + (item?.preco_adicional || 0)
  }, 0)

  const unitPrice = (selectedSizeObj?.preco || 0) + extraTotal
  const totalPrice = unitPrice * quantity
  const shippingCost = Number(route?.frete_fixo) || 0
  const totalWithShipping = totalPrice + shippingCost

  const handleSubmit = async () => {
    if (!route || !selectedSize || !customerName.trim()) return

    const orderItems = Object.values(selectedItems).flat().map(itemId => {
      const item = menuItems?.find(m => m.id === itemId)
      return { id: itemId, nome: item?.nome, categoria: item?.categoria, preco_adicional: item?.preco_adicional }
    })

    const orderId = crypto.randomUUID();

    const { error } = await supabase.from('corporate_orders').insert({
      id: orderId,
      corporate_route_id: route.id,
      tamanho_id: selectedSize,
      quantidade: quantity,
      cliente_nome: customerName.trim(),
      matricula: matricula.trim() || null,
      setor: setor.trim() || null,
      centro_custo: centroCusto.trim() || null,
      observacoes: observacoes.trim() || null,
      itens: orderItems,
      preco_unitario: unitPrice,
      preco_total: totalWithShipping,
    })

    if (error) {
      alert('Erro ao enviar pedido. Tente novamente.')
      return
    }

    // Insert financial entry (isolated try/catch)
    try {
      await supabase.from('financial_entries').insert({
        order_id: orderId,
        order_table: 'corporate_orders',
        business_unit: 'corporativo',
        customer_name: customerName.trim(),
        customer_company: route.empresa_nome,
        total_amount: totalWithShipping,
        payment_method: 'faturado',
        payment_status: 'pendente',
        payment_date: null,
        print_status: 'pendente',
      })
    } catch (_) {
      // Non-blocking: don't prevent order success
    }

    setSubmitted(true)
  }

  // Loading
  if (loadingRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not found or inactive
  if (routeError || !route) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground">Cardápio não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Este link pode estar inativo ou incorreto.</p>
      </div>
    )
  }

  // Success
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="rounded-full p-4 mb-4" style={{ backgroundColor: route.cor_primaria + '20' }}>
          <Check className="h-12 w-12" style={{ color: route.cor_primaria }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pedido enviado!</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Seu pedido para {route.empresa_nome} foi registrado com sucesso.
        </p>
        <Button className="mt-6" onClick={() => { setSubmitted(false); setSelectedSize(null); setSelectedItems({}); setQuantity(1); setCustomerName(''); setObservacoes(''); }}>
          Fazer novo pedido
        </Button>
      </div>
    )
  }

  const activeSizes = route.tamanhos?.filter(t => t.ativo) || []
  const proteins = menuItems?.filter(m => m.categoria === 'proteina') || []
  const nonProteinCategories = CATEGORIAS.filter(c => c.value !== 'proteina')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4" style={{ borderColor: route.cor_primaria + '40' }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {route.logo_url && (
            <img src={route.logo_url} alt={route.empresa_nome} className="h-10 w-10 rounded object-contain" />
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{route.empresa_nome}</h1>
            <p className="text-sm text-muted-foreground">Cardápio de Marmitas</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 p-4">
        {/* Nome do cliente */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Seu nome *</Label>
              <Input id="nome" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome completo" />
            </div>

            {route.require_matricula && (
              <div className="space-y-1.5">
                <Label htmlFor="matricula">Matrícula *</Label>
                <Input id="matricula" value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Sua matrícula" />
              </div>
            )}

            {route.require_setor && (
              <div className="space-y-1.5">
                <Label htmlFor="setor">Setor *</Label>
                <Input id="setor" value={setor} onChange={e => setSetor(e.target.value)} placeholder="Seu setor" />
              </div>
            )}

            {route.require_centro_custo && (
              <div className="space-y-1.5">
                <Label htmlFor="cc">Centro de Custo *</Label>
                <Input id="cc" value={centroCusto} onChange={e => setCentroCusto(e.target.value)} placeholder="Centro de custo" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tamanho */}
        {activeSizes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escolha o tamanho</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {activeSizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition-all',
                    selectedSize === size.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{size.label || size.nome}</span>
                    <span className="font-bold" style={{ color: route.cor_primaria }}>
                      {formatCurrency(size.preco)}
                    </span>
                  </div>
                  {size.descricao && <p className="mt-1 text-sm text-muted-foreground">{size.descricao}</p>}
                  {size.peso_ml && <p className="mt-0.5 text-xs text-muted-foreground">{size.peso_ml}</p>}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Proteínas - mostram preco_adicional */}
        {proteins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🥩 Proteína</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proteins.map(item => {
                const isSelected = (selectedItems.proteina || []).includes(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem('proteina', item.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border-2 p-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <span className="font-medium text-foreground">{item.nome}</span>
                    <div className="flex items-center gap-2">
                      {item.preco_adicional > 0 && (
                        <Badge variant="secondary">+{formatCurrency(item.preco_adicional)}</Badge>
                      )}
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Acompanhamentos e Extras */}
        {menuItems && menuItems.length > 0 && nonProteinCategories.map(cat => {
          const catItems = menuItems.filter(m => m.categoria === cat.value)
          if (catItems.length === 0) return null
          return (
            <Card key={cat.value}>
              <CardHeader>
                <CardTitle className="text-lg">{cat.icon} {cat.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {catItems.map(item => {
                  const isSelected = (selectedItems[cat.value] || []).includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(cat.value, item.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className="font-medium text-foreground">{item.nome}</span>
                      <div className="flex items-center gap-2">
                        {item.preco_adicional > 0 && (
                          <Badge variant="outline" className="text-xs">+{formatCurrency(item.preco_adicional)}</Badge>
                        )}
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}

        {/* Quantidade */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <Label className="text-base">Quantidade</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-foreground">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(q => q + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Alguma observação? (opcional)" rows={3} className="mt-1.5" />
          </CardContent>
        </Card>

        {/* Resumo e enviar */}
        <Card className="border-2" style={{ borderColor: route.cor_primaria + '60' }}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal Marmita ({quantity}x)</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            {shippingCost > 0 ? (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Frete</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm text-green-600">
                <span>Entrega Corporativa</span>
                <span>✅ Grátis</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>TOTAL</span>
              <span style={{ color: route.cor_primaria }}>{formatCurrency(totalWithShipping)}</span>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!selectedSize || !customerName.trim()}
              onClick={handleSubmit}
              style={{ backgroundColor: route.cor_primaria }}
            >
              <ShoppingCart className="h-5 w-5" />
              Enviar Pedido
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
