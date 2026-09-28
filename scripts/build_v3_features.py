import duckdb
from pathlib import Path


# ============================================================
# EcoBuild AI
# Energy Prediction Model V3 - Feature Engineering
# ============================================================

print("\n==============================================")
print(" EcoBuild AI - V3 Feature Engineering")
print("==============================================\n")


INPUT_FILE = Path(
    "data/processed/bdg2_exact_features.parquet"
)

OUTPUT_FILE = Path(
    "data/processed/bdg2_v3_features.parquet"
)


# ------------------------------------------------------------
# 1. Connect to DuckDB
# ------------------------------------------------------------

print("[1/5] Connecting to DuckDB...")

con = duckdb.connect()


# ------------------------------------------------------------
# 2. Build V3 features
# ------------------------------------------------------------

print("[2/5] Building advanced temporal features...")


query = f"""
COPY (

    SELECT

        timestamp,
        building_id,
        site_id,
        primaryspaceusage,
        sqm,

        ----------------------------------------------------
        -- Basic time features
        ----------------------------------------------------

        hour,
        day,
        month,
        year,
        day_of_week,
        is_weekend,

        hour_sin,
        hour_cos,
        day_of_week_sin,
        day_of_week_cos,
        month_sin,
        month_cos,

        ----------------------------------------------------
        -- Current energy
        ----------------------------------------------------

        energy_kwh,

        ----------------------------------------------------
        -- Exact historical lags
        ----------------------------------------------------

        energy_lag_1h,
        energy_lag_24h,
        energy_lag_168h,

        ----------------------------------------------------
        -- Existing rolling features
        ----------------------------------------------------

        energy_rolling_mean_24h,
        energy_rolling_std_24h,
        energy_rolling_mean_168h,

        ----------------------------------------------------
        -- NEW V3: Hourly change
        ----------------------------------------------------

        energy_kwh - energy_lag_1h
            AS energy_change_1h,

        ABS(
            energy_kwh - energy_lag_1h
        )
            AS energy_abs_change_1h,

        ----------------------------------------------------
        -- NEW V3: 24-hour change
        ----------------------------------------------------

        energy_kwh - energy_lag_24h
            AS energy_change_24h,

        ABS(
            energy_kwh - energy_lag_24h
        )
            AS energy_abs_change_24h,

        ----------------------------------------------------
        -- NEW V3: 7-day change
        ----------------------------------------------------

        energy_kwh - energy_lag_168h
            AS energy_change_168h,

        ABS(
            energy_kwh - energy_lag_168h
        )
            AS energy_abs_change_168h,

        ----------------------------------------------------
        -- NEW V3: Relative changes
        ----------------------------------------------------

        CASE
            WHEN energy_lag_1h > 0
            THEN energy_kwh / energy_lag_1h
            ELSE NULL
        END
            AS energy_ratio_1h,

        CASE
            WHEN energy_lag_24h > 0
            THEN energy_kwh / energy_lag_24h
            ELSE NULL
        END
            AS energy_ratio_24h,

        CASE
            WHEN energy_lag_168h > 0
            THEN energy_kwh / energy_lag_168h
            ELSE NULL
        END
            AS energy_ratio_168h,

        ----------------------------------------------------
        -- NEW V3: Energy intensity
        ----------------------------------------------------

        CASE
            WHEN sqm > 0
            THEN energy_kwh / sqm
            ELSE NULL
        END
            AS energy_per_sqm,

        CASE
            WHEN sqm > 0
            THEN energy_lag_24h / sqm
            ELSE NULL
        END
            AS lag_24h_per_sqm,

        ----------------------------------------------------
        -- NEW V3: Rolling deviation
        ----------------------------------------------------

        energy_kwh - energy_rolling_mean_24h
            AS deviation_from_24h_mean,

        ABS(
            energy_kwh - energy_rolling_mean_24h
        )
            AS absolute_deviation_24h,

        energy_kwh - energy_rolling_mean_168h
            AS deviation_from_168h_mean,

        ABS(
            energy_kwh - energy_rolling_mean_168h
        )
            AS absolute_deviation_168h,

        ----------------------------------------------------
        -- NEW V3: Recent maximum/minimum
        ----------------------------------------------------

        MAX(energy_kwh) OVER (
            PARTITION BY building_id
            ORDER BY timestamp
            RANGE BETWEEN
                INTERVAL 24 HOURS PRECEDING
                AND INTERVAL 1 HOUR PRECEDING
        )
            AS energy_max_24h,

        MIN(energy_kwh) OVER (
            PARTITION BY building_id
            ORDER BY timestamp
            RANGE BETWEEN
                INTERVAL 24 HOURS PRECEDING
                AND INTERVAL 1 HOUR PRECEDING
        )
            AS energy_min_24h,

        MAX(energy_kwh) OVER (
            PARTITION BY building_id
            ORDER BY timestamp
            RANGE BETWEEN
                INTERVAL 168 HOURS PRECEDING
                AND INTERVAL 1 HOUR PRECEDING
        )
            AS energy_max_168h,

        MIN(energy_kwh) OVER (
            PARTITION BY building_id
            ORDER BY timestamp
            RANGE BETWEEN
                INTERVAL 168 HOURS PRECEDING
                AND INTERVAL 1 HOUR PRECEDING
        )
            AS energy_min_168h,

        ----------------------------------------------------
        -- NEW V3: Recent volatility
        ----------------------------------------------------

        STDDEV_SAMP(energy_kwh) OVER (
            PARTITION BY building_id
            ORDER BY timestamp
            RANGE BETWEEN
                INTERVAL 6 HOURS PRECEDING
                AND INTERVAL 1 HOUR PRECEDING
        )
            AS energy_std_6h,

        STDDEV_SAMP(energy_kwh) OVER (
            PARTITION BY building_id
            ORDER BY timestamp
            RANGE BETWEEN
                INTERVAL 24 HOURS PRECEDING
                AND INTERVAL 1 HOUR PRECEDING
        )
            AS energy_std_24h,

        ----------------------------------------------------
        -- Target
        ----------------------------------------------------

        target_next_hour_energy

    FROM read_parquet('{INPUT_FILE}')

    WHERE
        energy_lag_1h IS NOT NULL
        AND energy_lag_24h IS NOT NULL
        AND energy_lag_168h IS NOT NULL
        AND energy_rolling_mean_24h IS NOT NULL
        AND energy_rolling_mean_168h IS NOT NULL
        AND target_next_hour_energy IS NOT NULL

) TO '{OUTPUT_FILE}'
(
    FORMAT PARQUET,
    COMPRESSION ZSTD
)
"""


# ------------------------------------------------------------
# 3. Execute
# ------------------------------------------------------------

print("[3/5] Processing data...")
print("This may take some time because the dataset is large.\n")

con.execute(query)

print("Feature engineering completed. ✅")


# ------------------------------------------------------------
# 4. Verify output
# ------------------------------------------------------------

print("\n[4/5] Verifying V3 dataset...")

count = con.execute(
    f"""
    SELECT COUNT(*)
    FROM read_parquet('{OUTPUT_FILE}')
    """
).fetchone()[0]

buildings = con.execute(
    f"""
    SELECT COUNT(DISTINCT building_id)
    FROM read_parquet('{OUTPUT_FILE}')
    """
).fetchone()[0]

date_range = con.execute(
    f"""
    SELECT
        MIN(timestamp),
        MAX(timestamp)
    FROM read_parquet('{OUTPUT_FILE}')
    """
).fetchone()

print(f"Rows     : {count:,}")
print(f"Buildings: {buildings:,}")
print(f"Start    : {date_range[0]}")
print(f"End      : {date_range[1]}")


# ------------------------------------------------------------
# 5. Show columns
# ------------------------------------------------------------

print("\n[5/5] Checking V3 columns...")

schema = con.execute(
    f"""
    DESCRIBE
    SELECT *
    FROM read_parquet('{OUTPUT_FILE}')
    """
).fetchdf()

print("\nV3 feature columns:")

for column in schema["column_name"]:
    print(f"  - {column}")


con.close()


print("\n==============================================")
print(" V3 FEATURE ENGINEERING COMPLETED! 🚀")
print("==============================================")

print(f"\nOutput:")
print(OUTPUT_FILE)