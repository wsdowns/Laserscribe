package main

import (
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run csv_to_clb.go <input.csv> <output.clb>")
		os.Exit(1)
	}

	inputFile := os.Args[1]
	outputFile := os.Args[2]

	// Read CSV
	file, err := os.Open(inputFile)
	if err != nil {
		fmt.Printf("Error opening CSV: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		fmt.Printf("Error reading CSV: %v\n", err)
		os.Exit(1)
	}

	if len(records) < 2 {
		fmt.Println("CSV file is empty or has no data rows")
		os.Exit(1)
	}

	// Parse header
	header := records[0]
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[col] = i
	}

	// Group by material
	type Setting struct {
		Material             string
		Mode                 string
		ImageMode            string
		MaxPower             string
		Speed                string
		Frequency            string
		Passes               string
		ScanInterval         string
		BiDirectionalFill    string
		CrossHatch           string
		ScanAngle            string
		AngleIncrement       string
		AutoRotate           string
		FloodFill            string
		PerforationMode      string
		WobbleEnable         string
		EnableDotWidthAdjust string
		DotWidth             string
		NegativeImage        string
		Notes                string
	}

	materialSettings := make(map[string][]Setting)
	var materialOrder []string

	for i := 1; i < len(records); i++ {
		row := records[i]
		if len(row) == 0 || row[colMap["Material"]] == "" {
			continue
		}

		material := row[colMap["Material"]]
		setting := Setting{
			Material:             material,
			Mode:                 row[colMap["Mode"]],
			ImageMode:            row[colMap["Image Mode"]],
			MaxPower:             row[colMap["Max Power (%)"]],
			Speed:                row[colMap["Speed (mm/s)"]],
			Frequency:            row[colMap["Frequency (kHz)"]],
			Passes:               row[colMap["Passes"]],
			ScanInterval:         row[colMap["Scan Interval (mm)"]],
			BiDirectionalFill:    row[colMap["Bi-Directional Fill"]],
			CrossHatch:           row[colMap["Cross-Hatch"]],
			ScanAngle:            row[colMap["Scan Angle (deg)"]],
			AngleIncrement:       row[colMap["Angle Increment (deg)"]],
			AutoRotate:           row[colMap["Auto Rotate"]],
			FloodFill:            row[colMap["Flood Fill"]],
			PerforationMode:      row[colMap["Perforation Mode"]],
			WobbleEnable:         row[colMap["Wobble Enable"]],
			EnableDotWidthAdjust: row[colMap["Enable dot-width adjust"]],
			DotWidth:             row[colMap["Dot Width"]],
			NegativeImage:        row[colMap["Negative Image"]],
			Notes:                row[colMap["Notes"]],
		}

		if materialSettings[material] == nil {
			materialOrder = append(materialOrder, material)
		}
		materialSettings[material] = append(materialSettings[material], setting)
	}

	// Generate CLB XML
	var xml strings.Builder
	xml.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	xml.WriteString(`<LightBurnLibrary DisplayName="Laserscribe CSV Export">` + "\n")

	for _, material := range materialOrder {
		settings := materialSettings[material]
		xml.WriteString(fmt.Sprintf(`  <Material name="%s">`, material) + "\n")

		for _, setting := range settings {
			// Determine CutSetting type
			cutType := "Cut"
			noThickTitle := "Line Settings"
			desc := "Line"

			if setting.ImageMode != "" {
				cutType = "Image"
				// Format: "Image-Jarvis", "Image-3D"
				imageModeShort := setting.ImageMode
				if strings.Contains(strings.ToLower(imageModeShort), "3d") {
					imageModeShort = "3D"
				}
				noThickTitle = "Image-" + imageModeShort
				desc = setting.ImageMode + " Optimized"
			} else if setting.Mode == "Fill" {
				cutType = "Scan"
				noThickTitle = "Fill Settings"
				desc = "Fill"
			} else if setting.Mode == "Line" {
				cutType = "Cut"
				noThickTitle = "Line Settings"
				desc = "Line"
			}

			xml.WriteString(fmt.Sprintf(`    <Entry Thickness="-1.0000" Desc="%s" NoThickTitle="%s">`, desc, noThickTitle) + "\n")
			xml.WriteString(fmt.Sprintf(`      <CutSetting type="%s">`, cutType) + "\n")

			// Required fields
			xml.WriteString(`        <index Value="0"/>` + "\n")
			xml.WriteString(`        <name Value=""/>` + "\n")
			xml.WriteString(fmt.Sprintf(`        <LinkPath Value="%s/%s/%s"/>`, material, noThickTitle, desc) + "\n")
			xml.WriteString(fmt.Sprintf(`        <minPower Value="0"/>`) + "\n")
			xml.WriteString(fmt.Sprintf(`        <maxPower Value="%s"/>`, setting.MaxPower) + "\n")
			xml.WriteString(`        <maxPower2 Value="20"/>` + "\n")
			xml.WriteString(fmt.Sprintf(`        <speed Value="%s"/>`, setting.Speed) + "\n")

			// Optional fields - only include if non-empty
			if setting.Frequency != "" && setting.Frequency != "0" {
				// Convert kHz to Hz for LightBurn
				freq, _ := strconv.ParseFloat(setting.Frequency, 64)
				xml.WriteString(fmt.Sprintf(`        <frequency Value="%.0f"/>`, freq*1000) + "\n")
			}

			if setting.Passes != "" && setting.Passes != "1" {
				xml.WriteString(fmt.Sprintf(`        <numPasses Value="%s"/>`, setting.Passes) + "\n")
			}

			if setting.AngleIncrement != "" && setting.AngleIncrement != "0" {
				xml.WriteString(fmt.Sprintf(`        <anglePerPass Value="%s"/>`, setting.AngleIncrement) + "\n")
			}

			// Bidir
			if strings.ToLower(setting.BiDirectionalFill) == "yes" || strings.ToLower(setting.BiDirectionalFill) == "true" {
				xml.WriteString(`        <bidir Value="1"/>` + "\n")
			} else {
				xml.WriteString(`        <bidir Value="0"/>` + "\n")
			}

			// CrossHatch
			if strings.ToLower(setting.CrossHatch) == "yes" || strings.ToLower(setting.CrossHatch) == "true" {
				xml.WriteString(`        <crossHatch Value="1"/>` + "\n")
			}

			if setting.ScanInterval != "" && setting.ScanInterval != "0" {
				xml.WriteString(fmt.Sprintf(`        <interval Value="%s"/>`, setting.ScanInterval) + "\n")
			}

			if setting.ScanAngle != "" && setting.ScanAngle != "0" {
				xml.WriteString(fmt.Sprintf(`        <angle Value="%s"/>`, setting.ScanAngle) + "\n")
			}

			// ditherMode for Image mode
			if setting.ImageMode != "" {
				ditherMode := strings.ToLower(strings.ReplaceAll(setting.ImageMode, " ", ""))
				// Fix known mappings
				if ditherMode == "3dsliced" {
					ditherMode = "3dslice"
				}
				xml.WriteString(fmt.Sprintf(`        <ditherMode Value="%s"/>`, ditherMode) + "\n")
			}

			// Priority
			xml.WriteString(`        <priority Value="0"/>` + "\n")

			// Optional boolean fields
			if strings.ToLower(setting.WobbleEnable) == "yes" || strings.ToLower(setting.WobbleEnable) == "true" {
				xml.WriteString(`        <wobbleEnable Value="1"/>` + "\n")
			}

			if strings.ToLower(setting.PerforationMode) == "yes" || strings.ToLower(setting.PerforationMode) == "true" {
				xml.WriteString(`        <perforationMode Value="1"/>` + "\n")
			}

			if strings.ToLower(setting.NegativeImage) == "yes" || strings.ToLower(setting.NegativeImage) == "true" {
				xml.WriteString(`        <negativeImage Value="1"/>` + "\n")
			}

			// Debug: check what we're reading
			enableVal := strings.TrimSpace(strings.ToLower(setting.EnableDotWidthAdjust))
			if enableVal == "yes" || enableVal == "true" {
				xml.WriteString(`        <useDotCorrection Value="1"/>` + "\n")
			} else if setting.DotWidth != "" && setting.DotWidth != "0" {
				// If dotWidth is set but enable is not "Yes", print debug
				fmt.Fprintf(os.Stderr, "DEBUG: Material=%s Mode=%s DotWidth=%s EnableDotWidthAdjust=[%s] enableVal=[%s]\n",
					material, setting.Mode, setting.DotWidth, setting.EnableDotWidthAdjust, enableVal)
			}

			if setting.DotWidth != "" && setting.DotWidth != "0" {
				xml.WriteString(fmt.Sprintf(`        <dotWidth Value="%s"/>`, setting.DotWidth) + "\n")
			}

			if strings.ToLower(setting.FloodFill) == "yes" || strings.ToLower(setting.FloodFill) == "true" {
				xml.WriteString(`        <floodFill Value="1"/>` + "\n")
			}

			if strings.ToLower(setting.AutoRotate) == "yes" || strings.ToLower(setting.AutoRotate) == "true" {
				xml.WriteString(`        <autoRotate Value="1"/>` + "\n")
			}

			xml.WriteString(`      </CutSetting>` + "\n")
			xml.WriteString(`    </Entry>` + "\n")
		}

		xml.WriteString(`  </Material>` + "\n")
	}

	xml.WriteString(`</LightBurnLibrary>` + "\n")

	// Write output file
	err = os.WriteFile(outputFile, []byte(xml.String()), 0644)
	if err != nil {
		fmt.Printf("Error writing output file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully generated %s from %s\n", outputFile, inputFile)
	fmt.Printf("Materials: %d\n", len(materialOrder))
	totalSettings := 0
	for _, settings := range materialSettings {
		totalSettings += len(settings)
	}
	fmt.Printf("Settings: %d\n", totalSettings)
}
