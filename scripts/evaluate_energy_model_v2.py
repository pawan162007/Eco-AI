import duckdb
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# EcoBuild AI - Energy Prediction Model V2
# Detailed Error Analysis
# ============================================================

print("\n==============================================")
print(" EcoBuild AI - Energy Model V2 Error Analysis")
print("==============================================\n")


FEATURE_FILE = Path(
    "data/processed/bdg2_exact_features.parquet"
)

MODEL_FILE = Path(
    "data/processed/energy_model_v2.joblib"
)

OUTPUT_FILE = Path(
    "data/processed/model_v2_error_analysis.csv"
)


# ------------------------------------------------------------
# 1. Load model
# ------------------------------------------------------------

print("[1/5] Loading trained V2 model...")

artifact = joblib.load(MODEL_FILE)

model = artifact["model"]
preprocessor = artifact["preprocessor"]

numeric_features = artifact["numeric_features"]
categorical_features = artifact["categorical_features"]

target = artifact["target"]

print("Model loaded successfully. ✅")


# ------------------------------------------------------------
# 2. Load test data
# ------------------------------------------------------------

print("\n[2/5] Loading test data...")

con = duckdb.connect()

# First get the actual columns from the V2 parquet file
schema = con.execute(
    f"DESCRIBE SELECT * FROM read_parquet('{FEATURE_FILE}')"
).fetchdf()

available_columns = schema["column_name"].tolist()

print("\nAvailable feature columns:")
print(", ".join(available_columns))


# ------------------------------------------------------------
# Build query using columns actually present
# ------------------------------------------------------------

required_columns = [
    "timestamp",
    "building_id",
    "primaryspaceusage",
    "site_id",
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
    "target_next_hour_energy",
]

# Check missing columns
missing_columns = [
    col
    for col in required_columns
    if col not in available_columns
]

if missing_columns:

    print("\n❌ Missing columns in feature file:")

    for col in missing_columns:
        print(f"   - {col}")

    print("\nThe model feature file uses a different column name.")
    print("Please check the schema above.")

    con.close()
    raise SystemExit(1)


column_sql = ",\n    ".join(required_columns)

test_query = f"""
SELECT
    {column_sql}
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp >= TIMESTAMP '2017-07-01'
"""

df = con.execute(test_query).fetchdf()

con.close()

print(
    f"\nTest rows loaded: {len(df):,}"
)


# ------------------------------------------------------------
# 3. Prepare features
# ------------------------------------------------------------

print("\n[3/5] Preparing features...")

X = df[
    numeric_features + categorical_features
].copy()

y_actual = df[target].values

print("Generating predictions...")

X_transformed = preprocessor.transform(X)

y_pred = model.predict(X_transformed)

df["actual"] = y_actual
df["predicted"] = y_pred

df["absolute_error"] = np.abs(
    df["actual"] - df["predicted"]
)

df["squared_error"] = (
    df["actual"] - df["predicted"]
) ** 2


# ------------------------------------------------------------
# 4. Overall metrics
# ------------------------------------------------------------

print("\n[4/5] Calculating overall metrics...")

mae = mean_absolute_error(
    df["actual"],
    df["predicted"]
)

rmse = np.sqrt(
    mean_squared_error(
        df["actual"],
        df["predicted"]
    )
)

r2 = r2_score(
    df["actual"],
    df["predicted"]
)


print("\n==============================================")
print(" V2 OVERALL RESULTS")
print("==============================================")

print(f"MAE  : {mae:.4f} kWh")
print(f"RMSE : {rmse:.4f} kWh")
print(f"R²   : {r2:.4f}")


# ------------------------------------------------------------
# Error percentiles
# ------------------------------------------------------------

print("\n==============================================")
print(" ERROR PERCENTILES")
print("==============================================")

percentiles = [50, 75, 90, 95, 99]

for p in percentiles:

    value = np.percentile(
        df["absolute_error"],
        p
    )

    print(
        f"{p:>2}th percentile : "
        f"{value:.4f} kWh"
    )


# ------------------------------------------------------------
# Error by building type
# ------------------------------------------------------------

print("\n==============================================")
print(" ERROR BY BUILDING TYPE")
print("==============================================")

error_by_type = (
    df.groupby(
        "primaryspaceusage",
        dropna=False
    )
    .agg(
        records=("actual", "size"),

        mae=("absolute_error", "mean"),

        rmse=(
            "squared_error",
            lambda x: np.sqrt(x.mean())
        ),

        actual_mean=("actual", "mean"),

        predicted_mean=("predicted", "mean")
    )
    .sort_values(
        "mae",
        ascending=False
    )
)

print(
    error_by_type.to_string()
)


# ------------------------------------------------------------
# Largest individual errors
# ------------------------------------------------------------

print("\n==============================================")
print(" TOP 20 LARGEST ERRORS")
print("==============================================")

largest_errors = (
    df[
        [
            "timestamp",
            "building_id",
            "primaryspaceusage",
            "actual",
            "predicted",
            "absolute_error"
        ]
    ]
    .sort_values(
        "absolute_error",
        ascending=False
    )
    .head(20)
)

print(
    largest_errors.to_string(
        index=False
    )
)


# ------------------------------------------------------------
# Error distribution
# ------------------------------------------------------------

print("\n==============================================")
print(" ERROR DISTRIBUTION")
print("==============================================")

error_bins = [
    0,
    2,
    5,
    10,
    25,
    50,
    100,
    500,
    np.inf
]

error_labels = [
    "0-2 kWh",
    "2-5 kWh",
    "5-10 kWh",
    "10-25 kWh",
    "25-50 kWh",
    "50-100 kWh",
    "100-500 kWh",
    "500+ kWh"
]

df["error_bucket"] = pd.cut(
    df["absolute_error"],
    bins=error_bins,
    labels=error_labels,
    right=False
)

error_distribution = (
    df["error_bucket"]
    .value_counts(
        sort=False
    )
)

total = len(df)

for bucket, count in error_distribution.items():

    percentage = (
        count / total
    ) * 100

    print(
        f"{str(bucket):>12} : "
        f"{count:>8,} "
        f"({percentage:.2f}%)"
    )


# ------------------------------------------------------------
# Save detailed analysis
# ------------------------------------------------------------

print("\n[5/5] Saving detailed analysis...")

save_columns = [
    "timestamp",
    "building_id",
    "primaryspaceusage",
    "site_id",
    "sqm",
    "actual",
    "predicted",
    "absolute_error",
    "error_bucket"
]

df[
    save_columns
].to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nAnalysis saved:")
print(OUTPUT_FILE)


print("\n==============================================")
print(" V2 ERROR ANALYSIS COMPLETED! 🚀")
print("==============================================\n")