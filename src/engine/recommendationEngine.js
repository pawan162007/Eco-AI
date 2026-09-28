// src/engine/recommendationEngine.js

/*
  EcoBuild AI
  Recommendation Engine

  This module analyzes the current environmental
  indicators and generates explainable recommendations.

  Current version:
  Rule-based AI

  Future version:
  ML model + rule-based hybrid recommendation system.
*/


export function generateRecommendations(
  analysis,
  objects
) {

  const recommendations = [];

  const {
    impact,
    indicators,
  } = analysis;


  /*
    ========================================================
    1. CO2 ANALYSIS
    ========================================================
  */

  if (indicators.co2Pressure >= 70) {

    recommendations.push({

      id: "reduce-co2",

      priority: "high",

      icon: "🌍",

      title: "Reduce CO₂ emissions",

      message:
        "The current city has high CO₂ pressure.",

      action:
        "Add renewable energy or reduce high-energy buildings.",

    });

  }

  else if (indicators.co2Pressure >= 40) {

    recommendations.push({

      id: "moderate-co2",

      priority: "medium",

      icon: "🌍",

      title: "Control CO₂ emissions",

      message:
        "CO₂ pressure is at a moderate level.",

      action:
        "Consider adding solar panels, wind turbines or green spaces.",

    });

  }


  /*
    ========================================================
    2. ENERGY ANALYSIS
    ========================================================
  */

  if (indicators.energyPressure >= 70) {

    recommendations.push({

      id: "reduce-energy",

      priority: "high",

      icon: "⚡",

      title: "Reduce energy pressure",

      message:
        "The city is consuming a large amount of energy.",

      action:
        "Add renewable energy sources such as solar panels or wind turbines.",

    });

  }


  /*
    ========================================================
    3. WATER ANALYSIS
    ========================================================
  */

  if (indicators.waterPressure >= 60) {

    recommendations.push({

      id: "reduce-water",

      priority: "high",

      icon: "💧",

      title: "Improve water management",

      message:
        "Water consumption is relatively high.",

      action:
        "Add water-management infrastructure and reduce high-consumption buildings.",

    });

  }


  /*
    ========================================================
    4. GREEN COVER
    ========================================================
  */

  if (indicators.greenBenefit < 30) {

    recommendations.push({

      id: "increase-green",

      priority: "high",

      icon: "🌳",

      title: "Increase green cover",

      message:
        "The city currently has limited green cover.",

      action:
        "Add trees, parks or forest areas.",

    });

  }


  /*
    ========================================================
    5. LAND USE
    ========================================================
  */

  if (indicators.landPressure >= 70) {

    recommendations.push({

      id: "land-use",

      priority: "medium",

      icon: "🏙️",

      title: "Optimize land use",

      message:
        "A large amount of land is being occupied.",

      action:
        "Use compact development and preserve green spaces.",

    });

  }


  /*
    ========================================================
    6. WASTE
    ========================================================
  */

  if (indicators.wastePressure >= 60) {

    recommendations.push({

      id: "reduce-waste",

      priority: "medium",

      icon: "♻️",

      title: "Reduce waste generation",

      message:
        "The current city generates considerable waste.",

      action:
        "Reduce high-waste facilities and introduce better waste management.",

    });

  }


  /*
    ========================================================
    7. NO RENEWABLE ENERGY
    ========================================================
  */

  const renewableCount =
    objects.filter(
      (object) =>
        object.type === "solar" ||
        object.type === "windTurbine"
    ).length;


  if (
    renewableCount === 0 &&
    objects.length > 0
  ) {

    recommendations.push({

      id: "add-renewables",

      priority: "medium",

      icon: "☀️",

      title: "Add renewable energy",

      message:
        "The city currently has no renewable energy infrastructure.",

      action:
        "Try adding solar panels or wind turbines.",

    });

  }


  /*
    ========================================================
    8. NO GREEN OBJECTS
    ========================================================
  */

  const greenObjects =
    objects.filter(
      (object) =>
        object.type === "tree" ||
        object.type === "park" ||
        object.type === "forest"
    ).length;


  if (
    greenObjects === 0 &&
    objects.length > 0
  ) {

    recommendations.push({

      id: "add-green-space",

      priority: "high",

      icon: "🌲",

      title: "Create green spaces",

      message:
        "The city does not currently contain trees or green spaces.",

      action:
        "Add trees, parks or forest areas to increase green cover.",

    });

  }


  /*
    ========================================================
    9. EMPTY CITY
    ========================================================
  */

  if (objects.length === 0) {

    recommendations.push({

      id: "start-building",

      priority: "info",

      icon: "🏗️",

      title: "Start building your city",

      message:
        "Your virtual city is currently empty.",

      action:
        "Add buildings, roads, green spaces and energy infrastructure.",

    });

  }


  /*
    ========================================================
    10. POSITIVE FEEDBACK
    ========================================================
  */

  if (
    indicators.greenBenefit >= 60 &&
    indicators.co2Pressure < 40 &&
    indicators.energyPressure < 40
  ) {

    recommendations.push({

      id: "good-balance",

      priority: "positive",

      icon: "🌱",

      title: "Good environmental balance",

      message:
        "The current city has relatively low environmental pressure and good green benefits.",

      action:
        "Continue balancing development with renewable energy and green infrastructure.",

    });

  }


  /*
    Return maximum 5 recommendations
    so the dashboard stays clean.
  */

  return recommendations.slice(
    0,
    5
  );
}