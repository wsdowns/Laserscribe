# LightBurn Material Library (.clb) File Format

LightBurn uses `.clb` files to store material library presets. The format is undocumented by LightBurn Software, so this reference was reverse-engineered from working files.

## Overview

- **Encoding:** UTF-8, no BOM, Unix line endings (`\n`)
- **Format:** XML
- **Extension:** `.clb`
- **Import method:** LightBurn Library panel > Load

## XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightBurnLibrary DisplayName="Library Name">
    <Material name="Material Name">
        <Entry Thickness="-1.0000" Desc="Operation Name" NoThickTitle="Operation Name">
            <CutSetting type="Cut">
                <!-- settings -->
            </CutSetting>
        </Entry>
    </Material>
</LightBurnLibrary>
```

## Root Element

```xml
<LightBurnLibrary DisplayName="Library Name">
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `DisplayName` | **Yes** | Name shown in LightBurn's library dropdown. Without this attribute, the library will not load. |

## Material Element

```xml
<Material name="Stainless Steel">
```

Groups entries by material. LightBurn sorts materials alphabetically on save.

## Entry Element

```xml
<Entry Thickness="-1.0000" Desc="Fill" NoThickTitle="Fill">
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `Thickness` | Yes | Material thickness in mm. Use `"-1.0000"` for unspecified thickness. |
| `Desc` | Yes | Description/operation name shown in the library tree. |
| `NoThickTitle` | Yes | Title used when thickness is unspecified (`-1.0000`). Typically matches `Desc`. |

## CutSetting Element

```xml
<CutSetting type="Cut">
```

| `type` Value | LightBurn Mode | DB `operation_type` | Use Case |
|-------------|----------------|---------------------|----------|
| `Cut` | Line | `Cut` | Cutting, scoring, vector lines |
| `Scan` | Fill | `Scan` | Raster engraving, fills |
| `Scan+Cut` | Fill+Line | `ScanCut` | Combined fill and outline |

**Important:** LightBurn uses `"Scan+Cut"` in the XML but the database ENUM stores this as `ScanCut` (the `+` character is problematic in ENUMs and URL query params). Import/export code must map between these two representations.

## CutSetting Fields

All fields use the format `<fieldName Value="..."/>`.

### Required Fields

These fields appear in every CutSetting:

| Field | Type | Description |
|-------|------|-------------|
| `index` | int | Always `0` in library entries |
| `name` | string | Layer name. Usually empty (`""`), but can hold a user-defined name. |
| `LinkPath` | string | **Critical.** Path that indexes the entry: `MaterialName/NoThickTitle/Desc` |
| `maxPower` | int | Maximum laser power (0-100%) |
| `maxPower2` | int | Maximum power for second laser (typically `20`) |
| `speed` | int/float | Speed in mm/s |
| `frequency` | int | Pulse frequency in Hz (e.g., `50000` = 50kHz). For fiber lasers. |
| `priority` | int | Layer priority order (typically `0`) |
| `tabCount` | int | Tab count (typically `1`) |
| `tabCountMax` | int | Max tab count (typically `1`) |

### Scan / Fill Settings

Fields specific to `Scan` (Fill) and `Scan+Cut` (Fill+Line) modes:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `interval` | float | — | Scan line spacing in mm (e.g., `0.03`). Controls engraving resolution. |
| `crossHatch` | int | 0 | Enable cross-hatch pattern. `1` = on, `0` = off. |
| `angle` | float | 0 | Scan angle in degrees |
| `anglePerPass` | float | 0 | Angle increment per pass in degrees. **Not** `angleIncrement`. |
| `scanOpt` | string | — | Scan optimization: `"mergeAll"`, `"byGroup"`, `"individual"` |
| `bidir` | int | 1 | Bidirectional scanning. `1` = on. |
| `floodFill` | int | 0 | Flood fill mode. `1` = on. Fills from inside out instead of line-by-line. |
| `autoRotate` | int | 0 | Auto-rotate scan angle for optimal path. `1` = on. |
| `overscan` | float | 0 | Overscan distance in mm |
| `overscanPercent` | float | 2.5 | Overscan percentage |

### Power and Speed

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxPower` | int | — | Maximum laser power (0-100%) |
| `minPower` | int | 0 | Minimum laser power (0-100%) |
| `maxPower2` | int | 20 | Maximum power for second laser |
| `minPower2` | int | 10 | Minimum power for second laser |
| `speed` | int/float | — | Speed in mm/s |

### Passes and Z-Axis

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `numPasses` | int | 1 | Number of passes |
| `zOffset` | float | 0 | Z-axis offset in mm |
| `zPerPass` | float | 0 | Z-axis movement per pass in mm |

### Fiber / Galvo Laser Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `frequency` | int | — | Pulse frequency in Hz (e.g., `50000` = 50kHz) |
| `wobbleEnable` | int | 0 | Enable wobble mode for fiber lasers. `1` = on. Wobble oscillates the beam for wider marking lines. |
| `useDotCorrection` | int | 0 | Enable dot correction for galvo lasers. `1` = on. Adjusts timing for consistent dot placement. |

### Cut / Line Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kerf` | float | 0 | Kerf offset in mm |
| `runBlower` | int | — | Air assist. `1` = on, `0` = off. |

### Layer Naming

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | `""` | Layer name. Can hold a user-defined name or be left empty. |
| `subname` | string | `""` | Sub-layer name. Used for additional layer identification. |

## Complete Example (All Fields)

This example shows every confirmed field, with all toggles enabled:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightBurnLibrary DisplayName="My Library">
    <Material name="Brass">
        <Entry Thickness="-1.0000" Desc="Full Settings" NoThickTitle="Full Settings">
            <CutSetting type="Scan">
                <index Value="0"/>
                <name Value="Layer Name"/>
                <LinkPath Value="Brass/Full Settings/Full Settings"/>
                <maxPower Value="90"/>
                <maxPower2 Value="20"/>
                <speed Value="1800"/>
                <frequency Value="50000"/>
                <wobbleEnable Value="1"/>
                <numPasses Value="3"/>
                <anglePerPass Value="15"/>
                <scanOpt Value="byGroup"/>
                <crossHatch Value="1"/>
                <useDotCorrection Value="1"/>
                <floodFill Value="1"/>
                <interval Value="0.0064"/>
                <angle Value="25"/>
                <autoRotate Value="1"/>
                <subname Value="Sub-layer Name"/>
                <priority Value="0"/>
                <tabCount Value="1"/>
                <tabCountMax Value="1"/>
            </CutSetting>
        </Entry>
    </Material>
</LightBurnLibrary>
```

## Minimal Working Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightBurnLibrary DisplayName="My Library">
    <Material name="Stainless Steel">
        <Entry Thickness="-1.0000" Desc="Fill" NoThickTitle="Fill">
            <CutSetting type="Scan">
                <index Value="0"/>
                <name Value=""/>
                <LinkPath Value="Stainless Steel/Fill/Fill"/>
                <maxPower Value="75"/>
                <maxPower2 Value="20"/>
                <speed Value="1000"/>
                <frequency Value="50000"/>
                <crossHatch Value="1"/>
                <anglePerPass Value="15"/>
                <interval Value="0.03"/>
                <angle Value="25"/>
                <priority Value="0"/>
                <tabCount Value="1"/>
                <tabCountMax Value="1"/>
            </CutSetting>
        </Entry>
    </Material>
</LightBurnLibrary>
```

## Important Notes

- **`DisplayName` is required** on `<LightBurnLibrary>`. Without it, materials will not appear after loading.
- **`LinkPath` is required** on each CutSetting. Format: `MaterialName/NoThickTitle/Desc`.
- **`NoThickTitle` is required** on each Entry. Without it, entries may not display.
- **Thickness `-1.0000`** means "no specific thickness." Use `"3.0000"` etc. for specific thicknesses.
- **LightBurn re-sorts** materials alphabetically when saving.
- **LightBurn strips** unrecognized fields on save — only include known fields.
- **Only include non-default values.** LightBurn omits default-valued fields when saving.
- The angle increment field is `anglePerPass`, **not** `angleIncrement`.
- The `name` field can hold a user-defined layer name (not always empty as previously assumed).
- The `subname` field provides secondary layer identification.
