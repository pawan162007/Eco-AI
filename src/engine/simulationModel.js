// src/engine/simulationModel.js

import {
  ENVIRONMENTAL_DATA,
} from "../data/environmentalData";

import {
  REAL_WORLD_FACTORS,
} from "../data/realWorldFactors";


/*
  =========================================================
  ECOBUILD AI
  DATA-DRIVEN SIMULATION MODEL
  =========================================================

  Pipeline:

  Virtual Object
        ↓
  Environmental Profile
        ↓
  User Parameters
        ↓
  Energy
  Water
  Waste
  Land
  Green Cover
        ↓
  CO2 Calculation
*/


/*
  =========================================================
  OBJECT PARAMETERS
  =========================================================
*/

export const OBJECT_PARAMETERS =
  Object.fromEntries(

    Object.entries(
      ENVIRONMENTAL_DATA
    ).map(
      ([type, data]) => [

        type,

        {
          ...data.profile,
        },

      ]
    )

  );


/*
  =========================================================
  DEFAULT PARAMETERS
  =========================================================
*/

export function getDefaultParameters(
  objectType
) {

  const params =
    OBJECT_PARAMETERS[objectType];


  if (!params) {

    return null;

  }


  return {

    ...params,

  };

}


/*
  =========================================================
  MERGE DEFAULT + CUSTOM PARAMETERS
  =========================================================
*/

function getMergedParameters(
  objectType,
  customParameters = {}
) {

  const defaults =
    OBJECT_PARAMETERS[objectType];


  if (!defaults) {

    return null;

  }


  return {

    ...defaults,

    ...customParameters,

  };

}


/*
  =========================================================
  ENERGY
  =========================================================

  Energy =
      Area
      × Energy Intensity
      × Operating Hour Factor
*/

export function calculateEnergy(
  objectType,
  customParameters = {}
) {

  const params =
    getMergedParameters(
      objectType,
      customParameters
    );


  if (!params) {

    return 0;

  }


  const area =
    Number(params.area) || 0;


  const energyPerArea =
    Number(params.energyPerArea) || 0;


  const operatingHours =
    Number(params.operatingHours) || 0;


  return (

    area *

    energyPerArea *

    (operatingHours / 24)

  );

}


/*
  =========================================================
  CO2 FROM ELECTRICITY
  =========================================================

  CO2 =
      Energy × Grid Emission Factor
*/

export function calculateCO2FromEnergy(
  energy
) {

  const factor =
    REAL_WORLD_FACTORS
      .electricity
      .value;


  return energy * factor;

}


/*
  =========================================================
  WATER
  =========================================================
*/

export function calculateWater(
  objectType,
  customParameters = {}
) {

  const params =
    getMergedParameters(
      objectType,
      customParameters
    );


  if (!params) {

    return 0;

  }


  const occupants =
    Number(params.occupants) || 0;


  const waterPerPerson =
    Number(params.waterPerPerson) || 0;


  return (

    occupants *

    waterPerPerson

  );

}


/*
  =========================================================
  WASTE
  =========================================================
*/

export function calculateWaste(
  objectType,
  customParameters = {}
) {

  const params =
    getMergedParameters(
      objectType,
      customParameters
    );


  if (!params) {

    return 0;

  }


  const occupants =
    Number(params.occupants) || 0;


  const wastePerPerson =
    Number(params.wastePerPerson) || 0;


  return (

    occupants *

    wastePerPerson

  );

}


/*
  =========================================================
  LAND
  =========================================================
*/

export function calculateLandUsage(
  objectType,
  customParameters = {}
) {

  const params =
    getMergedParameters(
      objectType,
      customParameters
    );


  if (!params) {

    return 0;

  }


  return Number(
    params.area
  ) || 0;

}


/*
  =========================================================
  GREEN COVER
  =========================================================
*/

export function calculateGreenCover(
  objectType,
  customParameters = {}
) {

  const params =
    getMergedParameters(
      objectType,
      customParameters
    );


  if (!params) {

    return 0;

  }


  return Number(
    params.greenCover
  ) || 0;

}


/*
  =========================================================
  SIMULATION METADATA
  =========================================================
*/

export function getSimulationMetadata(
  objectType
) {

  const data =
    ENVIRONMENTAL_DATA[
      objectType
    ];


  if (!data) {

    return null;

  }


  return {

    category:
      data.category,

    ...data.metadata,

    electricityFactor:
      REAL_WORLD_FACTORS
        .electricity,

  };

}


/*
  =========================================================
  COMPLETE OBJECT SIMULATION
  =========================================================
*/

export function simulateObject(
  objectType,
  customParameters = {}
) {

  const energy =
    calculateEnergy(
      objectType,
      customParameters
    );


  const co2 =
    calculateCO2FromEnergy(
      energy
    );


  const water =
    calculateWater(
      objectType,
      customParameters
    );


  const waste =
    calculateWaste(
      objectType,
      customParameters
    );


  const landUsage =
    calculateLandUsage(
      objectType,
      customParameters
    );


  const greenCover =
    calculateGreenCover(
      objectType,
      customParameters
    );


  return {

    energy,

    co2,

    water,

    waste,

    landUsage,

    greenCover,

    metadata:
      getSimulationMetadata(
        objectType
      ),

  };

}


/*
  =========================================================
  CUSTOM SIMULATION
  =========================================================
*/

export function calculateCustomSimulation(
  objectType,
  customParameters = {}
) {

  return simulateObject(

    objectType,

    customParameters

  );

}