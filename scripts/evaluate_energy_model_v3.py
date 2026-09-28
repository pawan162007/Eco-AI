import os
import joblib
import duckdb
import numpy as np
import pandas as pd

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# =========================================================
# CONFIGURATION
# =========================================================

FEATURE_FILE = "data/processed/bdg2_v3_features.parquet"
MODEL_FILE = "data/processed/energy_model_v3.joblib"

OUTPUT_FILE = "data/processed/model_v3_full_evaluation.csv"

BATCH_SIZE = 100_000


# =========================================================
# FEATURES
# =========================================================

NUMERIC_FEATURES = [
    "sqm",
    "hour",
    "day",
    "month",
    "year",
    "day_of_week",
    "is_weekend",

    "hour_sin",
    "hour_cos",
    "day_of_week_sin",
    "day_of_week_cos",
    "month_sin",
    "month_cos",

    "energy_kwh",

    "energy_lag_1h",
    "energy_lag_24h",
    "energy_lag_168h",

    "energy_rolling_mean_24h",
    "energy_rolling_std_24h",
    "energy_rolling_mean_168h",

    "energy_change_1h",
    "energy_abs_change_1h",

    "energy_change_24h",
    "energy_abs_change_24h",

    "energy_change_168h",
    "energy_abs_change_168h",

    "energy_ratio_1h",
    "energy_ratio_24h",
    "energy_ratio_168h",

    "energy_per_sqm",
    "lag_24h_per_sqm",

    "deviation_from_24h_mean",
    "absolute_deviation_24h",

    "deviation_from_168h_mean",
    "absolute_deviation_168h",

    "energy_max_24h",
    "energy_min_24h",

    "energy_max_168h",
    "energy_min_168h",

    "energy_std_6h",
    "energy_std_24h",
]


CATEGORICAL_FEATURES = [
    "primaryspaceusage",
    "site_id",
]


TARGET = "target_next_hour_energy"


ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


# =========================================================
# HEADER
# =========================================================

print("=" * 55)
print(" EcoBuild AI - Energy Prediction Model V3")
print(" Full Test Evaluation")
print("=" * 55)


# =========================================================
# CHECK FILES
# =========================================================

if not os.path.exists(FEATURE_FILE):
    raise FileNotFoundError(
        f"\nFeature file not found:\n{FEATURE_FILE}"
    )


if not os.path.exists(MODEL_FILE):
    raise FileNotFoundError(
        f"\nModel file not found:\n{MODEL_FILE}"
    )


# =========================================================
# 1. LOAD MODEL
# =========================================================

print("\n[1/5] Loading V3 model...")

model_bundle = joblib.load(MODEL_FILE)

print(f"Loaded object type: {type(model_bundle)}")


# ---------------------------------------------------------
# V3 training script saves a dictionary.
# Extract the actual trained model.
# ---------------------------------------------------------

if isinstance(model_bundle, dict):

    print("Model bundle detected.")

    if "model" in model_bundle:
        model = model_bundle["model"]

    elif "regressor" in model_bundle:
        model = model_bundle["regressor"]

    elif "estimator" in model_bundle:
        model = model_bundle["estimator"]

    else:
        raise KeyError(
            "\nCould not find trained model inside joblib dictionary.\n"
            f"Available keys: {list(model_bundle.keys())}"
        )

else:

    model = model_bundle


print(f"Actual model type: {type(model)}")
print("Model loaded successfully. ✅")


# =========================================================
# 2. CONNECT DUCKDB
# =========================================================

print("\n[2/5] Preparing DuckDB...")

con = duckdb.connect()

# Keep memory usage controlled.
con.execute("SET memory_limit='2GB'")
con.execute("SET threads=2")

print("DuckDB ready. ✅")


# =========================================================
# CATEGORY MAPPINGS
# =========================================================

print("\nPreparing categorical mappings...")


category_query = f"""
SELECT
    COALESCE(primaryspaceusage, 'Unknown') AS primaryspaceusage,
    CAST(site_id AS VARCHAR) AS site_id
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp < TIMESTAMP '2017-06-30'
"""


category_df = con.execute(category_query).fetchdf()


# Building type categories

usage_categories = sorted(
    category_df["primaryspaceusage"]
    .astype(str)
    .unique()
)


# Site categories

site_categories = sorted(
    category_df["site_id"]
    .astype(str)
    .unique()
)


# Create integer mappings.
# 0 = unknown/unseen category.

usage_map = {
    value: index + 1
    for index, value in enumerate(usage_categories)
}


site_map = {
    value: index + 1
    for index, value in enumerate(site_categories)
}


print(
    f"Building-type categories: {len(usage_map)}"
)

print(
    f"Site categories         : {len(site_map)}"
)


# =========================================================
# 3. COUNT FULL TEST DATA
# =========================================================

print("\n[3/5] Checking full test dataset...")


count_query = f"""
SELECT COUNT(*)
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp >= TIMESTAMP '2017-07-01'
"""


total_rows = con.execute(count_query).fetchone()[0]


print(
    f"Full test rows: {total_rows:,}"
)


# =========================================================
# 4. BATCH PREDICTION
# =========================================================

print("\n[4/5] Running batch predictions...")


columns_sql = ", ".join(ALL_FEATURES + [TARGET])


query = f"""
SELECT
    {columns_sql}
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp >= TIMESTAMP '2017-07-01'
ORDER BY timestamp
"""


cursor = con.execute(query)


# Instead of storing all 6.3M predictions,
# store only the values needed for final metrics.

all_actual = []
all_predicted = []


processed = 0


while True:

    # -----------------------------------------------------
    # Fetch batch
    # -----------------------------------------------------

    rows = cursor.fetchmany(BATCH_SIZE)


    if not rows:
        break


    # -----------------------------------------------------
    # Convert rows -> DataFrame
    # -----------------------------------------------------

    df = pd.DataFrame(
        rows,
        columns=ALL_FEATURES + [TARGET]
    )


    # -----------------------------------------------------
    # Encode building type
    # -----------------------------------------------------

    df["primaryspaceusage"] = (
        df["primaryspaceusage"]
        .fillna("Unknown")
        .astype(str)
        .map(usage_map)
        .fillna(0)
        .astype(np.int16)
    )


    # -----------------------------------------------------
    # Encode site
    # -----------------------------------------------------

    df["site_id"] = (
        df["site_id"]
        .astype(str)
        .map(site_map)
        .fillna(0)
        .astype(np.int16)
    )


    # -----------------------------------------------------
    # Prepare X
    # -----------------------------------------------------

    X = df[
        NUMERIC_FEATURES +
        CATEGORICAL_FEATURES
    ].copy()


    # Replace infinity

    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )


    # Replace missing values

    X = X.fillna(0)


    # Convert to float32
    # Helps keep RAM usage low.

    X = X.astype(np.float32)


    # -----------------------------------------------------
    # Prepare target
    # -----------------------------------------------------

    y = (
        df[TARGET]
        .astype(np.float32)
        .values
    )


    # -----------------------------------------------------
    # Prediction
    # -----------------------------------------------------

    predictions = model.predict(X)


    # Energy cannot be negative.

    predictions = np.maximum(
        predictions,
        0
    )


    # -----------------------------------------------------
    # Store results
    # -----------------------------------------------------

    all_actual.extend(y)

    all_predicted.extend(predictions)


    processed += len(df)


    # -----------------------------------------------------
    # Progress
    # -----------------------------------------------------

    if (
        processed % 500_000 < BATCH_SIZE
        or processed == total_rows
    ):

        percentage = (
            processed /
            total_rows
        ) * 100

        print(
            f"Processed: "
            f"{processed:,} / "
            f"{total_rows:,} "
            f"({percentage:.1f}%)"
        )


# =========================================================
# 5. FINAL EVALUATION
# =========================================================

print("\n[5/5] Calculating final metrics...")


y_true = np.asarray(
    all_actual,
    dtype=np.float32
)


y_pred = np.asarray(
    all_predicted,
    dtype=np.float32
)


# ---------------------------------------------------------
# Metrics
# ---------------------------------------------------------

mae = mean_absolute_error(
    y_true,
    y_pred
)


rmse = np.sqrt(
    mean_squared_error(
        y_true,
        y_pred
    )
)


r2 = r2_score(
    y_true,
    y_pred
)


# ---------------------------------------------------------
# Absolute error
# ---------------------------------------------------------

absolute_error = np.abs(
    y_true - y_pred
)


# =========================================================
# RESULTS
# =========================================================

print("\n" + "=" * 55)
print(" V3 FULL TEST RESULTS")
print("=" * 55)


print(
    f"Test rows : {len(y_true):,}"
)


print(
    f"MAE       : {mae:.4f} kWh"
)


print(
    f"RMSE      : {rmse:.4f} kWh"
)


print(
    f"R²        : {r2:.4f}"
)


# =========================================================
# ERROR PERCENTILES
# =========================================================

print("\nError Percentiles")
print("-" * 40)


percentiles = [50, 75, 90, 95, 99]


percentile_values = {}


for percentile in percentiles:

    value = np.percentile(
        absolute_error,
        percentile
    )

    percentile_values[percentile] = value

    print(
        f"{percentile}th percentile : "
        f"{value:.4f} kWh"
    )


# =========================================================
# ERROR DISTRIBUTION
# =========================================================

print("\nError Distribution")
print("-" * 40)


ranges = [
    ("0-2", 0, 2),
    ("2-5", 2, 5),
    ("5-10", 5, 10),
    ("10-25", 10, 25),
    ("25-50", 25, 50),
    ("50-100", 50, 100),
    ("100-500", 100, 500),
    ("500+", 500, np.inf),
]


for name, low, high in ranges:

    count = np.sum(
        (absolute_error >= low) &
        (absolute_error < high)
    )


    percentage = (
        count /
        len(absolute_error)
    ) * 100


    print(
        f"{name:>8} kWh : "
        f"{count:>10,} "
        f"({percentage:6.2f}%)"
    )


# =========================================================
# SAVE RESULTS
# =========================================================

summary = pd.DataFrame(
    {
        "metric": [
            "test_rows",
            "MAE_kWh",
            "RMSE_kWh",
            "R2",
            "error_p50",
            "error_p75",
            "error_p90",
            "error_p95",
            "error_p99",
        ],

        "value": [
            len(y_true),
            mae,
            rmse,
            r2,
            percentile_values[50],
            percentile_values[75],
            percentile_values[90],
            percentile_values[95],
            percentile_values[99],
        ],
    }
)


summary.to_csv(
    OUTPUT_FILE,
    index=False
)


# =========================================================
# FINAL
# =========================================================

print("\nEvaluation saved:")
print(OUTPUT_FILE)


print("\n" + "=" * 55)
print(" V3 FULL EVALUATION COMPLETED! 🚀")
print("=" * 55)