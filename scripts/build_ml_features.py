import duckdb
import os


# ============================================================
# PATHS
# ============================================================

INPUT_FILE = "data/processed/bdg2_energy_long.parquet"

OUTPUT_FILE = "data/processed/bdg2_ml_features.parquet"

# DuckDB temporary working directory
TEMP_DIR = "data/processed/duckdb_tmp"

os.makedirs(TEMP_DIR, exist_ok=True)


# ============================================================
# DATABASE CONNECTION
# ============================================================

con = duckdb.connect()

con.execute(
    f"""
    SET temp_directory = '{TEMP_DIR}';
    SET memory_limit = '4GB';
    SET threads = 4;
    """
)


print("\n==============================================")
print(" EcoBuild AI - ML Feature Engineering")
print("==============================================")

print("\nInput:")
print(INPUT_FILE)

print("\nOutput:")
print(OUTPUT_FILE)


# ============================================================
# CHECK INPUT
# ============================================================

if not os.path.exists(INPUT_FILE):
    raise FileNotFoundError(
        f"Input file not found: {INPUT_FILE}"
    )


# ============================================================
# CREATE FEATURE DATASET
# ============================================================

print("\n[1/4] Creating ML features...")

query = f"""
COPY (

    WITH base AS (

        SELECT
            timestamp,
            building_id,
            site_id,

            COALESCE(
                CAST(primaryspaceusage AS VARCHAR),
                'Unknown'
            ) AS primaryspaceusage,

            sqm,
            energy_kwh,

            hour,
            day,
            month,
            year,
            day_of_week,
            is_weekend,

            -- Cyclic hour features
            SIN(2 * PI() * hour / 24.0) AS hour_sin,
            COS(2 * PI() * hour / 24.0) AS hour_cos,

            -- Cyclic day-of-week features
            SIN(2 * PI() * day_of_week / 7.0)
                AS day_of_week_sin,

            COS(2 * PI() * day_of_week / 7.0)
                AS day_of_week_cos,

            -- Cyclic month features
            SIN(2 * PI() * month / 12.0)
                AS month_sin,

            COS(2 * PI() * month / 12.0)
                AS month_cos

        FROM read_parquet(
            '{INPUT_FILE}'
        )

    ),

    features AS (

        SELECT
            *,

            -- Previous observed reading
            LAG(energy_kwh, 1) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
            ) AS energy_lag_1h,

            -- Same building, previous day
            LAG(energy_kwh, 24) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
            ) AS energy_lag_24h,

            -- Same building, previous week
            LAG(energy_kwh, 168) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
            ) AS energy_lag_168h,

            -- 24-hour rolling average
            AVG(energy_kwh) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
                ROWS BETWEEN 24 PRECEDING AND 1 PRECEDING
            ) AS energy_rolling_mean_24h,

            -- 24-hour rolling standard deviation
            STDDEV_SAMP(energy_kwh) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
                ROWS BETWEEN 24 PRECEDING AND 1 PRECEDING
            ) AS energy_rolling_std_24h,

            -- 168-hour rolling average
            AVG(energy_kwh) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
                ROWS BETWEEN 168 PRECEDING AND 1 PRECEDING
            ) AS energy_rolling_mean_168h,

            -- Next-hour target
            LEAD(energy_kwh, 1) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
            ) AS target_next_hour_energy

        FROM base

    )

    SELECT
        timestamp,
        building_id,
        site_id,
        primaryspaceusage,
        sqm,

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

        energy_kwh,

        energy_lag_1h,
        energy_lag_24h,
        energy_lag_168h,

        energy_rolling_mean_24h,
        energy_rolling_std_24h,
        energy_rolling_mean_168h,

        target_next_hour_energy

    FROM features

    WHERE
        energy_lag_1h IS NOT NULL
        AND energy_lag_24h IS NOT NULL
        AND energy_lag_168h IS NOT NULL
        AND energy_rolling_mean_24h IS NOT NULL
        AND target_next_hour_energy IS NOT NULL

) TO '{OUTPUT_FILE}'
(
    FORMAT PARQUET,
    COMPRESSION ZSTD
);
"""

con.execute(query)

print("\n[2/4] Feature engineering completed. ✅")


# ============================================================
# BASIC VERIFICATION
# ============================================================

print("\n[3/4] Checking generated dataset...")

result = con.execute(
    f"""
    SELECT
        COUNT(*) AS rows,
        COUNT(DISTINCT building_id) AS buildings,
        MIN(timestamp) AS start_time,
        MAX(timestamp) AS end_time
    FROM read_parquet('{OUTPUT_FILE}')
    """
).fetchone()

print("\nRows:", f"{result[0]:,}")
print("Buildings:", f"{result[1]:,}")
print("Start:", result[2])
print("End:", result[3])


# ============================================================
# FEATURE LIST
# ============================================================

columns = con.execute(
    f"""
    DESCRIBE SELECT *
    FROM read_parquet('{OUTPUT_FILE}')
    """
).fetchall()

print("\n[4/4] Generated columns:")

for column in columns:
    print(" -", column[0])


# ============================================================
# FILE SIZE
# ============================================================

size_mb = os.path.getsize(OUTPUT_FILE) / (
    1024 * 1024
)

print("\n==============================================")
print(" Feature engineering finished! 🚀")
print("==============================================")
print(f"Output size: {size_mb:.2f} MB")
print(f"Output: {OUTPUT_FILE}")


con.close()