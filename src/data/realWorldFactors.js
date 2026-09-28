// src/data/realWorldFactors.js

/*
  EcoBuild AI
  Real-World Environmental Factors

  These factors come from documented public sources.

  IMPORTANT:
  A factor is not the same thing as a complete building impact model.

  Example:

      Electricity consumption
              ↓
      kWh consumed
              ↓
      Grid emission factor
              ↓
      kg CO2e

  We keep source information with every factor
  so the system remains explainable.
*/


export const REAL_WORLD_FACTORS = {

  electricity: {
    value: 0.827,

    unit: "kg CO2/kWh",

    source:
      "Central Electricity Authority (CEA) - CO2 Baseline Database",

    year: "FY 2022-23",

    region: "Indian Grid",

    methodology:
      "Weighted average emission factor",

    confidence: "official-reference",

    note:
      "CEA reports 0.827 tCO2/MWh for the weighted average Indian Grid factor excluding cross-border power transfers.",
  },


  electricityBEE: {
    value: 0.71,

    unit: "kg CO2/kWh",

    source:
      "Bureau of Energy Efficiency (BEE) - ECBC programme",

    year: "2022-23 programme calculation",

    region: "India",

    methodology:
      "Electricity CO2 conversion factor used in ECBC savings calculation",

    confidence: "official-reference",

    note:
      "BEE uses 0.71 kg CO2/kWh for its ECBC programme CO2 reduction calculation.",
  },


  urbanWater: {
    value: 135,

    unit: "litres/person/day",

    source:
      "CPHEEO / Ministry of Urban Development reference cited by MoHUA",

    year: "reference benchmark",

    region: "Urban India",

    methodology:
      "Per-capita water supply benchmark",

    confidence: "official-reference",

    note:
      "This is a per-capita water supply benchmark, not a direct building water-consumption factor.",
  },


  municipalWaste: {
    value: 0.12345,

    unit: "kg/person/day",

    source:
      "Central Pollution Control Board (CPCB), Annual Report on Solid Waste Management 2021-22",

    year: "2021-22",

    region: "India",

    methodology:
      "Reported average per-capita municipal solid waste generation",

    confidence: "official-reference",

    note:
      "CPCB reports 123.45 grams/person/day average per-capita waste generation.",
  },

};