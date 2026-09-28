import duckdb
import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# EcoBuild AI
# Energy Model V2 - Outlier Investigation
# ============================================================

print("\n==============================================")
print(" EcoBuild AI - V2 Outlier Investigation")
print("==============================================\n")


FEATURE_FILE = Path(
    "data/processed/bdg2_exact_features.parquet"
)

OUTPUT_FILE = Path(
    "data/processed/outlier_investigation.csv"
)


# ------------------------------------------------------------
# 1. Target buildings
# ------------------------------------------------------------

TARGET_BUILDINGS = [
    "Hog_education_Janell",
]


print("[1/4] Target buildings:")
for building in TARGET_BUILDINGS:
    print(f"  - {building}")


# ------------------------------------------------------------
# 2. Load data
# ------------------------------------------------------------

print("\n[2/4] Loading building data...")

con = duckdb.connect()

building_list = ", ".join(
    f"'{building}'"
    for building in TARGET_BUILDINGS
)

query = f"""
SELECT
    timestamp,
    building_id,
    primaryspaceusage,
    sqm,
    energy_kwh,
    energy_lag_1h,
    energy_lag_24h,
    energy_lag_168h,
    energy_rolling_mean_24h,
    energy_rolling_std_24h,
    energy_rolling_mean_168h,
    target_next_hour_energy
FROM read_parquet('{FEATURE_FILE}')
WHERE building_id IN ({building_list})
ORDER BY building_id, timestamp
"""

df = con.execute(query).fetchdf()

con.close()

print(f"Rows loaded: {len(df):,}")


if df.empty:
    print("\n❌ No records found.")
    raise SystemExit(1)


# ------------------------------------------------------------
# 3. Basic statistics
# ------------------------------------------------------------

print("\n[3/4] Analysing energy behaviour...")


print("\n==============================================")
print(" BUILDING INFORMATION")
print("==============================================")

print(
    f"Building ID : {df['building_id'].iloc[0]}"
)

print(
    f"Building Type: "
    f"{df['primaryspaceusage'].iloc[0]}"
)

print(
    f"Area: "
    f"{df['sqm'].iloc[0]} sqm"
)

print(
    f"Records: {len(df):,}"
)

print(
    f"Start: {df['timestamp'].min()}"
)

print(
    f"End  : {df['timestamp'].max()}"
)


# ------------------------------------------------------------
# Energy statistics
# ------------------------------------------------------------

print("\n==============================================")
print(" ENERGY STATISTICS")
print("==============================================")

energy = df["energy_kwh"]

print(f"Mean   : {energy.mean():.4f} kWh")
print(f"Median : {energy.median():.4f} kWh")
print(f"Std    : {energy.std():.4f} kWh")
print(f"Min    : {energy.min():.4f} kWh")
print(f"Max    : {energy.max():.4f} kWh")

print(
    f"95th percentile : "
    f"{np.percentile(energy, 95):.4f} kWh"
)

print(
    f"99th percentile : "
    f"{np.percentile(energy, 99):.4f} kWh"
)


# ------------------------------------------------------------
# Spike detection
# ------------------------------------------------------------

p95 = np.percentile(energy, 95)
p99 = np.percentile(energy, 99)

df["is_p95_spike"] = df["energy_kwh"] > p95
df["is_p99_spike"] = df["energy_kwh"] > p99


print("\n==============================================")
print(" SPIKE ANALYSIS")
print("==============================================")

print(
    f"95th percentile threshold : "
    f"{p95:.4f} kWh"
)

print(
    f"99th percentile threshold : "
    f"{p99:.4f} kWh"
)

print(
    f"Records above P95: "
    f"{df['is_p95_spike'].sum():,}"
)

print(
    f"Records above P99: "
    f"{df['is_p99_spike'].sum():,}"
)


# ------------------------------------------------------------
# Largest actual energy values
# ------------------------------------------------------------

print("\n==============================================")
print(" TOP 30 ACTUAL ENERGY VALUES")
print("==============================================")

top_actual = (
    df[
        [
            "timestamp",
            "energy_kwh",
            "energy_lag_1h",
            "energy_lag_24h",
            "energy_lag_168h",
            "energy_rolling_mean_24h",
            "energy_rolling_mean_168h",
        ]
    ]
    .sort_values(
        "energy_kwh",
        ascending=False
    )
    .head(30)
)

print(
    top_actual.to_string(
        index=False
    )
)


# ------------------------------------------------------------
# Largest hour-to-hour changes
# ------------------------------------------------------------

df["change_from_previous_hour"] = (
    df["energy_kwh"]
    - df["energy_lag_1h"]
)

df["absolute_hour_change"] = np.abs(
    df["change_from_previous_hour"]
)


print("\n==============================================")
print(" TOP 20 HOURLY CHANGES")
print("==============================================")

top_changes = (
    df[
        [
            "timestamp",
            "energy_kwh",
            "energy_lag_1h",
            "change_from_previous_hour",
            "absolute_hour_change",
            "energy_lag_24h",
            "energy_lag_168h",
        ]
    ]
    .sort_values(
        "absolute_hour_change",
        ascending=False
    )
    .head(20)
)

print(
    top_changes.to_string(
        index=False
    )
)


# ------------------------------------------------------------
# September 22-23 detailed investigation
# ------------------------------------------------------------

print("\n==============================================")
print(" SEPTEMBER 22-23 SPIKE WINDOW")
print("==============================================")

window = df[
    (
        df["timestamp"]
        >= pd.Timestamp("2017-09-21")
    )
    &
    (
        df["timestamp"]
        < pd.Timestamp("2017-09-25")
    )
]

print(
    window[
        [
            "timestamp",
            "energy_kwh",
            "energy_lag_1h",
            "energy_lag_24h",
            "energy_lag_168h",
            "energy_rolling_mean_24h",
            "energy_rolling_mean_168h",
        ]
    ].to_string(index=False)
)


# ------------------------------------------------------------
# Save investigation
# ------------------------------------------------------------

print("\n[4/4] Saving investigation results...")

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print(
    f"\nSaved to:\n{OUTPUT_FILE}"
)


print("\n==============================================")
print(" OUTLIER INVESTIGATION COMPLETED! 🔎")
print("==============================================\n")