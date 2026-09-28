// src/data/environmentalData.js

/*
  EcoBuild AI
  STEP 12 - DATA DRIVEN ENVIRONMENTAL MODEL

  This file contains object-level simulation profiles.

  Important:
  These object profiles are simulation/reference assumptions.
  They are NOT official measurements.

  Official conversion factors are stored separately
  inside realWorldFactors.js.
*/

export const DATA_STATUS = {
  currentVersion: "0.2.0",

  region: "India",

  baseYear: "FY 2022-23",

  timeBasis: "daily",

  methodology:
    "Hybrid reference profiles + official environmental factors",

  note:
    "Object profiles are simulation assumptions. Official conversion factors are maintained separately with source information.",
};


/*
  Common metadata
*/

const common = {

  dataType: "reference",

  confidence: "prototype",

  timeBasis: "daily",

};


/*
  Environmental profiles
*/

export const ENVIRONMENTAL_DATA = {


  // =====================================================
  // HOUSE
  // =====================================================

  house: {

    category: "building",

    profile: {

      area: 100,

      occupants: 4,

      energyPerArea: 8,

      operatingHours: 12,

      waterPerPerson: 135,

      wastePerPerson: 0.12345,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI residential reference profile",

      explanation:
        "Residential baseline using Indian urban reference factors.",

    },

  },


  // =====================================================
  // FACTORY
  // =====================================================

  factory: {

    category: "industrial",

    profile: {

      area: 1000,

      occupants: 50,

      energyPerArea: 20,

      operatingHours: 16,

      waterPerPerson: 135,

      wastePerPerson: 0.30,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI industrial reference profile",

      explanation:
        "Simplified industrial simulation profile. Industrial-specific measured data can replace this later.",

    },

  },


  // =====================================================
  // OFFICE
  // =====================================================

  office: {

    category: "commercial",

    profile: {

      area: 500,

      occupants: 30,

      energyPerArea: 12,

      operatingHours: 10,

      waterPerPerson: 135,

      wastePerPerson: 0.20,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI commercial reference profile",

      explanation:
        "Commercial building scenario profile.",

    },

  },


  // =====================================================
  // SCHOOL
  // =====================================================

  school: {

    category: "education",

    profile: {

      area: 800,

      occupants: 100,

      energyPerArea: 8,

      operatingHours: 8,

      waterPerPerson: 45,

      wastePerPerson: 0.10,

      greenCover: 50,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI institutional reference profile",

      explanation:
        "Institutional simulation profile.",

    },

  },


  // =====================================================
  // HOSPITAL
  // =====================================================

  hospital: {

    category: "healthcare",

    profile: {

      area: 1000,

      occupants: 100,

      energyPerArea: 25,

      operatingHours: 24,

      waterPerPerson: 200,

      wastePerPerson: 0.50,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI healthcare reference profile",

      explanation:
        "Higher operating, water and waste assumptions for scenario modelling.",

    },

  },


  // =====================================================
  // SOLAR
  // =====================================================

  solar: {

    category: "renewable-energy",

    profile: {

      area: 20,

      occupants: 0,

      energyPerArea: -25,

      operatingHours: 8,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI renewable-energy reference profile",

      explanation:
        "Negative energy represents simulated renewable generation.",

    },

  },


  // =====================================================
  // WIND TURBINE
  // =====================================================

  windTurbine: {

    category: "renewable-energy",

    profile: {

      area: 30,

      occupants: 0,

      energyPerArea: -30,

      operatingHours: 8,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI renewable-energy reference profile",

      explanation:
        "Negative energy represents simulated renewable generation.",

    },

  },


  // =====================================================
  // TREE
  // =====================================================

  tree: {

    category: "nature",

    profile: {

      area: 1,

      occupants: 0,

      energyPerArea: 0,

      operatingHours: 0,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 5,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI vegetation reference profile",

      explanation:
        "Green-cover contribution is a simulation variable.",

    },

  },


  // =====================================================
  // FOREST
  // =====================================================

  forest: {

    category: "nature",

    profile: {

      area: 15,

      occupants: 0,

      energyPerArea: 0,

      operatingHours: 0,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 30,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI vegetation reference profile",

      explanation:
        "Large vegetation-area simulation profile.",

    },

  },


  // =====================================================
  // PARK
  // =====================================================

  park: {

    category: "green-space",

    profile: {

      area: 100,

      occupants: 0,

      energyPerArea: 0,

      operatingHours: 0,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 12,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI urban green-space reference profile",

      explanation:
        "Urban green-space simulation profile.",

    },

  },


  // =====================================================
  // ROAD
  // =====================================================

  road: {

    category: "infrastructure",

    profile: {

      area: 100,

      occupants: 0,

      energyPerArea: 0,

      operatingHours: 0,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI infrastructure reference profile",

      explanation:
        "Road land-use profile. Lifecycle construction emissions are not yet included.",

    },

  },


  // =====================================================
  // WATER TANK
  // =====================================================

  waterTank: {

    category: "water",

    profile: {

      area: 20,

      occupants: 0,

      energyPerArea: 1,

      operatingHours: 4,

      waterPerPerson: 0,

      wastePerPerson: 0,

      greenCover: 0,

    },

    metadata: {

      ...common,

      source:
        "EcoBuild AI water-infrastructure reference profile",

      explanation:
        "Water-management infrastructure scenario.",

    },

  },

};


/*
  Helper function
*/

export function getEnvironmentalProfile(objectType) {

  return ENVIRONMENTAL_DATA[objectType] || null;

}