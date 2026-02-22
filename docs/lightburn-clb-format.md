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

| `type` Value | LightBurn Mode | Use Case |
|-------------|----------------|----------|
| `Cut` | Line | Cutting, scoring, vector lines |
| `Scan` | Fill | Raster engraving, fills |
| `Scan+Cut` | Fill+Line | Combined fill and outline |

## CutSetting Fields

All fields use the format `<fieldName Value="..."/>`.

### Required Fields

These fields appear in every CutSetting:

| Field | Type | Description |
|-------|------|-------------|
| `index` | int | Always `0` in library entries |
| `name` | string | Always empty (`""`) in library entries |
| `LinkPath` | string | **Critical.** Path that indexes the entry: `MaterialName/NoThickTitle/Desc` |
| `maxPower` | int | Maximum laser power (0-100%) |
| `maxPower2` | int | Maximum power for second laser (typically `20`) |
| `speed` | int/float | Speed in mm/s |
| `frequency` | int | Pulse frequency in Hz (e.g., `50000` = 50kHz). For fiber lasers. |
| `priority` | int | Layer priority order (typically `0`) |
| `tabCount` | int | Tab count (typically `1`) |
| `tabCountMax` | int | Max tab count (typically `1`) |

### Optional Fields

Only include these when the value differs from LightBurn's defaults:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `numPasses` | int | 1 | Number of passes |
| `interval` | float | — | Scan line spacing in mm (e.g., `0.03`). Used with `Scan` type. |
| `crossHatch` | int | 0 | Enable cross-hatch pattern. `1` = on, `0` = off. |
| `angle` | float | 0 | Scan angle in degrees |
| `anglePerPass` | float | 0 | Angle increment per pass in degrees |
| `scanOpt` | string | — | Scan optimization: `"mergeAll"`, `"byGroup"`, `"individual"` |
| `bidir` | int | 1 | Bidirectional scanning. `1` = on. |
| `overscan` | float | 0 | Overscan distance in mm |
| `overscanPercent` | float | 2.5 | Overscan percentage |
| `floodFill` | int | 0 | Flood fill mode |
| `minPower` | int | 0 | Minimum laser power |
| `minPower2` | int | 10 | Minimum power for second laser |
| `kerf` | float | 0 | Kerf offset in mm |
| `zOffset` | float | 0 | Z-axis offset in mm |
| `zPerPass` | float | 0 | Z-axis movement per pass in mm |
| `numPasses` | int | 1 | Number of passes |
| `runBlower` | int | — | Air assist. `1` = on, `0` = off. |

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
