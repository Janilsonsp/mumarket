import { useState } from 'react';
import { useFilters } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Plus, Trash2, Power, Pencil, X } from 'lucide-react';
import {
  CATEGORIES,
  EXCELLENT_OPTIONS_WEAPONS, EXCELLENT_OPTIONS_ARMOR,
  WEAPON_CATEGORIES, ARMOR_CATEGORIES,
} from '../../../shared/src/constants';

interface FilterFormData {
  name: string;
  itemName: string;
  category: string;
  rarity: string;
  level: number | '';
  ancient: boolean;
  excellent: boolean;
  excellentOptions: string[];
  optionsMatchType: 'and' | 'or';
  socket: boolean;
  minSockets: number | '';
  luck: boolean;
  skill: boolean;
  maxPriceZen: number | '';
  maxPriceDC: number | '';
  maxPriceWCoin: number | '';
  maxPriceJewel: number | '';
}

const defaultFormData: FilterFormData = {
  name: '',
  itemName: '',
  category: '',
  rarity: '',
  level: '',
  ancient: false,
  excellent: false,
  excellentOptions: [],
  optionsMatchType: 'and',
  socket: false,
  minSockets: '',
  luck: false,
  skill: false,
  maxPriceZen: '',
  maxPriceDC: '',
  maxPriceWCoin: '',
  maxPriceJewel: '',
};

function filterToFormData(filter: any): FilterFormData {
  return {
    name: filter.name || '',
    itemName: filter.itemName || '',
    category: filter.category || '',
    rarity: filter.rarity || '',
    level: filter.level ?? '',
    ancient: filter.ancient ?? false,
    excellent: filter.excellent ?? false,
    excellentOptions: filter.excellentOptions || [],
    socket: filter.socket ?? false,
    minSockets: filter.minSockets ?? '',
    luck: filter.luck ?? false,
    skill: filter.skill ?? false,
    maxPriceZen: filter.maxPriceZen ?? '',
    maxPriceDC: filter.maxPriceDC ?? '',
    maxPriceWCoin: filter.maxPriceWCoin ?? '',
    maxPriceJewel: filter.maxPriceJewel ?? '',
  };
}

function getExcellentOptions(category: string) {
  if (WEAPON_CATEGORIES.includes(category as any)) {
    return EXCELLENT_OPTIONS_WEAPONS;
  }
  if (ARMOR_CATEGORIES.includes(category as any)) {
    return EXCELLENT_OPTIONS_ARMOR;
  }
  return [];
}

function getFilterSummary(filter: any) {
  const parts: string[] = [];
  if (filter.category) parts.push(filter.category);
  if (filter.rarity) parts.push(filter.rarity);
  if (filter.level) parts.push(`Nv.${filter.level}+`);
  if (filter.maxPriceZen) parts.push(`Max ${filter.maxPriceZen.toLocaleString()} Zen`);
  if (filter.maxPriceDC) parts.push(`Max ${filter.maxPriceDC} DC`);
  if (filter.maxPriceWCoin) parts.push(`Max ${filter.maxPriceWCoin} WCoin`);
  if (filter.maxPriceJewel) parts.push(`Max ${filter.maxPriceJewel} Jewel`);
  return parts;
}

export function FiltersPage() {
  const { filters, loading, createFilter, updateFilter, deleteFilter, toggleFilter } = useFilters();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FilterFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  const handleNewFilter = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setShowForm(true);
  };

  const handleEditFilter = (filter: any) => {
    setEditingId(filter.id);
    setFormData(filterToFormData(filter));
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        level: formData.level ? Number(formData.level) : undefined,
        minSockets: formData.minSockets ? Number(formData.minSockets) : undefined,
        maxPriceZen: formData.maxPriceZen ? Number(formData.maxPriceZen) : undefined,
        maxPriceDC: formData.maxPriceDC ? Number(formData.maxPriceDC) : undefined,
        maxPriceWCoin: formData.maxPriceWCoin ? Number(formData.maxPriceWCoin) : undefined,
        maxPriceJewel: formData.maxPriceJewel ? Number(formData.maxPriceJewel) : undefined,
      };

      if (editingId) {
        await updateFilter(editingId, payload);
      } else {
        await createFilter(payload);
      }
      setFormData(defaultFormData);
      setEditingId(null);
      setShowForm(false);
    } catch {
      alert(editingId ? 'Erro ao atualizar filtro' : 'Erro ao criar filtro');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExcellentOption = (option: string) => {
    setFormData(prev => ({
      ...prev,
      excellentOptions: prev.excellentOptions.includes(option)
        ? prev.excellentOptions.filter(o => o !== option)
        : [...prev.excellentOptions, option],
    }));
  };

  const handleCategoryChange = (category: string) => {
    const available = getExcellentOptions(category);
    setFormData(prev => ({
      ...prev,
      category,
      excellentOptions: prev.excellentOptions.filter(opt =>
        available.some(o => o.value === opt)
      ),
    }));
  };

  const excellentOptions = getExcellentOptions(formData.category);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Filter className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Filtros do Market</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus filtros de monitoramento</p>
            </div>
          </div>
          <Button onClick={handleNewFilter} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Filtro
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingId ? 'Editar Filtro' : 'Novo Filtro'}</span>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                {editingId ? 'Altere os criterios do filtro' : 'Configure os criterios para monitoramento'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Filtro *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Armor Excellent MH+DD"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemName">Nome do Item</Label>
                    <Input
                      id="itemName"
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      placeholder="Ex: Full Plate"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">Todas</option>
                      <optgroup label="Armas">
                        {CATEGORIES.filter(c => WEAPON_CATEGORIES.includes(c as any)).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Armaduras">
                        {CATEGORIES.filter(c => ARMOR_CATEGORIES.includes(c as any)).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Outros">
                        {CATEGORIES.filter(c => !WEAPON_CATEGORIES.includes(c as any) && !ARMOR_CATEGORIES.includes(c as any)).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Nivel Minimo</Label>
                    <Input
                      id="level"
                      type="number"
                      min="0"
                      max="15"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minSockets">Min. Sockets</Label>
                    <Input
                      id="minSockets"
                      type="number"
                      min="0"
                      max="5"
                      value={formData.minSockets}
                      onChange={(e) => setFormData({ ...formData, minSockets: e.target.value ? Number(e.target.value) : '' })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Opcoes</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ancient}
                        onChange={(e) => setFormData({ ...formData, ancient: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Ancient</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.socket}
                        onChange={(e) => setFormData({ ...formData, socket: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Socket</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.luck}
                        onChange={(e) => setFormData({ ...formData, luck: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Luck</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.skill}
                        onChange={(e) => setFormData({ ...formData, skill: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Skill</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Opcoes Excelentes</Label>
                  {!formData.category ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Selecione o tipo de item para ver as opcoes Excellent:
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCategoryChange('Swords')}
                          className="gap-1"
                        >
                          Arma
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCategoryChange('Armors')}
                          className="gap-1"
                        >
                          Armadura
                        </Button>
                      </div>
                    </div>
                  ) : excellentOptions.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground p-3 rounded border border-dashed">
                        Esta categoria nao tem opcoes Excellent.
                      </p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleCategoryChange('')}>
                        Trocar categoria
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {WEAPON_CATEGORIES.includes(formData.category as any) ? 'Arma' : 'Armadura'} - {formData.category}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleCategoryChange('')} className="text-xs h-6">
                          Trocar
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {excellentOptions.map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-accent"
                          >
                            <input
                              type="checkbox"
                              checked={formData.excellentOptions.includes(option.value)}
                              onChange={() => toggleExcellentOption(option.value)}
                              className="rounded"
                            />
                            <span className="text-sm font-mono">{option.label}</span>
                          </label>
                        ))}
                      </div>
                      {formData.excellentOptions.length > 1 && (
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">Match:</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="optionsMatchType"
                              checked={formData.optionsMatchType === 'and'}
                              onChange={() => setFormData({ ...formData, optionsMatchType: 'and' })}
                              className="rounded"
                            />
                            <span className="text-sm">Todas (AND)</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="optionsMatchType"
                              checked={formData.optionsMatchType === 'or'}
                              onChange={() => setFormData({ ...formData, optionsMatchType: 'or' })}
                              className="rounded"
                            />
                            <span className="text-sm">Qualquer (OR)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Precos Maximos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Zen</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.maxPriceZen}
                        onChange={(e) => setFormData({ ...formData, maxPriceZen: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="Maximo"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">DC</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.maxPriceDC}
                        onChange={(e) => setFormData({ ...formData, maxPriceDC: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="Maximo"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">WCoin</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.maxPriceWCoin}
                        onChange={(e) => setFormData({ ...formData, maxPriceWCoin: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="Maximo"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Jewel</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.maxPriceJewel}
                        onChange={(e) => setFormData({ ...formData, maxPriceJewel: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="Maximo"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Salvando...' : editingId ? 'Atualizar Filtro' : 'Criar Filtro'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))
          ) : filters.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum filtro cadastrado</h3>
                <p className="text-muted-foreground mt-1">
                  Crie seu primeiro filtro para comecar a monitorar o Market.
                </p>
                <Button onClick={handleNewFilter} className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Filtro
                </Button>
              </CardContent>
            </Card>
          ) : (
            filters.map((filter) => {
              const summary = getFilterSummary(filter);
              return (
                <Card key={filter.id} className={!filter.isActive ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{filter.name}</CardTitle>
                        <CardDescription>{filter.itemName || 'Todos os itens'}</CardDescription>
                      </div>
                      <Badge variant={filter.isActive ? 'success' : 'secondary'}>
                        {filter.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {summary.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {summary.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filter.ancient && <Badge variant="secondary" className="text-xs">Ancient</Badge>}
                        {filter.excellent && <Badge variant="warning" className="text-xs">Excellent</Badge>}
                        {filter.socket && <Badge variant="info" className="text-xs">Socket</Badge>}
                        {filter.luck && <Badge variant="success" className="text-xs">Luck</Badge>}
                        {filter.skill && <Badge variant="secondary" className="text-xs">Skill</Badge>}
                      </div>
                      {filter.excellentOptions && filter.excellentOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {filter.excellentOptions.map((opt: string) => (
                            <Badge key={opt} variant="info" className="text-xs font-mono">{opt}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleFilter(filter.id)}
                        title={filter.isActive ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditFilter(filter)}
                        title="Editar filtro"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Excluir este filtro?')) {
                            deleteFilter(filter.id);
                          }
                        }}
                        title="Excluir filtro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
