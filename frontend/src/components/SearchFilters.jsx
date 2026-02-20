import { useQuery } from '@tanstack/react-query'
import { Select, SelectItem } from './ui/Select'

function SearchFilters({ filters, onFilterChange }) {
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => fetch('/api/brands').then(r => r.json()),
  })

  const { data: models } = useQuery({
    queryKey: ['models', filters.brandId],
    queryFn: () => fetch(`/api/brands/${filters.brandId}/models`).then(r => r.json()),
    enabled: !!filters.brandId,
  })

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => fetch('/api/materials').then(r => r.json()),
  })

  const { data: operations } = useQuery({
    queryKey: ['operations'],
    queryFn: () => fetch('/api/operations').then(r => r.json()),
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Select
        label="Machine Brand"
        placeholder="Select brand..."
        value={filters.brandId}
        onValueChange={(val) => {
          onFilterChange({ ...filters, brandId: val, machineModelId: '' })
        }}
      >
        {(brands || []).map((b) => (
          <SelectItem key={b.ID} value={String(b.ID)}>{b.Name}</SelectItem>
        ))}
      </Select>

      <Select
        label="Machine Model"
        placeholder={filters.brandId ? 'Select model...' : 'Select brand first'}
        value={filters.machineModelId}
        onValueChange={(val) => onFilterChange({ ...filters, machineModelId: val })}
      >
        {(models || []).map((m) => (
          <SelectItem key={m.ID} value={String(m.ID)}>
            {m.Name} ({m.LaserType} {m.Wattage}W)
          </SelectItem>
        ))}
      </Select>

      <Select
        label="Material"
        placeholder="Any material"
        value={filters.materialId}
        onValueChange={(val) => onFilterChange({ ...filters, materialId: val })}
      >
        {(materials || []).map((m) => (
          <SelectItem key={m.ID} value={String(m.ID)}>
            {m.Name}
          </SelectItem>
        ))}
      </Select>

      <Select
        label="Operation"
        placeholder="Any operation"
        value={filters.operationId}
        onValueChange={(val) => onFilterChange({ ...filters, operationId: val })}
      >
        {(operations || []).map((o) => (
          <SelectItem key={o.ID} value={String(o.ID)}>{o.Name}</SelectItem>
        ))}
      </Select>
    </div>
  )
}

export default SearchFilters
