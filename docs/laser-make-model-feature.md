# Laser Make and Model Collection Feature

## Overview

Laserscribe collects laser make and model information to help users identify which specific laser machines the settings were optimized for. This enhances discoverability and builds user confidence in the settings.

## User Flows

### 1. Single Setting Contribution (Manual Entry)

When a user manually enters a setting via the contribution form:

1. User fills in the standard fields (material, laser type, wattage, operation type, power, speed, etc.)
2. User is prompted to enter **Laser Make and Model**
   - **Field label:** "Laser Make and Model"
   - **Placeholder:** "e.g., Gweike 20W Fiber, OMTech 60W CO2"
   - **Type:** Text input
   - **Required:** Yes
   - **Validation:** Minimum 3 characters
3. System stores the value in the `layer_name` database column
4. When exported to .clb, this value populates `<name Value="Gweike 20W Fiber"/>`

### 2. Bulk .clb File Upload

When a user uploads a .clb file for import:

1. User drops/selects a .clb file
2. System parses the file and displays a preview table of all settings
3. User is prompted to enter **Laser Make and Model** (single input applies to all settings in the file)
   - **Field label:** "What laser were these settings created for?"
   - **Placeholder:** "e.g., Gweike 20W Fiber"
   - **Type:** Text input
   - **Required:** Yes
   - **Validation:** Minimum 3 characters
   - **Position:** Above the preview table, after laser type and wattage selectors
4. User selects laser type and wattage (existing flow)
5. User clicks "Publish to PowerScale"
6. System applies the make/model to all settings in the batch
7. Each setting stores the value in the `layer_name` database column

#### Special Import Cases

**3-Level Hierarchy (NoThickTitle ≠ Desc):**
When a .clb file uses sub-categories:
```xml
<Material name="Brass-Fill">
    <Entry Desc="Fastest Speed" NoThickTitle="Optimized Brass Fill Settings">
```
- Import material as: `"Brass-Fill - Optimized Brass Fill Settings"`
- This concatenates the material name with the sub-category

**SubLayer Elements (Multi-Pass Operations):**
When a CutSetting contains nested SubLayer elements:
```xml
<CutSetting type="Image">
    <subname Value="3D Slice"/>
    ...
    <SubLayer type="Scan">
        <subname Value="Cleanup"/>
        ...
    </SubLayer>
</CutSetting>
```
- Import as **two separate settings**:
  1. Main pass: Material = `"Brass-Engrave - Optimized Engrave Settings"`
  2. SubLayer: Material = `"Brass-Engrave - Cleanup"`
- Each gets its own power/speed/frequency from its respective element

## Storage

- **Database column:** `settings.layer_name` (VARCHAR(200), Nullable, already exists in schema)
- **CLB export:** Appended to material name - e.g., `<Material name="Stainless Steel (Gweike 20W Fiber)">`
  - **Note:** LightBurn strips the `<name>` field from library files, so we encode the laser info in the material name instead

## Display

### In Search Results
- Display make/model as a badge or metadata line in the settings table
- Example: "Gweike 20W Fiber" shown next to or below the material name

### In Settings Detail Modal
- Show make/model in a dedicated field: "Optimized for: Gweike 20W Fiber"

### In Downloaded .clb Files
- Appears as the layer name when users load the .clb into LightBurn

## Future Considerations

### Make/Model Normalization
Similar to material aliases, we may want to normalize make/model entries to handle:
- Inconsistent capitalization (e.g., "OMTech" vs "omtech" vs "Om Tech")
- Abbreviations (e.g., "Gweike G2 50" vs "G2 50 Max")
- Manufacturer variations (e.g., "xTool D1 Pro" vs "xtool d1 pro")

This could be implemented via:
1. A `laser_machines` table with canonical names
2. A `laser_machine_aliases` table for variations
3. Autocomplete dropdown to suggest existing machines during contribution

For now, free-text entry is sufficient. Migration to normalized tables can happen later without data loss (the `layer_name` values can be bulk-matched and associated with canonical machine IDs).

## Technical Notes

- The `layer_name` column already exists in the `settings` table from the original schema
- LightBurn's `<name>` field is traditionally empty or user-defined; Laserscribe repurposes it for laser identification
- This approach is backwards-compatible: if `layer_name` is NULL/empty, the .clb export will use `<name Value=""/>`
