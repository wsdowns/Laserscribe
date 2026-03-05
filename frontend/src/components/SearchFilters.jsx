import { useQuery } from '@tanstack/react-query'
import { Select, SelectItem } from './ui/Select'
import Input from './ui/Input'
import Button from './ui/Button'

function SearchFilters({ filters, onFilterChange }) {
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => fetch('/api/materials', { credentials: 'include' }).then(r => r.json()),
  })

  function clearFilters() {
    onFilterChange({
      laserType: '',
      wattage: '',
      materialId: '',
      operationType: '',
    })
  }

  const hasFilters = filters.laserType || filters.wattage || filters.materialId || filters.operationType

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Laser Type"
          placeholder="Any laser type"
          value={filters.laserType}
          onValueChange={(val) => onFilterChange({ ...filters, laserType: val })}
        >
          <SelectItem value="CO2">CO2</SelectItem>
          <SelectItem value="Fiber">Fiber</SelectItem>
          <SelectItem value="Diode">Diode</SelectItem>
          <SelectItem value="UV">UV</SelectItem>
          <SelectItem value="Infrared">Infrared</SelectItem>
        </Select>

        <Input
          label="Wattage (W)"
          id="wattage"
          type="number"
          min="1"
          placeholder="Any wattage"
          value={filters.wattage}
          onChange={(e) => onFilterChange({ ...filters, wattage: e.target.value })}
        />

        <Select
          label="Material"
          placeholder="Any material"
          value={filters.materialId}
          onValueChange={(val) => onFilterChange({ ...filters, materialId: val })}
        >
          {(materials || []).map((m) => (
            <SelectItem key={m.ID || m.id} value={String(m.ID || m.id)}>
              {m.Name || m.name}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Operation"
          placeholder="Any operation"
          value={filters.operationType}
          onValueChange={(val) => onFilterChange({ ...filters, operationType: val })}
        >
          <SelectItem value="Cut">Cut</SelectItem>
          <SelectItem value="Scan">Scan/Engrave</SelectItem>
          <SelectItem value="ScanCut">Scan+Cut</SelectItem>
        </Select>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={clearFilters}
            variant="ghost"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}

export default SearchFilters
