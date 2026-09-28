// src/engine/environmentEngine.js

import {
  simulateObject,
} from "./simulationModel";


/*
  =========================================================
  ECOBUILD AI
  ENVIRONMENTAL ANALYSIS ENGINE
  =========================================================

  Responsibilities:

  1. Aggregate object impacts
  2. Calculate environmental indicators
  3. Calculate sustainability score
  4. Track data quality
  5. Track model provenance
*/


/*
  =========================================================
  SCORE LIMITS
  =========================================================
*/

const SCORE_LIMITS = {

  co2: 5000,

  energy: 10000,

  water: 50000,

  land: 5000,

  waste: 1000,

  green: 500,

};


/*
  =========================================================
  NORMALIZATION
  =========================================================
*/

function normalize(
  value,
  maxValue
) {

  if (maxValue <= 0) {

    return 0;

  }


  const result =
    (value / maxValue) * 100;


  return Math.max(

    0,

    Math.min(

      100,

      result

    )

  );

}


/*
  =========================================================
  ENVIRONMENTAL IMPACT
  =========================================================
*/

export function calculateEnvironmentalImpact(
  objects
) {

  const impact = {

    co2: 0,

    energy: 0,

    water: 0,

    greenCover: 0,

    landUsage: 0,

    waste: 0,

  };


  const objectDetails = [];


  const dataQuality = {

    totalObjects:
      objects.length,

    modeledObjects:
      0,

    unknownObjects:
      0,

    prototypeProfiles:
      0,

    officialFactorsUsed:
      0,

  };


  objects.forEach(
    (object) => {

      const result =
        simulateObject(

          object.type,

          object.parameters || {}

        );


      /*
        Unknown object
      */

      if (!result) {

        dataQuality
          .unknownObjects++;

        return;

      }


      dataQuality
        .modeledObjects++;


      /*
        Track prototype profile
      */

      if (
        result.metadata
          ?.confidence ===
        "prototype"
      ) {

        dataQuality
          .prototypeProfiles++;

      }


      /*
        Track official factor
      */

      if (
        result.metadata
          ?.electricityFactor
      ) {

        dataQuality
          .officialFactorsUsed++;

      }


      /*
        Aggregate impact
      */

      impact.co2 +=
        result.co2;


      impact.energy +=
        result.energy;


      impact.water +=
        result.water;


      impact.greenCover +=
        result.greenCover;


      impact.landUsage +=
        result.landUsage;


      impact.waste +=
        result.waste;


      /*
        Store object-level result
      */

      objectDetails.push({

        id:
          object.id,

        type:
          object.type,

        impact: {

          co2:
            result.co2,

          energy:
            result.energy,

          water:
            result.water,

          greenCover:
            result.greenCover,

          landUsage:
            result.landUsage,

          waste:
            result.waste,

        },

        metadata:
          result.metadata,

      });

    }

  );


  return {

    impact,

    objectDetails,

    dataQuality,

  };

}


/*
  =========================================================
  ENVIRONMENTAL INDICATORS
  =========================================================
*/

export function calculateIndicators(
  impact
) {

  return {

    co2Pressure:

      normalize(

        Math.max(
          0,
          impact.co2
        ),

        SCORE_LIMITS.co2

      ),


    energyPressure:

      normalize(

        Math.max(
          0,
          impact.energy
        ),

        SCORE_LIMITS.energy

      ),


    waterPressure:

      normalize(

        Math.max(
          0,
          impact.water
        ),

        SCORE_LIMITS.water

      ),


    landPressure:

      normalize(

        Math.max(
          0,
          impact.landUsage
        ),

        SCORE_LIMITS.land

      ),


    wastePressure:

      normalize(

        Math.max(
          0,
          impact.waste
        ),

        SCORE_LIMITS.waste

      ),


    greenBenefit:

      normalize(

        Math.max(
          0,
          impact.greenCover
        ),

        SCORE_LIMITS.green

      ),

  };

}


/*
  =========================================================
  SUSTAINABILITY SCORE
  =========================================================
*/

export function calculateSustainabilityScore(
  indicators
) {

  const score =

    100

    - indicators.co2Pressure * 0.25

    - indicators.energyPressure * 0.20

    - indicators.waterPressure * 0.15

    - indicators.landPressure * 0.10

    - indicators.wastePressure * 0.10

    + indicators.greenBenefit * 0.20;


  return Math.round(

    Math.max(

      0,

      Math.min(

        100,

        score

      )

    )

  );

}


/*
  =========================================================
  OBJECT COUNTS
  =========================================================
*/

export function calculateObjectCounts(
  objects
) {

  const counts = {};


  objects.forEach(
    (object) => {

      counts[object.type] =

        (counts[object.type] || 0)

        + 1;

    }

  );


  return counts;

}


/*
  =========================================================
  COMPLETE CITY ANALYSIS
  =========================================================
*/

export function analyzeCity(
  objects = []
) {

  const safeObjects =

    Array.isArray(objects)

      ? objects

      : [];


  const simulation =

    calculateEnvironmentalImpact(

      safeObjects

    );


  const indicators =

    calculateIndicators(

      simulation.impact

    );


  const score =

    calculateSustainabilityScore(

      indicators

    );


  return {

    impact:
      simulation.impact,

    indicators,

    score,

    objectCounts:

      calculateObjectCounts(
        safeObjects
      ),

    objectDetails:

      simulation.objectDetails,

    dataQuality:

      simulation.dataQuality,

    model: {

      version:
        "0.2.0",

      type:
        "hybrid-reference-model",

      scoreType:
        "project-simulation-score",

    },

  };

}