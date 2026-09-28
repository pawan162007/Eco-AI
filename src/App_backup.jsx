// src/App.jsx

import { useMemo, useState } from "react";

import {
  Canvas,
} from "@react-three/fiber";

import {
  OrbitControls,
  Grid,
} from "@react-three/drei";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

import {
  analyzeCity,
} from "./engine/environmentEngine";

import {
  getDefaultParameters,
} from "./engine/simulationModel";

import {
  generateRecommendations,
} from "./engine/recommendationEngine";

import {
  simulateAddObject,
} from "./engine/whatIfEngine";

import "./App.css";


/*
  =========================================================
  OBJECT DATABASE
  =========================================================
*/

const OBJECT_DATABASE = {

  house: {
    name: "House",
    icon: "🏠",
    category: "Building",
    description: "Residential building",
  },

  factory: {
    name: "Factory",
    icon: "🏭",
    category: "Industrial",
    description: "Industrial facility",
  },

  tree: {
    name: "Tree",
    icon: "🌳",
    category: "Nature",
    description: "Individual tree",
  },

  solar: {
    name: "Solar Panel",
    icon: "☀️",
    category: "Renewable Energy",
    description: "Solar energy generation",
  },

  road: {
    name: "Road",
    icon: "🛣️",
    category: "Infrastructure",
    description: "Road infrastructure",
  },

  park: {
    name: "Park",
    icon: "🌲",
    category: "Green Space",
    description: "Urban green space",
  },

  waterTank: {
    name: "Water Tank",
    icon: "💧",
    category: "Water",
    description: "Water management infrastructure",
  },

  windTurbine: {
    name: "Wind Turbine",
    icon: "🌬️",
    category: "Renewable Energy",
    description: "Wind energy generation",
  },

  forest: {
    name: "Forest",
    icon: "🌲",
    category: "Nature",
    description: "Large vegetation area",
  },

  office: {
    name: "Office",
    icon: "🏢",
    category: "Commercial",
    description: "Commercial office building",
  },

  school: {
    name: "School",
    icon: "🏫",
    category: "Education",
    description: "Educational building",
  },

  hospital: {
    name: "Hospital",
    icon: "🏥",
    category: "Healthcare",
    description: "Healthcare facility",
  },

};


/*
  =========================================================
  INITIAL CITY
  =========================================================
*/

const INITIAL_OBJECTS = [

  {
    id: 1,
    type: "house",
    position: [-6, 0, -5],
  },

  {
    id: 2,
    type: "house",
    position: [-3, 0, -5],
  },

  {
    id: 3,
    type: "tree",
    position: [-6, 0, -2],
  },

  {
    id: 4,
    type: "tree",
    position: [-3, 0, -2],
  },

  {
    id: 5,
    type: "factory",
    position: [5, 0, -4],
  },

  {
    id: 6,
    type: "solar",
    position: [4, 0, 1],
  },

  {
    id: 7,
    type: "road",
    position: [0, 0, 0],
  },

  {
    id: 8,
    type: "park",
    position: [-5, 0, 5],
  },

];


/*
  =========================================================
  3D OBJECT COMPONENTS
  =========================================================
*/

function House() {

  return (

    <group>

      <mesh position={[0, 0.5, 0]}>

        <boxGeometry
          args={[1.5, 1, 1.5]}
        />

        <meshStandardMaterial
          color="#d9a066"
        />

      </mesh>


      <mesh position={[0, 1.25, 0]}>

        <coneGeometry
          args={[1.15, 0.8, 4]}
        />

        <meshStandardMaterial
          color="#8b4513"
        />

      </mesh>


      <mesh position={[0, 0.35, 0.76]}>

        <boxGeometry
          args={[0.35, 0.7, 0.05]}
        />

        <meshStandardMaterial
          color="#4b2e1f"
        />

      </mesh>

    </group>

  );

}


function Factory() {

  return (

    <group>

      <mesh position={[0, 0.8, 0]}>

        <boxGeometry
          args={[2, 1.6, 1.6]}
        />

        <meshStandardMaterial
          color="#777777"
        />

      </mesh>


      <mesh position={[0.55, 2, 0]}>

        <cylinderGeometry
          args={[0.3, 0.3, 2, 16]}
        />

        <meshStandardMaterial
          color="#444444"
        />

      </mesh>


      <mesh position={[-0.55, 1.7, 0]}>

        <cylinderGeometry
          args={[0.22, 0.22, 1.4, 16]}
        />

        <meshStandardMaterial
          color="#555555"
        />

      </mesh>

    </group>

  );

}


function Tree({
  position = [0, 0, 0],
}) {

  return (

    <group
      position={position}
    >

      <mesh position={[0, 0.6, 0]}>

        <cylinderGeometry
          args={[0.15, 0.2, 1.2, 10]}
        />

        <meshStandardMaterial
          color="#6b3e26"
        />

      </mesh>


      <mesh position={[0, 1.5, 0]}>

        <sphereGeometry
          args={[0.8, 16, 16]}
        />

        <meshStandardMaterial
          color="#2e8b57"
        />

      </mesh>

    </group>

  );

}


function SolarPanel() {

  return (

    <group>

      <mesh
        rotation={[
          -0.5,
          0,
          0,
        ]}
        position={[
          0,
          0.35,
          0,
        ]}
      >

        <boxGeometry
          args={[
            1.8,
            0.08,
            1.2,
          ]}
        />

        <meshStandardMaterial
          color="#1e4f8f"
        />

      </mesh>


      <mesh
        position={[
          0,
          0.15,
          0,
        ]}
      >

        <boxGeometry
          args={[
            0.12,
            0.3,
            0.12,
          ]}
        />

        <meshStandardMaterial
          color="#555555"
        />

      </mesh>

    </group>

  );

}


function Road() {

  return (

    <mesh
      position={[
        0,
        0.02,
        0,
      ]}
    >

      <boxGeometry
        args={[
          2.8,
          0.08,
          1.2,
        ]}
      />

      <meshStandardMaterial
        color="#333333"
      />

    </mesh>

  );

}


function Park() {

  return (

    <group>

      <mesh
        position={[
          0,
          0.05,
          0,
        ]}
      >

        <boxGeometry
          args={[
            2.5,
            0.1,
            2.5,
          ]}
        />

        <meshStandardMaterial
          color="#3b7d3b"
        />

      </mesh>


      <Tree />

    </group>

  );

}


function WaterTank() {

  return (

    <group>

      <mesh
        position={[
          0,
          0.7,
          0,
        ]}
      >

        <cylinderGeometry
          args={[
            0.7,
            0.7,
            1.4,
            20,
          ]}
        />

        <meshStandardMaterial
          color="#5ca9d6"
        />

      </mesh>


      <mesh
        position={[
          0,
          1.5,
          0,
        ]}
      >

        <cylinderGeometry
          args={[
            0.72,
            0.72,
            0.08,
            20,
          ]}
        />

        <meshStandardMaterial
          color="#dddddd"
        />

      </mesh>

    </group>

  );

}


function WindTurbine() {

  return (

    <group>

      <mesh
        position={[
          0,
          1.2,
          0,
        ]}
      >

        <cylinderGeometry
          args={[
            0.08,
            0.12,
            2.4,
            10,
          ]}
        />

        <meshStandardMaterial
          color="#dddddd"
        />

      </mesh>


      <mesh
        position={[
          0,
          2.4,
          0,
        ]}
      >

        <sphereGeometry
          args={[
            0.18,
            12,
            12,
          ]}
        />

        <meshStandardMaterial
          color="#eeeeee"
        />

      </mesh>


      <mesh
        position={[
          0,
          2.4,
          0.25,
        ]}
        rotation={[
          0,
          0,
          0.5,
        ]}
      >

        <boxGeometry
          args={[
            0.08,
            0.8,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#eeeeee"
        />

      </mesh>

    </group>

  );

}


function Forest() {

  return (

    <group>

      <mesh
        position={[
          0,
          0.05,
          0,
        ]}
      >

        <boxGeometry
          args={[
            2.5,
            0.1,
            2.5,
          ]}
        />

        <meshStandardMaterial
          color="#245c32"
        />

      </mesh>


      <Tree
        position={[
          0,
          0,
          0,
        ]}
      />

      <Tree
        position={[
          0.7,
          0,
          0.5,
        ]}
      />

      <Tree
        position={[
          -0.7,
          0,
          -0.4,
        ]}
      />

    </group>

  );

}


function Office() {

  return (

    <mesh
      position={[
        0,
        1,
        0,
      ]}
    >

      <boxGeometry
        args={[
          1.7,
          2,
          1.7,
        ]}
      />

      <meshStandardMaterial
        color="#6f8fa8"
      />

    </mesh>

  );

}


function School() {

  return (

    <group>

      <mesh
        position={[
          0,
          0.7,
          0,
        ]}
      >

        <boxGeometry
          args={[
            2.2,
            1.4,
            1.5,
          ]}
        />

        <meshStandardMaterial
          color="#d8c28f"
        />

      </mesh>


      <mesh
        position={[
          0,
          1.6,
          0,
        ]}
      >

        <boxGeometry
          args={[
            2.4,
            0.15,
            1.7,
          ]}
        />

        <meshStandardMaterial
          color="#b94c4c"
        />

      </mesh>

    </group>

  );

}


function Hospital() {

  return (

    <group>

      <mesh
        position={[
          0,
          0.8,
          0,
        ]}
      >

        <boxGeometry
          args={[
            2,
            1.6,
            1.6,
          ]}
        />

        <meshStandardMaterial
          color="#eeeeee"
        />

      </mesh>


      <mesh
        position={[
          0,
          1.7,
          0,
        ]}
      >

        <boxGeometry
          args={[
            0.5,
            0.15,
            0.15,
          ]}
        />

        <meshStandardMaterial
          color="#d33"
        />

      </mesh>


      <mesh
        position={[
          0,
          1.7,
          0,
        ]}
      >

        <boxGeometry
          args={[
            0.15,
            0.15,
            0.5,
          ]}
        />

        <meshStandardMaterial
          color="#d33"
        />

      </mesh>

    </group>

  );

}


/*
  =========================================================
  WORLD OBJECT
  =========================================================
*/

function WorldObject({
  object,
}) {

  const [
    x,
    y,
    z,
  ] = object.position;


  let content = null;


  switch (object.type) {

    case "house":
      content = <House />;
      break;

    case "factory":
      content = <Factory />;
      break;

    case "tree":
      content = <Tree />;
      break;

    case "solar":
      content = <SolarPanel />;
      break;

    case "road":
      content = <Road />;
      break;

    case "park":
      content = <Park />;
      break;

    case "waterTank":
      content = <WaterTank />;
      break;

    case "windTurbine":
      content = <WindTurbine />;
      break;

    case "forest":
      content = <Forest />;
      break;

    case "office":
      content = <Office />;
      break;

    case "school":
      content = <School />;
      break;

    case "hospital":
      content = <Hospital />;
      break;

    default:
      content = null;

  }


  return (

    <group
      position={[
        x,
        y,
        z,
      ]}
    >

      {content}

    </group>

  );

}


/*
  =========================================================
  BUILD SURFACE
  =========================================================
*/

function BuildSurface({
  onMove,
  onPlace,
}) {

  return (

    <mesh
      rotation={[
        -Math.PI / 2,
        0,
        0,
      ]}
      position={[
        0,
        -0.5,
        0,
      ]}
      onPointerMove={onMove}
      onClick={onPlace}
    >

      <planeGeometry
        args={[
          20,
          20,
        ]}
      />

      <meshBasicMaterial
        transparent
        opacity={0}
      />

    </mesh>

  );

}


/*
  =========================================================
  GRID HIGHLIGHT
  =========================================================
*/

function GridHighlight({
  position,
}) {

  if (!position) {
    return null;
  }


  return (

    <mesh
      position={[
        position[0],
        -0.43,
        position[1],
      ]}
    >

      <boxGeometry
        args={[
          1,
          0.03,
          1,
        ]}
      />

      <meshBasicMaterial
        color="#55c98a"
        transparent
        opacity={0.45}
      />

    </mesh>

  );

}


/*
  =========================================================
  GRID POSITION
  =========================================================
*/

function getGridPosition(event) {

  if (!event.point) {
    return null;
  }


  const x =
    Math.round(
      event.point.x
    );


  const z =
    Math.round(
      event.point.z
    );


  if (
    x < -9 ||
    x > 9 ||
    z < -9 ||
    z > 9
  ) {

    return null;
  }


  return [
    x,
    z,
  ];

}



/*
  =========================================================
  SOCIAL / URBAN IMPACT PROFILES
  =========================================================

  These are prototype decision-support indicators.
  They are NOT measured social statistics.
*/

const SOCIAL_IMPACT_PROFILES = {
  house: {
    community: 7,
    accessibility: 3,
    jobs: 2,
    health: 2,
    mobility: -1,
    airQuality: -1,
    noise: -1,
    biodiversity: 0,
    resilience: 2,
  },

  factory: {
    community: -1,
    accessibility: 1,
    jobs: 10,
    health: -4,
    mobility: -3,
    airQuality: -6,
    noise: -5,
    biodiversity: -3,
    resilience: 1,
  },

  tree: {
    community: 3,
    accessibility: 1,
    jobs: 1,
    health: 5,
    mobility: 0,
    airQuality: 6,
    noise: 2,
    biodiversity: 8,
    resilience: 5,
  },

  solar: {
    community: 2,
    accessibility: 0,
    jobs: 3,
    health: 3,
    mobility: 0,
    airQuality: 4,
    noise: 0,
    biodiversity: 0,
    resilience: 7,
  },

  road: {
    community: 2,
    accessibility: 7,
    jobs: 4,
    health: 0,
    mobility: 8,
    airQuality: -2,
    noise: -4,
    biodiversity: -2,
    resilience: 5,
  },

  park: {
    community: 8,
    accessibility: 6,
    jobs: 2,
    health: 8,
    mobility: 1,
    airQuality: 5,
    noise: 3,
    biodiversity: 7,
    resilience: 6,
  },

  waterTank: {
    community: 3,
    accessibility: 3,
    jobs: 2,
    health: 4,
    mobility: 0,
    airQuality: 0,
    noise: 0,
    biodiversity: 1,
    resilience: 8,
  },

  windTurbine: {
    community: 1,
    accessibility: 0,
    jobs: 4,
    health: 3,
    mobility: 0,
    airQuality: 5,
    noise: -2,
    biodiversity: -1,
    resilience: 8,
  },

  forest: {
    community: 7,
    accessibility: 3,
    jobs: 3,
    health: 9,
    mobility: 0,
    airQuality: 9,
    noise: 5,
    biodiversity: 10,
    resilience: 10,
  },

  office: {
    community: 3,
    accessibility: 4,
    jobs: 9,
    health: 1,
    mobility: -2,
    airQuality: -1,
    noise: -2,
    biodiversity: -1,
    resilience: 3,
  },

  school: {
    community: 9,
    accessibility: 8,
    jobs: 6,
    health: 7,
    mobility: 2,
    airQuality: 1,
    noise: -2,
    biodiversity: 0,
    resilience: 7,
  },

  hospital: {
    community: 8,
    accessibility: 10,
    jobs: 9,
    health: 10,
    mobility: 2,
    airQuality: -1,
    noise: -3,
    biodiversity: -1,
    resilience: 10,
  },
};

function clampImpactScore(value) {
  return Math.max(-10, Math.min(10, Number(value) || 0));
}

function calculateSocialImpact(type) {
  const profile =
    SOCIAL_IMPACT_PROFILES[type] ||
    SOCIAL_IMPACT_PROFILES.house;

  return Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [
      key,
      clampImpactScore(value),
    ])
  );
}

function getImpactLabel(value) {
  if (value >= 7) return "Strong positive";
  if (value >= 3) return "Positive";
  if (value > -3) return "Low / neutral";
  if (value > -7) return "Negative";
  return "High pressure";
}

function formatSigned(value, decimals = 1) {
  const numeric = Number(value) || 0;

  if (numeric > 0) {
    return `+${numeric.toFixed(decimals)}`;
  }

  return numeric.toFixed(decimals);
}

function impactBarWidth(value, maxValue = 10) {
  const numeric = Math.abs(Number(value) || 0);
  return Math.min(100, (numeric / maxValue) * 100);
}



/*
  =========================================================
  STEP 2 — CITY ANALYTICS
  =========================================================
*/

function createAnalyticsSnapshot(cityObjects, label) {
  const result = analyzeCity(cityObjects);

  return {
    label,
    score: result.score,
    co2: Number(result.impact.co2.toFixed(1)),
    energy: Number(result.impact.energy.toFixed(1)),
    water: Number(result.impact.water.toFixed(1)),
    greenCover: Number(result.impact.greenCover.toFixed(1)),
    land: Number(result.impact.landUsage.toFixed(1)),
    waste: Number(result.impact.waste.toFixed(2)),
  };
}

function AnalyticsPanel({ impact, indicators, history }) {
  const pressureData = [
    { name: "CO₂", value: Number(indicators.co2Pressure.toFixed(1)) },
    { name: "Energy", value: Number(indicators.energyPressure.toFixed(1)) },
    { name: "Water", value: Number(indicators.waterPressure.toFixed(1)) },
    { name: "Land", value: Number(indicators.landPressure.toFixed(1)) },
    { name: "Waste", value: Number(indicators.wastePressure.toFixed(1)) },
  ];

  const scoreData = history.length
    ? history
    : [{ label: "Current", score: 0 }];

  return (
    <div className="analytics-panel">

      <div className="analytics-header">
        <div>
          <span className="analytics-kicker">
            LIVE CITY INTELLIGENCE
          </span>
          <h3>📊 Environmental Analytics</h3>
          <p>
            Graphs update automatically as your city changes.
          </p>
        </div>

        <span className="analytics-live-dot">
          LIVE
        </span>
      </div>

      <div className="analytics-total-grid">
        <div className="analytics-total">
          <span>CO₂</span>
          <strong>{impact.co2.toFixed(1)}</strong>
          <small>kg</small>
        </div>

        <div className="analytics-total">
          <span>ENERGY</span>
          <strong>{impact.energy.toFixed(1)}</strong>
          <small>kWh</small>
        </div>

        <div className="analytics-total">
          <span>WATER</span>
          <strong>{impact.water.toFixed(1)}</strong>
          <small>L</small>
        </div>

        <div className="analytics-total">
          <span>GREEN</span>
          <strong>{impact.greenCover.toFixed(1)}</strong>
          <small>m²</small>
        </div>
      </div>

      <div className="analytics-chart-card">
        <div className="analytics-chart-title">
          <div>
            <strong>Environmental Pressure</strong>
            <span>Normalized simulated pressure</span>
          </div>
          <small>0–100</small>
        </div>

        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={pressureData}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.07)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#7f9187", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64756d", fontSize: 8 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(101,200,137,0.05)" }}
                contentStyle={{
                  background: "#111e22",
                  border: "1px solid rgba(101,200,137,0.25)",
                  borderRadius: 8,
                  color: "#e8f1eb",
                  fontSize: 10,
                }}
                formatter={(value) => [`${value}%`, "Pressure"]}
              />
              <Bar
                dataKey="value"
                fill="#65c889"
                radius={[5, 5, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-chart-card">
        <div className="analytics-chart-title">
          <div>
            <strong>Sustainability Evolution</strong>
            <span>Score after each city change</span>
          </div>
          <small>/100</small>
        </div>

        <div className="analytics-chart">
          <ResponsiveContainer width="100%" height={190}>
            <LineChart
              data={scoreData}
              margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.07)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#7f9187", fontSize: 8 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64756d", fontSize: 8 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#111e22",
                  border: "1px solid rgba(101,200,137,0.25)",
                  borderRadius: 8,
                  color: "#e8f1eb",
                  fontSize: 10,
                }}
                formatter={(value) => [`${value}/100`, "Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#65c889"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#65c889", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-footnote">
        <span>⚡ Live</span>
        <span>{history.length} city states tracked</span>
        <span>
          🌱 Green benefit: {indicators.greenBenefit.toFixed(0)}%
        </span>
      </div>

    </div>
  );
}


/*
  =========================================================
  APP
  =========================================================
*/

function App() {

  /*
    =======================================================
    CITY
    =======================================================
  */

  const [
    objects,
    setObjects,
  ] = useState(
    INITIAL_OBJECTS
  );


  /*
    =======================================================
    SELECTED OBJECT
    =======================================================
  */

  const [
    selectedType,
    setSelectedType,
  ] = useState(
    "house"
  );


  /*
    =======================================================
    MODE
    =======================================================
  */

  const [
    mode,
    setMode,
  ] = useState(
    "build"
  );


  /*
    =======================================================
    HOVER CELL
    =======================================================
  */

  const [
    hoverCell,
    setHoverCell,
  ] = useState(
    null
  );


  /*
    =======================================================
    STATUS
    =======================================================
  */

  const [
    message,
    setMessage,
  ] = useState(
    "Select an object and click on the grid to build."
  );


  /*
    =======================================================
    BUILDING PARAMETERS
    =======================================================
  */

  const [
    buildingParameters,
    setBuildingParameters,
  ] = useState(
    () =>
      getDefaultParameters(
        "house"
      )
  );


  /*
    =======================================================
    WHAT-IF STATE
    =======================================================
  */

  const [
    whatIfType,
    setWhatIfType,
  ] = useState(
    "solar"
  );


  const [
    whatIfResult,
    setWhatIfResult,
  ] = useState(
    null
  );


  /*
    =======================================================
    ML PREDICTION STATE
    =======================================================
  */

  const [
    mlPrediction,
    setMlPrediction,
  ] = useState(
    null
  );


  const [
    mlLoading,
    setMlLoading,
  ] = useState(
    false
  );


  const [
    mlError,
    setMlError,
  ] = useState(
    ""
  );


  const [
    showMlPredictor,
    setShowMlPredictor,
  ] = useState(
    false
  );


  /*
    =======================================================
    UNIVERSAL PREDICTION / IMPACT STATE
    =======================================================
  */

  const [
    impactPrediction,
    setImpactPrediction,
  ] = useState(
    null
  );


  /*
    =======================================================
    ACTUAL BUILD IMPACT REPORT
    =======================================================
  */

  const [
    lastBuildImpact,
    setLastBuildImpact,
  ] = useState(
    null
  );


  const [
    showImpactReport,
    setShowImpactReport,
  ] = useState(
    false
  );


  /*
    =======================================================
    CITY ANALYTICS HISTORY
    =======================================================
  */

  const [
    analyticsHistory,
    setAnalyticsHistory,
  ] = useState(
    () => [
      createAnalyticsSnapshot(
        INITIAL_OBJECTS,
        "Initial"
      ),
    ]
  );


  /*
    =======================================================
    ENVIRONMENT ANALYSIS
    =======================================================
  */

  const analysis = useMemo(

    () =>
      analyzeCity(
        objects
      ),

    [objects]

  );


  /*
    =======================================================
    AI RECOMMENDATIONS
    =======================================================
  */

  const recommendations = useMemo(

    () =>
      generateRecommendations(
        analysis,
        objects
      ),

    [
      analysis,
      objects,
    ]

  );


  /*
    =======================================================
    ANALYSIS VALUES
    =======================================================
  */

  const impact =
    analysis.impact;


  const indicators =
    analysis.indicators;


  const sustainabilityScore =
    analysis.score;

    const cityHealth =
  sustainabilityScore >= 80
    ? {
        label: "Excellent",
        icon: "🌟",
        className: "excellent",
      }
    : sustainabilityScore >= 60
    ? {
        label: "Good",
        icon: "🌱",
        className: "good",
      }
    : sustainabilityScore >= 40
    ? {
        label: "Needs Attention",
        icon: "⚠️",
        className: "warning",
      }
    : {
        label: "Critical",
        icon: "🚨",
        className: "critical",
      };


  const objectCounts =
    analysis.objectCounts;


  /*
    =======================================================
    CONFIGURABLE BUILDINGS
    =======================================================
  */

  const configurableBuildings = [

    "house",
    "factory",
    "office",
    "school",
    "hospital",

  ];


  /*
    =======================================================
    SELECT OBJECT
    =======================================================
  */

  function selectObject(type) {

    setSelectedType(
      type
    );


    const defaults =
      getDefaultParameters(
        type
      );


    setBuildingParameters(
      defaults
    );


    setMlPrediction(
      null
    );

    setMlError(
      ""
    );

    setImpactPrediction(
      null
    );


    setMode(
      "build"
    );


    setMessage(
      `${OBJECT_DATABASE[type].name} selected. Click on the grid to build.`
    );

  }


  /*
    =======================================================
    CHECK OCCUPIED CELL
    =======================================================
  */

  function isOccupied(
    x,
    z
  ) {

    return objects.some(

      (object) => (

        object.position[0] === x &&
        object.position[2] === z

      )

    );

  }


  /*
    =======================================================
    PLACE OBJECT
    =======================================================
  */

  function placeObject(event) {

    event.stopPropagation();

    const cell =
      getGridPosition(
        event
      );

    if (!cell) {
      setMessage(
        "Please build inside the grid."
      );
      return;
    }

    const [
      x,
      z,
    ] = cell;

    if (
      isOccupied(
        x,
        z
      )
    ) {
      setMessage(
        "This grid cell is already occupied."
      );
      return;
    }

    const newObject = {
      id:
        Date.now(),

      type:
        selectedType,

      position:
        [
          x,
          0,
          z,
        ],

      parameters:
        buildingParameters
          ? {
              ...buildingParameters,
            }
          : null,
    };

    /*
      IMPORTANT:
      Calculate the actual city delta BEFORE changing state.

      BEFORE = current city
      AFTER  = current city + the object the user is building

      This is the data shown in the Build Impact Report.
    */

    const beforeAnalysis =
      analyzeCity(
        objects
      );

    const afterAnalysis =
      analyzeCity(
        [
          ...objects,
          newObject,
        ]
      );

    const changes = {
      score:
        afterAnalysis.score -
        beforeAnalysis.score,

      co2:
        afterAnalysis.impact.co2 -
        beforeAnalysis.impact.co2,

      energy:
        afterAnalysis.impact.energy -
        beforeAnalysis.impact.energy,

      water:
        afterAnalysis.impact.water -
        beforeAnalysis.impact.water,

      greenCover:
        afterAnalysis.impact.greenCover -
        beforeAnalysis.impact.greenCover,

      land:
        afterAnalysis.impact.landUsage -
        beforeAnalysis.impact.landUsage,

      waste:
        afterAnalysis.impact.waste -
        beforeAnalysis.impact.waste,
    };

    const social =
      calculateSocialImpact(
        selectedType
      );

    setLastBuildImpact({
      object:
        newObject,

      before:
        beforeAnalysis,

      after:
        afterAnalysis,

      changes,

      social,

      builtAt:
        new Date().toLocaleTimeString(),
    });

    setObjects(
      (previous) => [
        ...previous,
        newObject,
      ]
    );

    setAnalyticsHistory(
      (previous) => [
        ...previous,
        createAnalyticsSnapshot(
          [
            ...objects,
            newObject,
          ],
          OBJECT_DATABASE[selectedType]?.name || selectedType
        ),
      ].slice(-12)
    );


    setWhatIfResult(
      null
    );

    setImpactPrediction(
      null
    );

    setMlPrediction(
      null
    );

    setMlError(
      ""
    );

    setMessage(
      `${OBJECT_DATABASE[selectedType].name} built successfully. Impact report generated.`
    );

    /*
      Open the ACTUAL BUILD IMPACT report.
      This is not a hypothetical forecast.
    */

    setShowImpactReport(
      true
    );
  }


  /*
    =======================================================
    REMOVE OBJECT
    =======================================================
  */

  function removeObject(event) {

    event.stopPropagation();


    const cell =
      getGridPosition(
        event
      );


    if (!cell) {
      return;
    }


    const [
      x,
      z,
    ] = cell;


    const target =
      objects.find(

        (object) => (

          object.position[0] === x &&
          object.position[2] === z

        )

      );


    if (!target) {

      setMessage(
        "There is no object at this location."
      );

      return;

    }


    const nextObjects =
      objects.filter(
        (object) =>
          object.id !== target.id
      );

    setObjects(
      nextObjects
    );


    setAnalyticsHistory(
      (previous) => [
        ...previous,
        createAnalyticsSnapshot(
          nextObjects,
          `Removed ${OBJECT_DATABASE[target.type]?.name || target.type}`
        ),
      ].slice(-12)
    );


    setWhatIfResult(
      null
    );


    setMlPrediction(
      null
    );

    setMlError(
      ""
    );

    setImpactPrediction(
      null
    );

    setLastBuildImpact(
      null
    );

    setShowImpactReport(
      false
    );

    setMessage(
      `${OBJECT_DATABASE[target.type].name} removed.`
    );

  }


  /*
    =======================================================
    POINTER MOVE
    =======================================================
  */

  function handlePointerMove(event) {

    const cell =
      getGridPosition(
        event
      );


    setHoverCell(
      cell
    );

  }


  /*
    =======================================================
    SURFACE CLICK
    =======================================================
  */

  function handleSurfaceClick(event) {

    if (
      mode === "remove"
    ) {

      removeObject(
        event
      );

      return;

    }


    placeObject(
      event
    );

  }


  /*
    =======================================================
    ML ENERGY PREDICTION
    =======================================================
  */

  async function predictSelectedBuilding() {

    if (
      !configurableBuildings.includes(
        selectedType
      )
    ) {

      setMlError(
        "AI energy prediction is available for buildings only."
      );

      return;

    }


    setMlLoading(
      true
    );

    setMlError(
      ""
    );

    setMlPrediction(
      null
    );


    try {

      const response =
        await fetch(
          "http://127.0.0.1:8000/predict-energy",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  building_type:
                    selectedType,

                  area:
                    Number(
                      buildingParameters?.area ??
                      100
                    ),

                  occupants:
                    Number(
                      buildingParameters?.occupants ??
                      0
                    ),
                }
              ),
          }
        );


      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(
              () => ({})
            );


        throw new Error(
          errorData.detail ||
          `Prediction request failed with status ${response.status}.`
        );

      }


      const result =
        await response.json();


      if (!result.success) {

        throw new Error(
          "Prediction service returned an unsuccessful response."
        );

      }


      setMlPrediction(
        result
      );


      setMessage(
        `AI predicted ${result.predicted_energy_kwh} kWh for the next hour.`
      );

    } catch (error) {

      console.error(
        "ML prediction error:",
        error
      );


      setMlError(
        error.message ||
        "Unable to connect to the AI backend."
      );

    } finally {

      setMlLoading(
        false
      );

    }

  }


  /*
    =======================================================
    UNIVERSAL OBJECT IMPACT FORECAST
    =======================================================
  */

  function runObjectImpactForecast() {

    const result =
      simulateAddObject(
        objects,
        selectedType
      );


    if (!result.success) {

      setImpactPrediction(
        null
      );

      setMlError(
        result.message ||
        "Unable to simulate this object."
      );

      return;

    }


    setMlError(
      ""
    );

    setImpactPrediction(
      result
    );


    setMessage(
      `${OBJECT_DATABASE[selectedType].name} impact forecast completed.`
    );

  }


  /*
    =======================================================
    WHAT-IF SIMULATION
    =======================================================
  */

  function runWhatIfSimulation() {

    const result =
      simulateAddObject(
        objects,
        whatIfType
      );


    setWhatIfResult(
      result
    );


    if (!result.success) {

      setMessage(
        result.message
      );

      return;

    }


    setMessage(
      `What-if simulation completed for ${OBJECT_DATABASE[whatIfType].name}.`
    );

  }


  /*
    =======================================================
    RESET WORLD
    =======================================================
  */

  function resetWorld() {

    setObjects(
      []
    );


    setAnalyticsHistory(
      [
        createAnalyticsSnapshot(
          [],
          "Reset"
        ),
      ]
    );


    setWhatIfResult(
      null
    );


    setMlPrediction(
      null
    );


    setMlError(
      ""
    );

    setImpactPrediction(
      null
    );

    setLastBuildImpact(
      null
    );

    setShowImpactReport(
      false
    );


    setShowMlPredictor(
      false
    );


    setMessage(
      "World reset. Start building your sustainable city."
    );

  }


  /*
    =======================================================
    TOTAL OBJECTS
    =======================================================
  */

  const totalObjects =
    objects.length;


  /*
    =======================================================
    SELECTED OBJECT
    =======================================================
  */

  const selectedObject =
    OBJECT_DATABASE[
      selectedType
    ];


  /*
    =======================================================
    UI
    =======================================================
  */

  return (

    <div className="app">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="header">

        <div>

          <h1>
            EcoBuild AI
          </h1>

          <p>
            Build. Predict. Learn. Build Sustainably.
          </p>

        </div>


        <div className="score-box">

          <span>
            Sustainability Score
          </span>


          <strong>
            {sustainabilityScore}
          </strong>


          <small>
            / 100
          </small>

        </div>

      </header>


      {/* =================================================
          MAIN LAYOUT
          ================================================= */}

      <main className="main-layout">


        {/* =================================================
            LEFT PANEL
            ================================================= */}

        <aside className="control-panel">

          <h2>
            Build Objects
          </h2>


          <div className="object-grid">

            {Object.entries(
              OBJECT_DATABASE
            ).map(

              ([
                type,
                data,
              ]) => (

                <button

                  key={type}

                  className={
                    selectedType === type &&
                    mode === "build"

                      ? "object-button active"

                      : "object-button"
                  }

                  onClick={() =>
                    selectObject(
                      type
                    )
                  }

                >

                  <span>
                    {data.icon}
                  </span>


                  {data.name}

                </button>

              )

            )}

          </div>


          {/* SELECTED OBJECT */}

          <div className="selected-object">

            <h3>
              Selected Object
            </h3>


            <div className="selected-title">

              <span>
                {selectedObject.icon}
              </span>


              <strong>
                {selectedObject.name}
              </strong>

            </div>


            <p>
              {selectedObject.description}
            </p>


            <small>

              Category:{" "}

              {selectedObject.category}

            </small>

          </div>


          {/* BUILDING CONFIGURATION */}

          {configurableBuildings.includes(
            selectedType
          ) && buildingParameters && (

            <div className="building-config">

              <h3>
                Building Configuration
              </h3>


              <label>

                Area (m²)

                <input

                  type="number"

                  min="10"

                  value={
                    buildingParameters.area
                  }

                  onChange={(event) =>

                    setBuildingParameters({

                      ...buildingParameters,

                      area:
                        Number(
                          event.target.value
                        ),

                    })

                  }

                />

              </label>


              <label>

                Occupants

                <input

                  type="number"

                  min="0"

                  value={
                    buildingParameters.occupants
                  }

                  onChange={(event) =>

                    setBuildingParameters({

                      ...buildingParameters,

                      occupants:
                        Number(
                          event.target.value
                        ),

                    })

                  }

                />

              </label>


              <label>

                Energy Intensity

                <input

                  type="number"

                  min="0"

                  step="0.1"

                  value={
                    buildingParameters.energyPerArea
                  }

                  onChange={(event) =>

                    setBuildingParameters({

                      ...buildingParameters,

                      energyPerArea:
                        Number(
                          event.target.value
                        ),

                    })

                  }

                />

              </label>


              <label>

                Operating Hours

                <input

                  type="number"

                  min="1"

                  max="24"

                  value={
                    buildingParameters.operatingHours
                  }

                  onChange={(event) =>

                    setBuildingParameters({

                      ...buildingParameters,

                      operatingHours:
                        Number(
                          event.target.value
                        ),

                    })

                  }

                />

              </label>


              <label>

                Water / Person

                <input

                  type="number"

                  min="0"

                  value={
                    buildingParameters.waterPerPerson
                  }

                  onChange={(event) =>

                    setBuildingParameters({

                      ...buildingParameters,

                      waterPerPerson:
                        Number(
                          event.target.value
                        ),

                    })

                  }

                />

              </label>


              <label>

                Waste / Person

                <input

                  type="number"

                  min="0"

                  step="0.01"

                  value={
                    buildingParameters.wastePerPerson
                  }

                  onChange={(event) =>

                    setBuildingParameters({

                      ...buildingParameters,

                      wastePerPerson:
                        Number(
                          event.target.value
                        ),

                    })

                  }

                />

              </label>


              <button
                className="simulate-button"
                onClick={() => {

                  setMlError("");
                  setMlPrediction(null);
                  setShowMlPredictor(true);

                }}
              >

                🤖 Open AI Energy Predictor

              </button>

            </div>

          )}


          {/* MODE CONTROLS */}

          <div className="mode-controls">

            <button

              className={
                mode === "build"
                  ? "active"
                  : ""
              }

              onClick={() =>
                setMode(
                  "build"
                )
              }

            >

              🏗️ Build

            </button>


            <button

              className={
                mode === "remove"
                  ? "active remove"
                  : ""
              }

              onClick={() => {

                setMode(
                  "remove"
                );

                setMessage(
                  "Click an object to remove it."
                );

              }}

            >

              🗑️ Remove

            </button>


            <button
              onClick={
                resetWorld
              }
            >

              🔄 Reset

            </button>

          </div>


          {/* STATUS */}

          <div className="status-box">

            <strong>
              Status
            </strong>


            <p>
              {message}
            </p>

          </div>


          {/* WORLD INFO */}

          <div className="world-info">

            <h3>
              World Info
            </h3>


            <p>

              Objects:{" "}

              <strong>
                {totalObjects}
              </strong>

            </p>


            <p>

              Grid:{" "}

              <strong>
                20 × 20
              </strong>

            </p>

          </div>

        </aside>


        {/* =================================================
            3D WORLD
            ================================================= */}

        <section className="world-container">

          <Canvas

            camera={{
              position: [
                12,
                12,
                12,
              ],

              fov: 45,
            }}

          >

            <color
              attach="background"
              args={[
                "#101820",
              ]}
            />


            <ambientLight
              intensity={1.5}
            />


            <directionalLight

              position={[
                5,
                10,
                5,
              ]}

              intensity={2}

            />


            <Grid

              args={[
                20,
                20,
              ]}

              cellSize={1}

              cellThickness={0.8}

              cellColor="#455a64"

              sectionSize={5}

              sectionThickness={1.2}

              sectionColor="#78909c"

              fadeDistance={30}

              fadeStrength={1}

              followCamera={false}

              infiniteGrid={false}

            />


            <BuildSurface

              onMove={
                handlePointerMove
              }

              onPlace={
                handleSurfaceClick
              }

            />


            <GridHighlight
              position={
                hoverCell
              }
            />


            {objects.map(
              (object) => (

                <WorldObject

                  key={
                    object.id
                  }

                  object={
                    object
                  }

                />

              )
            )}


            <OrbitControls

              enablePan

              enableZoom

              enableRotate

              minDistance={5}

              maxDistance={30}

            />

          </Canvas>

        </section>


        {/* =================================================
            RIGHT DASHBOARD
            ================================================= */}

        <aside className="dashboard">

          <h2>
            Environmental Dashboard
          </h2>


          {/* SCORE */}

          <div className="dashboard-score">

            <span>
              Sustainability
            </span>


            <strong>
              {sustainabilityScore}
            </strong>


            <small>
              / 100
            </small>

          </div>


          {/* ENVIRONMENTAL IMPACT */}

          <div className="metrics">

            <h3>
              Environmental Impact
            </h3>


            <div className="metric">

              <span>
                CO₂
              </span>


              <strong>
                {impact.co2.toFixed(1)}
              </strong>


              <small>
                kg CO₂
              </small>

            </div>


            <div className="metric">

              <span>
                Energy
              </span>


              <strong>
                {impact.energy.toFixed(1)}
              </strong>


              <small>
                kWh
              </small>

            </div>


            <div className="metric">

              <span>
                Water
              </span>


              <strong>
                {impact.water.toFixed(1)}
              </strong>


              <small>
                L
              </small>

            </div>


            <div className="metric">

              <span>
                Land
              </span>


              <strong>
                {impact.landUsage.toFixed(1)}
              </strong>


              <small>
                m²
              </small>

            </div>


            <div className="metric">

              <span>
                Green Cover
              </span>


              <strong>
                {impact.greenCover.toFixed(1)}
              </strong>


              <small>
                m²
              </small>

            </div>


            <div className="metric">

              <span>
                Waste
              </span>


              <strong>
                {impact.waste.toFixed(2)}
              </strong>


              <small>
                kg
              </small>

            </div>

          </div>


          {/* LIVE ANALYTICS */}

          <AnalyticsPanel
            impact={impact}
            indicators={indicators}
            history={analyticsHistory}
          />


          {/* ENVIRONMENTAL INDICATORS */}

          <div className="indicators">

            <h3>
              Environmental Indicators
            </h3>


            <div className="indicator">

              <span>
                CO₂ Pressure
              </span>


              <strong>
                {indicators.co2Pressure.toFixed(0)}%
              </strong>

            </div>


            <div className="indicator">

              <span>
                Energy Pressure
              </span>


              <strong>
                {indicators.energyPressure.toFixed(0)}%
              </strong>

            </div>


            <div className="indicator">

              <span>
                Water Pressure
              </span>


              <strong>
                {indicators.waterPressure.toFixed(0)}%
              </strong>

            </div>


            <div className="indicator">

              <span>
                Land Pressure
              </span>


              <strong>
                {indicators.landPressure.toFixed(0)}%
              </strong>

            </div>


            <div className="indicator">

              <span>
                Waste Pressure
              </span>


              <strong>
                {indicators.wastePressure.toFixed(0)}%
              </strong>

            </div>


            <div className="indicator">

              <span>
                Green Benefit
              </span>


              <strong>
                {indicators.greenBenefit.toFixed(0)}%
              </strong>

            </div>

          </div>


          {/* CURRENT CITY */}

          <div className="object-counts">

            <h3>
              Current City
            </h3>


            {Object.entries(
              objectCounts
            ).length === 0 ? (

              <p>
                No objects built yet.
              </p>

            ) : (

              <>

                {Object.entries(
                  objectCounts
                ).map(

                  ([
                    type,
                    count,
                  ]) => (

                    <div
                      className="count-row"
                      key={type}
                    >

                      <span>

                        {
                          OBJECT_DATABASE[
                            type
                          ]?.icon
                        }

                        {" "}

                        {
                          OBJECT_DATABASE[
                            type
                          ]?.name
                        }

                      </span>


                      <strong>
                        {count}
                      </strong>

                    </div>

                  )

                )}

              </>

            )}

          </div>


          {/* SELECTED OBJECT */}

          <div className="selected-dashboard">

            <h3>
              Selected Object
            </h3>


            <p>

              {selectedObject.icon}

              {" "}

              <strong>
                {selectedObject.name}
              </strong>

            </p>


            <p>
              {selectedObject.description}
            </p>

          </div>


          {/* LAST BUILD IMPACT */}

          {lastBuildImpact && (
            <div className="last-build-box">

              <div className="last-build-header">

                <div>
                  <span className="section-eyebrow">
                    LAST BUILD
                  </span>

                  <h3>
                    {OBJECT_DATABASE[lastBuildImpact.object.type]?.icon}
                    {" "}
                    {OBJECT_DATABASE[lastBuildImpact.object.type]?.name}
                  </h3>
                </div>

                <span className="last-build-time">
                  {lastBuildImpact.builtAt}
                </span>

              </div>

              <div className="last-build-summary">

                <div>
                  <span>CO₂</span>
                  <strong>
                    {formatSigned(lastBuildImpact.changes.co2)}
                  </strong>
                  <small>kg</small>
                </div>

                <div>
                  <span>Energy</span>
                  <strong>
                    {formatSigned(lastBuildImpact.changes.energy)}
                  </strong>
                  <small>kWh</small>
                </div>

                <div>
                  <span>Score</span>
                  <strong>
                    {lastBuildImpact.changes.score > 0 ? "+" : ""}
                    {lastBuildImpact.changes.score}
                  </strong>
                  <small>pts</small>
                </div>

              </div>

              <button
                className="impact-report-button"
                onClick={() =>
                  setShowImpactReport(true)
                }
              >
                📊 Open Full Impact Report
              </button>

            </div>
          )}


          {/* WHAT-IF */}

          <div className="what-if-box">

            <h3>
              🔮 What-If Simulation
            </h3>


            <p className="what-if-description">

              See how adding one object could change
              your city's sustainability.

            </p>


            <select

              value={
                whatIfType
              }

              onChange={(event) =>
                setWhatIfType(
                  event.target.value
                )
              }

            >

              {Object.entries(
                OBJECT_DATABASE
              ).map(

                ([
                  type,
                  data,
                ]) => (

                  <option
                    key={type}
                    value={type}
                  >

                    {data.icon} {data.name}

                  </option>

                )

              )}

            </select>


            <button

              className="simulate-button"

              onClick={
                runWhatIfSimulation
              }

            >

              🔮 Simulate Change

            </button>


            {whatIfResult &&
              whatIfResult.success && (

                <div className="what-if-result">

                  <div className="what-if-title">

                    {
                      OBJECT_DATABASE[
                        whatIfResult.objectType
                      ]?.icon
                    }

                    {" Add "}

                    {
                      OBJECT_DATABASE[
                        whatIfResult.objectType
                      ]?.name
                    }

                  </div>


                  <div className="what-if-score">

                    <span>
                      Sustainability Score
                    </span>


                    <strong>

                      {
                        whatIfResult.current.score
                      }

                      {" → "}

                      {
                        whatIfResult.simulated.score
                      }

                    </strong>

                  </div>


                  <div

                    className={
                      whatIfResult.changes.score >= 0

                        ? "score-change positive"

                        : "score-change negative"
                    }

                  >

                    {
                      whatIfResult.changes.score >= 0
                        ? "▲"
                        : "▼"
                    }

                    {" "}

                    {
                      Math.abs(
                        whatIfResult.changes.score
                      ).toFixed(0)
                    }

                    {" points"}

                  </div>


                  <div className="what-if-metrics">

                    <div>

                      <span>
                        CO₂
                      </span>


                      <strong>
                        {
                          whatIfResult.changes.co2.toFixed(1)
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Energy
                      </span>


                      <strong>
                        {
                          whatIfResult.changes.energy.toFixed(1)
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Water
                      </span>


                      <strong>
                        {
                          whatIfResult.changes.water.toFixed(1)
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Green Cover
                      </span>


                      <strong>
                        {
                          whatIfResult.changes.greenCover.toFixed(1)
                        }
                      </strong>

                    </div>

                  </div>


                  <p className="what-if-note">

                    This is a temporary simulation.
                    Your actual city has not been changed.

                  </p>

                </div>

              )}

          </div>


          {/* AI RECOMMENDATIONS */}

          <div className="ai-box">

            <h3>
              🤖 AI Sustainability Analysis
            </h3>


            {recommendations.length === 0 ? (

              <p>

                Build your city to receive
                sustainability recommendations.

              </p>

            ) : (

              <div className="recommendation-list">

                {recommendations.map(

                  (recommendation) => (

                    <div

                      className={
                        `recommendation-card ${recommendation.priority}`
                      }

                      key={
                        recommendation.id
                      }

                    >

                      <div className="recommendation-header">

                        <span className="recommendation-icon">

                          {
                            recommendation.icon
                          }

                        </span>


                        <strong>

                          {
                            recommendation.title
                          }

                        </strong>

                      </div>


                      <p>

                        {
                          recommendation.message
                        }

                      </p>


                      <div className="recommendation-action">

                        💡{" "}

                        {
                          recommendation.action
                        }

                      </div>

                    </div>

                  )

                )}

              </div>

            )}

          </div>

        </aside>

      </main>


      {/* =================================================
          ACTUAL BUILD IMPACT REPORT
          ================================================= */}

      {showImpactReport &&
        lastBuildImpact && (
          <div
            className="impact-report-overlay"
            onClick={() =>
              setShowImpactReport(false)
            }
          >

            <div
              className="impact-report-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* REPORT HEADER */}

              <div className="impact-report-header">

                <div>

                  <span className="impact-report-kicker">
                    🌍 ECOBUILD CITY INTELLIGENCE
                  </span>

                  <h2>
                    {OBJECT_DATABASE[lastBuildImpact.object.type]?.icon}
                    {" "}
                    {OBJECT_DATABASE[lastBuildImpact.object.type]?.name}
                    {" "}
                    Impact Report
                  </h2>

                  <p>
                    This report shows what changed in the
                    simulated city when this object was actually built.
                  </p>

                </div>

                <button
                  className="impact-report-close"
                  onClick={() =>
                    setShowImpactReport(false)
                  }
                >
                  ✕
                </button>

              </div>


              {/* BEFORE / AFTER SCORE */}

              <div className="impact-hero">

                <div className="impact-score-ring" style={{ "--score": lastBuildImpact.after.score }}>

                  <div>
                    <span>
                      CITY SCORE
                    </span>

                    <strong>
                      {lastBuildImpact.after.score}
                    </strong>

                    <small>
                      /100
                    </small>
                  </div>

                </div>

                <div className="impact-score-copy">

                  <span className="impact-card-label">
                    BUILDING EFFECT
                  </span>

                  <h3>
                    {lastBuildImpact.before.score}
                    {" → "}
                    {lastBuildImpact.after.score}
                  </h3>

                  <p
                    className={
                      lastBuildImpact.changes.score >= 0
                        ? "impact-positive"
                        : "impact-negative"
                    }
                  >
                    {lastBuildImpact.changes.score >= 0
                      ? "▲"
                      : "▼"}
                    {" "}
                    {Math.abs(
                      lastBuildImpact.changes.score
                    )}
                    {" sustainability points"}
                  </p>

                  <span className="impact-method-note">
                    Actual city before/after simulation
                  </span>

                </div>

              </div>


              {/* ENVIRONMENTAL IMPACT */}

              <section className="impact-report-section">

                <div className="impact-section-heading">

                  <div>
                    <span>
                      01
                    </span>

                    <h3>
                      Environmental Impact
                    </h3>
                  </div>

                  <small>
                    Change caused by this build
                  </small>

                </div>


                <div className="impact-metric-grid">

                  {[
                    {
                      key: "co2",
                      icon: "☁️",
                      label: "CO₂ Emissions",
                      unit: "kg",
                      value: lastBuildImpact.changes.co2,
                    },
                    {
                      key: "energy",
                      icon: "⚡",
                      label: "Energy Demand",
                      unit: "kWh",
                      value: lastBuildImpact.changes.energy,
                    },
                    {
                      key: "water",
                      icon: "💧",
                      label: "Water Demand",
                      unit: "L",
                      value: lastBuildImpact.changes.water,
                    },
                    {
                      key: "greenCover",
                      icon: "🌱",
                      label: "Green Cover",
                      unit: "m²",
                      value: lastBuildImpact.changes.greenCover,
                    },
                    {
                      key: "land",
                      icon: "🗺️",
                      label: "Land Use",
                      unit: "m²",
                      value: lastBuildImpact.changes.land,
                    },
                    {
                      key: "waste",
                      icon: "♻️",
                      label: "Waste",
                      unit: "kg",
                      value: lastBuildImpact.changes.waste,
                    },
                  ].map((metric) => (

                    <div
                      className="impact-metric-card"
                      key={metric.key}
                    >

                      <div className="impact-metric-top">

                        <span>
                          {metric.icon}
                          {" "}
                          {metric.label}
                        </span>

                        <strong
                          className={
                            metric.value < 0
                              ? "impact-good"
                              : metric.value > 0
                              ? "impact-pressure"
                              : ""
                          }
                        >
                          {formatSigned(metric.value)}
                          {" "}
                          {metric.unit}
                        </strong>

                      </div>

                      <div className="impact-bar-track">

                        <div
                          className={
                            metric.value < 0
                              ? "impact-bar impact-bar-good"
                              : "impact-bar impact-bar-pressure"
                          }
                          style={{
                            width: `${impactBarWidth(metric.value)}%`,
                          }}
                        />

                      </div>

                      <small>
                        {metric.value < 0
                          ? "Reduces simulated pressure"
                          : metric.value > 0
                          ? "Adds simulated pressure"
                          : "No material change"}
                      </small>

                    </div>

                  ))}

                </div>

              </section>


              {/* SOCIAL / URBAN IMPACT */}

              <section className="impact-report-section">

                <div className="impact-section-heading">

                  <div>
                    <span>
                      02
                    </span>

                    <h3>
                      Social & Urban Life Impact
                    </h3>
                  </div>

                  <small>
                    Prototype decision-support indicators
                  </small>

                </div>


                <div className="social-impact-grid">

                  {[
                    {
                      key: "community",
                      icon: "🤝",
                      label: "Community Life",
                    },
                    {
                      key: "accessibility",
                      icon: "♿",
                      label: "Accessibility",
                    },
                    {
                      key: "jobs",
                      icon: "💼",
                      label: "Jobs & Economy",
                    },
                    {
                      key: "health",
                      icon: "❤️",
                      label: "Public Health",
                    },
                    {
                      key: "mobility",
                      icon: "🚶",
                      label: "Mobility",
                    },
                    {
                      key: "airQuality",
                      icon: "🌬️",
                      label: "Air Quality",
                    },
                    {
                      key: "noise",
                      icon: "🔊",
                      label: "Noise Environment",
                    },
                    {
                      key: "biodiversity",
                      icon: "🦋",
                      label: "Biodiversity",
                    },
                    {
                      key: "resilience",
                      icon: "🛡️",
                      label: "City Resilience",
                    },
                  ].map((metric) => {

                    const value =
                      lastBuildImpact.social[
                        metric.key
                      ];

                    return (
                      <div
                        className="social-impact-card"
                        key={metric.key}
                      >

                        <div className="social-impact-title">

                          <span>
                            {metric.icon}
                            {" "}
                            {metric.label}
                          </span>

                          <strong
                            className={
                              value > 0
                                ? "impact-good"
                                : value < 0
                                ? "impact-pressure"
                                : ""
                            }
                          >
                            {value > 0 ? "+" : ""}
                            {value}
                          </strong>

                        </div>

                        <div className="social-bar-track">

                          <div
                            className={
                              value >= 0
                                ? "social-bar social-bar-positive"
                                : "social-bar social-bar-negative"
                            }
                            style={{
                              width: `${impactBarWidth(value)}%`,
                            }}
                          />

                        </div>

                        <small>
                          {getImpactLabel(value)}
                        </small>

                      </div>
                    );
                  })}

                </div>


                <div className="social-impact-note">

                  <strong>
                    ℹ️ How to explain
                  </strong>

                  <p>
                    These social and urban indicators are
                    explainable prototype scores. They represent
                    the simulator's estimated direction of impact;
                    they are not measured census, health, or
                    community statistics.
                  </p>

                </div>

              </section>


              {/* BEFORE / AFTER DATA */}

              <section className="impact-report-section">

                <div className="impact-section-heading">

                  <div>
                    <span>
                      03
                    </span>

                    <h3>
                      City Before vs After
                    </h3>
                  </div>

                </div>


                <div className="before-after-grid">

                  {[
                    {
                      label: "CO₂",
                      unit: "kg",
                      before: lastBuildImpact.before.impact.co2,
                      after: lastBuildImpact.after.impact.co2,
                    },
                    {
                      label: "Energy",
                      unit: "kWh",
                      before: lastBuildImpact.before.impact.energy,
                      after: lastBuildImpact.after.impact.energy,
                    },
                    {
                      label: "Water",
                      unit: "L",
                      before: lastBuildImpact.before.impact.water,
                      after: lastBuildImpact.after.impact.water,
                    },
                    {
                      label: "Green Cover",
                      unit: "m²",
                      before: lastBuildImpact.before.impact.greenCover,
                      after: lastBuildImpact.after.impact.greenCover,
                    },
                  ].map((item) => (

                    <div
                      className="before-after-card"
                      key={item.label}
                    >

                      <span>
                        {item.label}
                      </span>

                      <div>
                        <small>
                          Before
                        </small>
                        <strong>
                          {item.before.toFixed(1)}
                          {" "}
                          {item.unit}
                        </strong>
                      </div>

                      <div>
                        <small>
                          After
                        </small>
                        <strong>
                          {item.after.toFixed(1)}
                          {" "}
                          {item.unit}
                        </strong>
                      </div>

                    </div>

                  ))}

                </div>

              </section>


              {/* AI ACTION */}

              <div className="impact-report-footer">

                <div>

                  <strong>
                    🤖 Next step
                  </strong>

                  <p>
                    Compare this impact with solar, trees,
                    parks or other infrastructure before making
                    your next city decision.
                  </p>

                </div>

                {configurableBuildings.includes(
                  lastBuildImpact.object.type
                ) && (
                  <button
                    className="impact-ml-button"
                    onClick={() => {
                      setSelectedType(
                        lastBuildImpact.object.type
                      );

                      setBuildingParameters(
                        lastBuildImpact.object.parameters ||
                        getDefaultParameters(
                          lastBuildImpact.object.type
                        )
                      );

                      setShowImpactReport(
                        false
                      );

                      setShowMlPredictor(
                        true
                      );
                    }}
                  >
                    🤖 Open ML Energy Analysis
                  </button>
                )}

              </div>

            </div>

          </div>
        )}


      {/* =================================================
          UNIVERSAL AI / ENVIRONMENT PREDICTION MODAL
          ================================================= */}

      {showMlPredictor && (

        <div
          className="ml-modal-overlay"
          onClick={() =>
            setShowMlPredictor(false)
          }
        >

          <div
            className="ml-modal universal-prediction-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="ml-modal-header">

              <div>

                <div className="prediction-kicker">
                  🌍 ECOBUILD INTELLIGENCE
                </div>

                <h2>
                  🤖 AI City Object Analyzer
                </h2>

                <p>
                  Select any object from your city and explore
                  its energy or environmental impact before building it.
                </p>

              </div>


              <button
                className="ml-close-button"
                onClick={() =>
                  setShowMlPredictor(false)
                }
              >
                ✕
              </button>

            </div>


            {/* OBJECT SELECTOR */}

            <div className="prediction-section">

              <div className="prediction-section-title">
                <span>1</span>
                Choose a city object
              </div>


              <label className="ml-field">

                <span>
                  Object / Infrastructure
                </span>


                <select
                  value={selectedType}
                  onChange={(event) => {

                    selectObject(
                      event.target.value
                    );

                    setMlPrediction(
                      null
                    );

                    setImpactPrediction(
                      null
                    );

                    setMlError(
                      ""
                    );

                  }}
                >

                  {Object.entries(
                    OBJECT_DATABASE
                  ).map(
                    ([
                      type,
                      data,
                    ]) => (

                      <option
                        key={type}
                        value={type}
                      >

                        {data.icon}{" "}
                        {data.name}

                      </option>

                    )
                  )}

                </select>

              </label>


              {/* SELECTED OBJECT CARD */}

              <div className="prediction-object-card">

                <div className="prediction-object-icon">
                  {selectedObject.icon}
                </div>

                <div className="prediction-object-info">

                  <strong>
                    {selectedObject.name}
                  </strong>

                  <span>
                    {selectedObject.category}
                  </span>

                  <p>
                    {selectedObject.description}
                  </p>

                </div>

                <div className="prediction-object-badge">
                  {configurableBuildings.includes(selectedType)
                    ? "AI ENERGY"
                    : "IMPACT"}
                </div>

              </div>

            </div>


            {/* BUILDING INPUTS */}

            {configurableBuildings.includes(
              selectedType
            ) ? (

              <div className="prediction-section">

                <div className="prediction-section-title">
                  <span>2</span>
                  Building information
                </div>


                <div className="prediction-input-grid">

                  <label className="ml-field">

                    <span>
                      Building Area (m²)
                    </span>

                    <input
                      type="number"
                      min="10"
                      value={
                        buildingParameters?.area ??
                        100
                      }
                      onChange={(event) =>
                        setBuildingParameters({
                          ...buildingParameters,
                          area:
                            Number(
                              event.target.value
                            ),
                        })
                      }
                    />

                  </label>


                  <label className="ml-field">

                    <span>
                      Occupants
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        buildingParameters?.occupants ??
                        0
                      }
                      onChange={(event) =>
                        setBuildingParameters({
                          ...buildingParameters,
                          occupants:
                            Number(
                              event.target.value
                            ),
                        })
                      }
                    />

                  </label>

                </div>


                <div className="prediction-capabilities">

                  <span>✓ Next-hour energy</span>
                  <span>✓ Building scale</span>
                  <span>✓ BDG2 ML model</span>

                </div>

              </div>

            ) : (

              <div className="prediction-section">

                <div className="prediction-section-title">
                  <span>2</span>
                  Environmental forecast
                </div>

                <div className="prediction-info-box">

                  <strong>
                    🌱 No building inputs required
                  </strong>

                  <p>
                    This object will be analyzed using the
                    EcoBuild environmental simulation engine.
                    It estimates the change in CO₂, energy,
                    water, land, green cover and waste when
                    one additional object is introduced.
                  </p>

                </div>

              </div>

            )}


            {/* ACTION */}

            <div className="prediction-action-section">

              <div>

                <strong>
                  {configurableBuildings.includes(selectedType)
                    ? "AI Energy Forecast"
                    : "Environmental Impact Forecast"}
                </strong>

                <span>
                  {configurableBuildings.includes(selectedType)
                    ? "Uses the trained BDG2 V3 model."
                    : "Runs a temporary what-if simulation without changing your city."}
                </span>

              </div>


              <button
                className="ml-predict-button"
                onClick={
                  configurableBuildings.includes(selectedType)
                    ? predictSelectedBuilding
                    : runObjectImpactForecast
                }
                disabled={mlLoading}
              >

                {configurableBuildings.includes(selectedType)
                  ? (
                    mlLoading
                      ? "🤖 Running AI Model..."
                      : "🤖 Predict Energy"
                  )
                  : (
                    "🌱 Analyze Impact"
                  )
                }

              </button>

            </div>


            {/* ERROR */}

            {mlError && (

              <div className="ml-error">
                ⚠️ {mlError}
              </div>

            )}


            {/* ML RESULT */}

            {mlPrediction &&
              configurableBuildings.includes(selectedType) && (

              <div className="ml-result prediction-result-card">

                <div className="ml-result-icon">
                  ⚡
                </div>

                <p className="ml-result-label">
                  Predicted Next-Hour Energy
                </p>

                <div className="ml-result-value">

                  {
                    mlPrediction.predicted_energy_kwh
                  }

                  <span>
                    kWh
                  </span>

                </div>

                <div className="ml-result-details">

                  <div>
                    <span>Model</span>
                    <strong>
                      {mlPrediction.model_version}
                    </strong>
                  </div>

                  <div>
                    <span>Features</span>
                    <strong>
                      {mlPrediction.features_used}
                    </strong>
                  </div>

                  <div>
                    <span>Target</span>
                    <strong>
                      Next Hour
                    </strong>
                  </div>

                </div>

                <p className="ml-result-note">
                  This prediction is generated by the
                  BDG2-trained V3 machine learning model.
                </p>

              </div>

            )}


            {/* UNIVERSAL ENVIRONMENT RESULT */}

            {impactPrediction &&
              impactPrediction.success && (

              <div className="prediction-impact-result">

                <div className="prediction-result-heading">

                  <div className="prediction-result-icon">
                    {selectedObject.icon}
                  </div>

                  <div>

                    <span>
                      Adding one {selectedObject.name}
                    </span>

                    <strong>
                      Environmental Forecast
                    </strong>

                  </div>

                </div>


                <div className="prediction-score-row">

                  <div>
                    <span>City Score</span>

                    <strong>
                      {impactPrediction.current.score}
                      {" → "}
                      {impactPrediction.simulated.score}
                    </strong>
                  </div>


                  <div
                    className={
                      impactPrediction.changes.score >= 0
                        ? "score-change positive"
                        : "score-change negative"
                    }
                  >

                    {impactPrediction.changes.score >= 0
                      ? "▲"
                      : "▼"}

                    {" "}

                    {Math.abs(
                      impactPrediction.changes.score
                    ).toFixed(0)}

                    {" points"}

                  </div>

                </div>


                <div className="prediction-impact-grid">

                  <div>
                    <span>☁️ CO₂</span>
                    <strong>
                      {impactPrediction.changes.co2 >= 0
                        ? "+"
                        : ""}
                      {impactPrediction.changes.co2.toFixed(1)}
                      {" kg"}
                    </strong>
                  </div>

                  <div>
                    <span>⚡ Energy</span>
                    <strong>
                      {impactPrediction.changes.energy >= 0
                        ? "+"
                        : ""}
                      {impactPrediction.changes.energy.toFixed(1)}
                      {" kWh"}
                    </strong>
                  </div>

                  <div>
                    <span>💧 Water</span>
                    <strong>
                      {impactPrediction.changes.water >= 0
                        ? "+"
                        : ""}
                      {impactPrediction.changes.water.toFixed(1)}
                      {" L"}
                    </strong>
                  </div>

                  <div>
                    <span>🌱 Green Cover</span>
                    <strong>
                      {impactPrediction.changes.greenCover >= 0
                        ? "+"
                        : ""}
                      {impactPrediction.changes.greenCover.toFixed(1)}
                      {" m²"}
                    </strong>
                  </div>

                  <div>
                    <span>🗺️ Land</span>
                    <strong>
                      {impactPrediction.changes.land >= 0
                        ? "+"
                        : ""}
                      {impactPrediction.changes.land.toFixed(1)}
                      {" m²"}
                    </strong>
                  </div>

                  <div>
                    <span>♻️ Waste</span>
                    <strong>
                      {impactPrediction.changes.waste >= 0
                        ? "+"
                        : ""}
                      {impactPrediction.changes.waste.toFixed(2)}
                      {" kg"}
                    </strong>
                  </div>

                </div>


                <div className="prediction-insight">

                  <strong>
                    💡 AI Insight
                  </strong>

                  <p>

                    {impactPrediction.changes.greenCover > 0
                      ? `${selectedObject.name} increases green cover and can improve the city's ecological balance.`
                      : impactPrediction.changes.energy < 0
                      ? `${selectedObject.name} reduces simulated energy pressure in the current city scenario.`
                      : impactPrediction.changes.co2 < 0
                      ? `${selectedObject.name} reduces simulated CO₂ impact in the current city scenario.`
                      : `${selectedObject.name} changes the city's environmental profile. Compare the metrics above before building.`}

                  </p>

                </div>


                <p className="ml-result-note">
                  Temporary simulation only. Your actual city
                  has not been changed.
                </p>

              </div>

            )}


            {/* FOOTER */}

            <div className="prediction-footer">

              <span>
                🔬 Explainable simulation
              </span>

              <span>
                🌍 Multi-object city analysis
              </span>

              <span>
                🔄 No city changes until you build
              </span>

            </div>

          </div>

        </div>

      )}


    </div>

  );

}


export default App;