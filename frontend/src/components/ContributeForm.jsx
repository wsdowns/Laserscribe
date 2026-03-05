import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Select, SelectItem } from './ui/Select'
import Input from './ui/Input'
import Button from './ui/Button'
import Card from './ui/Card'

function ContributeForm({ user, initialMode = 'manual' }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState(initialMode) // 'manual' or 'import'
  const [form, setForm] = useState({
    materialName: '',
    laserType: '',
    wattage: '',
    mode: '',
    maxPower: '',
    bidir: false,
    crossHatch: false,
    scanInterval: '',
    angle: '',
    anglePerPass: '',
    autoRotate: false,
    floodFill: false,
    perforationMode: false,
    wobbleEnable: false,
    imageMode: '',
    negativeImage: false,
    useDotCorrection: false,
    dotWidth: '',
    speed: '',
    numPasses: '1',
    frequency: '',
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
        maxPower: '', bidir: false, crossHatch: false,
        scanInterval: '', angle: '', anglePerPass: '',
        autoRotate: false, floodFill: false, perforationMode: false,
        wobbleEnable: false, imageMode: '', negativeImage: false,
        useDotCorrection: false, dotWidth: '',
        speed: '', numPasses: '1', frequency: '', layerName: '', notes: '',
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
    if (form.layerName) data.layerName = form.layerName
    if (form.notes) data.notes = form.notes

    // Additional parameters
    data.bidir = form.bidir
    data.crossHatch = form.crossHatch
    data.autoRotate = form.autoRotate
    data.floodFill = form.floodFill
    data.perforationMode = form.perforationMode
    data.wobbleEnable = form.wobbleEnable
    data.negativeImage = form.negativeImage
    data.useDotCorrection = form.useDotCorrection
    if (form.imageMode) data.imageMode = form.imageMode
    if (form.dotWidth) data.dotWidth = form.dotWidth
    if (form.scanInterval) data.scanInterval = parseFloat(form.scanInterval)
    if (form.angle) data.angle = parseFloat(form.angle)
    if (form.anglePerPass) data.anglePerPass = parseFloat(form.anglePerPass)

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
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 left-0 lg:left-64 bg-black/50 z-40"></div>

          {/* Modal Content */}
          <div className="fixed inset-0 left-0 lg:left-64 flex items-center justify-center z-50 p-6 pointer-events-none">
            <Card className="w-full max-w-md text-center pointer-events-auto">
              <div className="mb-6">
                <svg className="w-20 h-20 text-ls-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ls-text mb-4">Import Completed!</h2>
              <div className="space-y-2 mb-6">
                <p className="text-lg text-ls-green">
                  ✅ {importResult.imported} settings imported successfully
                </p>
                {importResult.failed > 0 && (
                  <p className="text-ls-red">
                    ❌ {importResult.failed} settings failed
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/search';
                }}
                className="w-full px-6 py-3 bg-ls-accent text-white rounded-lg hover:bg-ls-accent/90 font-medium text-lg cursor-pointer"
              >
                Go to Search
              </button>
            </Card>
          </div>
        </>
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
                placeholder="e.g., Brass, Copper, etc."
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

            {/* Row 1: Max Power, Speed, Frequency */}
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

            {/* Line Mode: Passes */}
            {form.mode === 'Line' && (
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Passes"
                  id="numPasses"
                  type="number"
                  min="1"
                  value={form.numPasses}
                  onChange={(e) => setForm({ ...form, numPasses: e.target.value })}
                />
              </div>
            )}

            {/* Fill/Offset Fill Mode: Checkboxes */}
            {(form.mode === 'Fill' || form.mode === 'Offset Fill') && (
              <div className="flex justify-end">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bidir"
                    checked={form.bidir}
                    onChange={(e) => setForm({ ...form, bidir: e.target.checked })}
                    className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                  />
                  <label htmlFor="bidir" className="text-sm text-ls-text cursor-pointer">
                    Bi-directional Fill
                  </label>
                </div>
                <div className="flex items-center gap-2">
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
              </div>
            )}

            {/* Image Mode: Checkboxes */}
            {form.mode === 'Image' && (
              <div className="flex justify-end">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bidir"
                      checked={form.bidir}
                      onChange={(e) => setForm({ ...form, bidir: e.target.checked })}
                      className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                    />
                    <label htmlFor="bidir" className="text-sm text-ls-text cursor-pointer">
                      Bi-directional Fill
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="negativeImage"
                      checked={form.negativeImage}
                      onChange={(e) => setForm({ ...form, negativeImage: e.target.checked })}
                      className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                    />
                    <label htmlFor="negativeImage" className="text-sm text-ls-text cursor-pointer">
                      Negative Image
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Row 3: Scan Interval, Angle, Angle Per Pass - Show for Fill/Image/Offset Fill */}
            {(form.mode === 'Fill' || form.mode === 'Image' || form.mode === 'Offset Fill') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Line Interval (mm)"
                  id="scanInterval"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="e.g., 0.1"
                  value={form.scanInterval}
                  onChange={(e) => setForm({ ...form, scanInterval: e.target.value })}
                />
                <Input
                  label="Scan Angle (deg)"
                  id="angle"
                  type="number"
                  step="1"
                  min="0"
                  max="360"
                  placeholder="e.g., 0"
                  value={form.angle}
                  onChange={(e) => setForm({ ...form, angle: e.target.value })}
                />
                <Input
                  label="Angle Increment (deg)"
                  id="anglePerPass"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g., 90"
                  value={form.anglePerPass}
                  onChange={(e) => setForm({ ...form, anglePerPass: e.target.value })}
                />
              </div>
            )}

            {/* Image Mode Selector - For Image mode */}
            {form.mode === 'Image' && (
              <Select
                label="Image Mode"
                placeholder="Select image mode..."
                value={form.imageMode}
                onValueChange={(val) => setForm({ ...form, imageMode: val })}
                required
              >
                <SelectItem value="Threshold">Threshold</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Atkinson">Atkinson</SelectItem>
                <SelectItem value="Dither">Dither</SelectItem>
                <SelectItem value="Stucki">Stucki</SelectItem>
                <SelectItem value="Jarvis">Jarvis</SelectItem>
                <SelectItem value="Newsprint">Newsprint</SelectItem>
                <SelectItem value="Halftone">Halftone</SelectItem>
                <SelectItem value="Sketch">Sketch</SelectItem>
                <SelectItem value="Grayscale">Grayscale</SelectItem>
                <SelectItem value="3D Sliced">3D Sliced</SelectItem>
              </Select>
            )}

            {/* Row 4: Passes - For Fill, Image, Offset Fill modes */}
            {(form.mode === 'Fill' || form.mode === 'Image' || form.mode === 'Offset Fill') && (
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Passes"
                  id="numPasses"
                  type="number"
                  min="1"
                  value={form.numPasses}
                  onChange={(e) => setForm({ ...form, numPasses: e.target.value })}
                />
              </div>
            )}

            {/* Auto Rotate, Flood Fill, Dot Correction, Dot Width - For Fill/Offset Fill modes */}
            {(form.mode === 'Fill' || form.mode === 'Offset Fill') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoRotate"
                      checked={form.autoRotate}
                      onChange={(e) => setForm({ ...form, autoRotate: e.target.checked })}
                      className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                    />
                    <label htmlFor="autoRotate" className="text-sm text-ls-text cursor-pointer">
                      Auto Rotate
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="floodFill"
                      checked={form.floodFill}
                      onChange={(e) => setForm({ ...form, floodFill: e.target.checked })}
                      className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                    />
                    <label htmlFor="floodFill" className="text-sm text-ls-text cursor-pointer">
                      Flood Fill
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useDotCorrection"
                      checked={form.useDotCorrection}
                      onChange={(e) => setForm({ ...form, useDotCorrection: e.target.checked })}
                      className="w-4 h-4 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent"
                    />
                    <label htmlFor="useDotCorrection" className="text-sm text-ls-text cursor-pointer">
                      Use Dot Correction
                    </label>
                  </div>
                  <Input
                    label="Dot Width"
                    id="dotWidth"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="e.g., 0.05"
                    value={form.dotWidth}
                    onChange={(e) => setForm({ ...form, dotWidth: e.target.value })}
                  />
                </div>
              </>
            )}
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
