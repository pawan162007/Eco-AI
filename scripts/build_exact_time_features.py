import duckdb
import os


INPUT_FILE = "data/processed/bdg2_energy_long.parquet"
OUTPUT_FILE = "data/processed/bdg2_exact_features.parquet"

TEMP_DIR = "data/processed/duckdb_tmp"

os.makedirs(TEMP_DIR, exist_ok=True)

con = duckdb.connect()

con.execute(f"SET temp_directory='{TEMP_DIR}';")
con.execute("SET memory_limit='4GB';")
con.execute("SET threads=4;")


print("\n==============================================")
print(" EcoBuild AI - Exact Timestamp Features")
print("==============================================")


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

            SIN(2 * PI() * hour / 24.0)
                AS hour_sin,

            COS(2 * PI() * hour / 24.0)
                AS hour_cos,

            SIN(2 * PI() * day_of_week / 7.0)
                AS day_of_week_sin,

            COS(2 * PI() * day_of_week / 7.0)
                AS day_of_week_cos,

            SIN(2 * PI() * month / 12.0)
                AS month_sin,

            COS(2 * PI() * month / 12.0)
                AS month_cos

        FROM read_parquet('{INPUT_FILE}')
    ),

    previous_values AS (

        SELECT
            a.*,

            b.energy_kwh AS energy_lag_1h,
            c.energy_kwh AS energy_lag_24h,
            d.energy_kwh AS energy_lag_168h,

            e.energy_kwh AS target_next_hour_energy

        FROM base a

        LEFT JOIN base b
            ON a.building_id = b.building_id
            AND b.timestamp = a.timestamp - INTERVAL 1 HOUR

        LEFT JOIN base c
            ON a.building_id = c.building_id
            AND c.timestamp = a.timestamp - INTERVAL 24 HOUR

        LEFT JOIN base d
            ON a.building_id = d.building_id
            AND d.timestamp = a.timestamp - INTERVAL 168 HOUR

        LEFT JOIN base e
            ON a.building_id = e.building_id
            AND e.timestamp = a.timestamp + INTERVAL 1 HOUR
    ),

    final_features AS (

        SELECT
            *,

            AVG(energy_kwh) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
                RANGE BETWEEN
                    INTERVAL 24 HOURS PRECEDING
                    AND INTERVAL 1 HOUR PRECEDING
            ) AS energy_rolling_mean_24h,

            STDDEV_SAMP(energy_kwh) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
                RANGE BETWEEN
                    INTERVAL 24 HOURS PRECEDING
                    AND INTERVAL 1 HOUR PRECEDING
            ) AS energy_rolling_std_24h,

            AVG(energy_kwh) OVER (
                PARTITION BY building_id
                ORDER BY timestamp
                RANGE BETWEEN
                    INTERVAL 168 HOURS PRECEDING
                    AND INTERVAL 1 HOUR PRECEDING
            ) AS energy_rolling_mean_168h

        FROM previous_values
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

    FROM final_features

    WHERE
        energy_lag_1h IS NOT NULL
        AND energy_lag_24h IS NOT NULL
        AND energy_lag_168h IS NOT NULL
        AND target_next_hour_energy IS NOT NULL

) TO '{OUTPUT_FILE}'
(
    FORMAT PARQUET,
    COMPRESSION ZSTD
);
"""


print("\nCreating exact timestamp features...")
con.execute(query)

print("\nFeature generation completed. ✅")


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


print("\n--- RESULT ---")
print("Rows:", f"{result[0]:,}")
print("Buildings:", f"{result[1]:,}")
print("Start:", result[2])
print("End:", result[3])


size_mb = os.path.getsize(OUTPUT_FILE) / (
    1024 * 1024
)

print("\nOutput size:", f"{size_mb:.2f} MB")
print("Output:", OUTPUT_FILE)

print("\n==============================================")
print(" Exact timestamp feature generation done! 🚀")
print("==============================================")


con.close()