import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, SelectItem } from './ui/Select'
import Input from './ui/Input'
import Button from './ui/Button'

function ContributeForm({ user }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    brandId: '',
    machineModelId: '',
    materialId: '',
    operationId: '',
    power: '',
    speed: '',
    passes: '1',
    frequency: '',
    dpi: '',
    notes: '',
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => fetch('/api/brands').then(r => r.json()),
  })

  const { data: models } = useQuery({
    queryKey: ['models', form.brandId],
    queryFn: () => fetch(`/api/brands/${form.brandId}/models`).then(r => r.json()),
    enabled: !!form.brandId,
  })

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: () => fetch('/api/materials').then(r => r.json()),
  })

  const { data: operations } = useQuery({
    queryKey: ['operations'],
    queryFn: () => fetch('/api/operations').then(r => r.json()),
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json()
          throw new Error(err.error || 'Failed to submit')
        }
        return r.json()
      }),
    onSuccess: () => {
      setSuccess(true)
      setError('')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setForm({
        brandId: '', machineModelId: '', materialId: '', operationId: '',
        power: '', speed: '', passes: '1', frequency: '', dpi: '', notes: '',
      })
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const data = {
      machineModelId: parseInt(form.machineModelId),
      materialId: parseInt(form.materialId),
      operationId: parseInt(form.operationId),
      power: parseInt(form.power),
      speed: parseInt(form.speed),
      passes: parseInt(form.passes) || 1,
      notes: form.notes,
    }

    if (form.frequency) data.frequency = parseInt(form.frequency)
    if (form.dpi) data.dpi = parseInt(form.dpi)

    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="bg-ls-green/10 border border-ls-green/30 rounded-lg p-4 text-ls-green text-sm">
          Setting submitted successfully! It's now live on PowerScale.
        </div>
      )}
      {error && (
        <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-4 text-ls-red text-sm">
          {error}
        </div>
      )}

      {/* Machine selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Machine Brand"
          placeholder="Select brand..."
          value={form.brandId}
          onValueChange={(val) => setForm({ ...form, brandId: val, machineModelId: '' })}
        >
          {(brands || []).map((b) => (
            <SelectItem key={b.ID} value={String(b.ID)}>{b.Name}</SelectItem>
          ))}
        </Select>

        <Select
          label="Machine Model"
          placeholder={form.brandId ? 'Select model...' : 'Select brand first'}
          value={form.machineModelId}
          onValueChange={(val) => setForm({ ...form, machineModelId: val })}
        >
          {(models || []).map((m) => (
            <SelectItem key={m.ID} value={String(m.ID)}>
              {m.Name} ({m.LaserType} {m.Wattage}W)
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Material + Operation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Material"
          placeholder="Select material..."
          value={form.materialId}
          onValueChange={(val) => setForm({ ...form, materialId: val })}
        >
          {(materials || []).map((m) => (
            <SelectItem key={m.ID} value={String(m.ID)}>{m.Name}</SelectItem>
          ))}
        </Select>

        <Select
          label="Operation"
          placeholder="Select operation..."
          value={form.operationId}
          onValueChange={(val) => setForm({ ...form, operationId: val })}
        >
          {(operations || []).map((o) => (
            <SelectItem key={o.ID} value={String(o.ID)}>{o.Name}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Settings values */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Input
          label="Power (%)"
          id="power"
          type="number"
          min="0"
          max="100"
          value={form.power}
          onChange={(e) => setForm({ ...form, power: e.target.value })}
          required
        />
        <Input
          label="Speed"
          id="speed"
          type="number"
          min="0"
          value={form.speed}
          onChange={(e) => setForm({ ...form, speed: e.target.value })}
          required
        />
        <Input
          label="Passes"
          id="passes"
          type="number"
          min="1"
          value={form.passes}
          onChange={(e) => setForm({ ...form, passes: e.target.value })}
        />
        <Input
          label="DPI/LPI"
          id="dpi"
          type="number"
          min="0"
          placeholder="Optional"
          value={form.dpi}
          onChange={(e) => setForm({ ...form, dpi: e.target.value })}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="block text-sm font-medium text-ls-text-muted">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Tips, observations, material brand, etc."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full px-4 py-3 bg-ls-surface border border-ls-border rounded-lg text-ls-text placeholder:text-ls-text-muted/50 focus:outline-none focus:ring-2 focus:ring-ls-accent focus:border-transparent transition-all resize-none"
        />
      </div>

      <Button type="submit" disabled={mutation.isPending} size="lg">
        {mutation.isPending ? 'Submitting...' : 'Submit Setting'}
      </Button>
    </form>
  )
}

export default ContributeForm
