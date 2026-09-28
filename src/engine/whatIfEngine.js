// src/engine/whatIfEngine.js

import { analyzeCity } from "./environmentEngine";


/*
  =========================================================
  WHAT-IF SIMULATION ENGINE
  =========================================================

  This module creates a temporary version of the city.

  It DOES NOT modify the real city.

  Example:

  Current City
       ↓
  Add hypothetical tree
       ↓
  Analyze temporary city
       ↓
  Compare results
       ↓
  Show user the possible change
*/


/*
  =========================================================
  CREATE HYPOTHETICAL OBJECT
  =========================================================
*/

function createHypotheticalObject(
  type,
  objects
) {

  /*
    Find an unused grid position.

    We start from the center and search
    for the first available cell.
  */

  const positions = [];

  for (let x = -9; x <= 9; x++) {

    for (let z = -9; z <= 9; z++) {

      positions.push([
        x,
        0,
        z,
      ]);

    }

  }


  const freePosition =
    positions.find(
      ([x, , z]) =>
        !objects.some(
          (object) =>
            object.position[0] === x &&
            object.position[2] === z
        )
    );


  /*
    If the grid is full,
    return null.
  */

  if (!freePosition) {
    return null;
  }


  return {

    id:
      `what-if-${Date.now()}`,

    type,

    position:
      freePosition,

    parameters:
      null,

    hypothetical:
      true,

  };

}


/*
  =========================================================
  SIMULATE ADDING ONE OBJECT
  =========================================================
*/

export function simulateAddObject(
  objects,
  objectType
) {

  const hypotheticalObject =
    createHypotheticalObject(
      objectType,
      objects
    );


  if (!hypotheticalObject) {

    return {

      success: false,

      message:
        "No free grid cell is available.",

    };

  }


  /*
    Create temporary city.
  */

  const simulatedObjects = [

    ...objects,

    hypotheticalObject,

  ];


  /*
    Analyze current city.
  */

  const currentAnalysis =
    analyzeCity(
      objects
    );


  /*
    Analyze hypothetical city.
  */

  const simulatedAnalysis =
    analyzeCity(
      simulatedObjects
    );


  /*
    Calculate differences.
  */

  const scoreChange =
    simulatedAnalysis.score -
    currentAnalysis.score;


  const co2Change =
    simulatedAnalysis.impact.co2 -
    currentAnalysis.impact.co2;


  const energyChange =
    simulatedAnalysis.impact.energy -
    currentAnalysis.impact.energy;


  const waterChange =
    simulatedAnalysis.impact.water -
    currentAnalysis.impact.water;


  const landChange =
    simulatedAnalysis.impact.landUsage -
    currentAnalysis.impact.landUsage;


  const greenChange =
    simulatedAnalysis.impact.greenCover -
    currentAnalysis.impact.greenCover;


  const wasteChange =
    simulatedAnalysis.impact.waste -
    currentAnalysis.impact.waste;


  return {

    success: true,

    objectType,

    current:
      currentAnalysis,

    simulated:
      simulatedAnalysis,

    changes: {

      score:
        scoreChange,

      co2:
        co2Change,

      energy:
        energyChange,

      water:
        waterChange,

      land:
        landChange,

      greenCover:
        greenChange,

      waste:
        wasteChange,

    },

  };

}


/*
  =========================================================
  FORMAT CHANGE
  =========================================================
*/

export function formatChange(
  value,
  decimals = 1
) {

  if (value > 0) {

    return `+${value.toFixed(decimals)}`;

  }


  return value.toFixed(
    decimals
  );

}