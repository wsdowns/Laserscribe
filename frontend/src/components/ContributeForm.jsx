import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, SelectItem } from './ui/Select'
import Input from './ui/Input'
import Button from './ui/Button'

function ContributeForm({ user, initialMode = 'manual' }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState(initialMode) // 'manual' or 'import'
  const [form, setForm] = useState({
    materialName: '',
    laserType: '',
    wattage: '',
    mode: '',
    maxPower: '',
    speed: '',
    numPasses: '1',
    frequency: '',
    scanInterval: '',
    biDirectionalFill: false,
    crossHatch: false,
    scanAngle: '',
    angleIncrement: '',
    layerName: '',
    notes: '',
  })
  const [importForm, setImportForm] = useState({
    file: null,
    laserMakeModel: '',
    laserType: '',
    wattage: '',
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState(null)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories', { credentials: 'include' }).then(r => r.json()),
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        materialName: '', laserType: '', wattage: '', mode: '',
        maxPower: '', speed: '', numPasses: '1',
        frequency: '', scanInterval: '', biDirectionalFill: false,
        crossHatch: false, scanAngle: '', angleIncrement: '',
        layerName: '', notes: '',
      })
    },
    onError: (err) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  const importMutation = useMutation({
    mutationFn: (formData) =>
      fetch('/api/settings/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json()
          throw new Error(err.error || 'Failed to import')
        }
        return r.json()
      }),
    onSuccess: (data) => {
      setImportResult(data)
      setError('')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setImportForm({ file: null, laserMakeModel: '', laserType: '', wattage: '' })
    },
    onError: (err) => {
      setError(err.message)
      setImportResult(null)
    },
  })

  function handleManualSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const data = {
      materialName: form.materialName,
      laserType: form.laserType,
      wattage: parseInt(form.wattage),
      mode: form.mode,
      maxPower: form.maxPower,
      speed: form.speed,
      numPasses: parseInt(form.numPasses) || 1,
    }

    if (form.frequency) data.frequency = form.frequency
    if (form.scanInterval) data.scanInterval = form.scanInterval
    if (form.layerName) data.layerName = form.layerName
    if (form.notes) data.notes = form.notes

    // Fill mode parameters
    if (form.mode === 'Fill') {
      data.biDirectionalFill = form.biDirectionalFill
      data.crossHatch = form.crossHatch
      if (form.scanAngle) data.scanAngle = parseFloat(form.scanAngle)
      if (form.angleIncrement) data.angleIncrement = parseFloat(form.angleIncrement)
    }

    mutation.mutate(data)
  }

  function handleImportSubmit(e) {
    e.preventDefault()
    setError('')
    setImportResult(null)

    if (!importForm.file) {
      setError('Please select a .clb file')
      return
    }

    const formData = new FormData()
    formData.append('file', importForm.file)
    formData.append('laserMakeModel', importForm.laserMakeModel)
    formData.append('laserType', importForm.laserType)
    formData.append('wattage', importForm.wattage)

    importMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-ls-surface rounded-lg">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-ls-accent text-white'
              : 'text-ls-text-muted hover:text-ls-text'
          }`}
        >
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setMode('import')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'import'
              ? 'bg-ls-accent text-white'
              : 'text-ls-text-muted hover:text-ls-text'
          }`}
        >
          Import .CLB File
        </button>
      </div>

      {success && mode === 'manual' && (
        <div className="bg-ls-green/10 border border-ls-green/30 rounded-lg p-4 text-ls-green text-sm">
          Setting submitted successfully! It's now live on Laserscribe.
        </div>
      )}

      {importResult && mode === 'import' && (
        <div className="bg-ls-green/10 border border-ls-green/30 rounded-lg p-4 text-sm">
          <p className="text-ls-green font-medium mb-2">Import completed!</p>
          <p className="text-ls-text-muted">
            ✅ {importResult.imported} settings imported successfully
          </p>
          {importResult.failed > 0 && (
            <p className="text-ls-red mt-1">
              ❌ {importResult.failed} settings failed (likely duplicates)
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-4 text-ls-red text-sm">
          {error}
        </div>
      )}

      {/* Manual Entry Form */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* Laser Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-ls-text">Laser Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Laser Type"
                placeholder="Select type..."
                value={form.laserType}
                onValueChange={(val) => setForm({ ...form, laserType: val })}
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
                placeholder="e.g., 50"
                value={form.wattage}
                onChange={(e) => setForm({ ...form, wattage: e.target.value })}
                required
              />

              <Input
                label="Laser Make/Model"
                id="layerName"
                placeholder="e.g., Gweike G2 Max 50"
                value={form.layerName}
                onChange={(e) => setForm({ ...form, layerName: e.target.value })}
              />
            </div>
          </div>

          {/* Material + Operation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-ls-text">Material & Operation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Material"
                id="materialName"
                placeholder="e.g., 3mm Birch Plywood"
                value={form.materialName}
                onChange={(e) => setForm({ ...form, materialName: e.target.value })}
                required
              />

              <Select
                label="Mode"
                placeholder="Select mode..."
                value={form.mode}
                onValueChange={(val) => setForm({ ...form, mode: val })}
              >
                <SelectItem value="Line">Line</SelectItem>
                <SelectItem value="Fill">Fill</SelectItem>
                <SelectItem value="Offset Fill">Offset Fill</SelectItem>
                <SelectItem value="Image">Image</SelectItem>
              </Select>
            </div>
          </div>

          {/* Settings Values */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-ls-text">Laser Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Max Power (%)"
                id="maxPower"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.maxPower}
                onChange={(e) => setForm({ ...form, maxPower: e.target.value })}
                required
              />
              <Input
                label="Speed (mm/s)"
                id="speed"
                type="number"
                step="0.01"
                min="0"
                value={form.speed}
                onChange={(e) => setForm({ ...form, speed: e.target.value })}
                required
              />
              <Input
                label="Frequency (kHz)"
                id="frequency"
                type="number"
                step="0.01"
                min="0"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Passes"
                id="numPasses"
                type="number"
                min="1"
                value={form.numPasses}
                onChange={(e) => setForm({ ...form, numPasses: e.target.value })}
              />
              <Input
                label="Scan Interval (mm)"
                id="scanInterval"
                type="number"
                step="0.001"
                min="0"
                placeholder="Optional (for Scan)"
                value={form.scanInterval}
                onChange={(e) => setForm({ ...form, scanInterval: e.target.value })}
              />
            </div>
          </div>

          {/* Fill Mode Parameters */}
          {form.mode === 'Fill' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-ls-text">Fill Mode Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="biDirectionalFill"
                    checked={form.biDirectionalFill}
                    onChange={(e) => setForm({ ...form, biDirectionalFill: e.target.checked })}
                    className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                  />
                  <label htmlFor="biDirectionalFill" className="text-sm text-ls-text cursor-pointer">
                    Bi-Directional Fill
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="crossHatch"
                    checked={form.crossHatch}
                    onChange={(e) => setForm({ ...form, crossHatch: e.target.checked })}
                    className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                  />
                  <label htmlFor="crossHatch" className="text-sm text-ls-text cursor-pointer">
                    Cross-Hatch
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Scan Angle (degrees)"
                  id="scanAngle"
                  type="number"
                  step="1"
                  min="0"
                  max="360"
                  placeholder="e.g., 0"
                  value={form.scanAngle}
                  onChange={(e) => setForm({ ...form, scanAngle: e.target.value })}
                />
                <Input
                  label="Angle Increment (degrees)"
                  id="angleIncrement"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g., 90"
                  value={form.angleIncrement}
                  onChange={(e) => setForm({ ...form, angleIncrement: e.target.value })}
                />
              </div>
            </div>
          )}

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
      )}

      {/* CLB Import Form */}
      {mode === 'import' && (
        <form onSubmit={handleImportSubmit} className="space-y-6">
          <div className="bg-ls-surface/50 border border-ls-border rounded-lg p-4 text-sm text-ls-text-muted">
            <p className="mb-2">Upload a LightBurn material library (.clb) file to bulk import your settings.</p>
            <p>All settings from the file will be added to your account.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-ls-text">Laser Information</h3>
            <p className="text-xs text-ls-text-muted">This information will be applied to all imported settings</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Laser Make/Model"
                id="importLaserMakeModel"
                placeholder="e.g., Gweike G2 Max 50"
                value={importForm.laserMakeModel}
                onChange={(e) => setImportForm({ ...importForm, laserMakeModel: e.target.value })}
                required
              />

              <Select
                label="Laser Type"
                placeholder="Select type..."
                value={importForm.laserType}
                onValueChange={(val) => setImportForm({ ...importForm, laserType: val })}
              >
                <SelectItem value="CO2">CO2</SelectItem>
                <SelectItem value="Fiber">Fiber</SelectItem>
                <SelectItem value="Diode">Diode</SelectItem>
                <SelectItem value="UV">UV</SelectItem>
                <SelectItem value="Infrared">Infrared</SelectItem>
              </Select>

              <Input
                label="Wattage (W)"
                id="importWattage"
                type="number"
                min="1"
                placeholder="e.g., 50"
                value={importForm.wattage}
                onChange={(e) => setImportForm({ ...importForm, wattage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="clbFile" className="block text-sm font-medium text-ls-text-muted">
              .CLB File
            </label>
            <input
              type="file"
              id="clbFile"
              accept=".clb"
              onChange={(e) => setImportForm({ ...importForm, file: e.target.files[0] })}
              className="block w-full text-sm text-ls-text
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-ls-accent file:text-white
                file:cursor-pointer
                hover:file:bg-ls-accent/90
                cursor-pointer"
              required
            />
            {importForm.file && (
              <p className="text-xs text-ls-text-muted mt-2">
                Selected: {importForm.file.name} ({(importForm.file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Button type="submit" disabled={importMutation.isPending} size="lg">
            {importMutation.isPending ? 'Importing...' : 'Import Settings'}
          </Button>
        </form>
      )}
    </div>
  )
}

export default ContributeForm
