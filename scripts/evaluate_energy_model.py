import duckdb
import joblib
import numpy as np
import pandas as pd

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


INPUT_FILE = "data/processed/bdg2_ml_features.parquet"
MODEL_FILE = "data/processed/energy_model.joblib"


TRAIN_END = "2017-06-30"
TEST_START = "2017-07-01"

SAMPLE_ROWS = 500_000


print("\n==============================================")
print(" EcoBuild AI - Model Error Analysis")
print("==============================================")


# ------------------------------------------------------------
# Load model
# ------------------------------------------------------------

print("\n[1/5] Loading trained model...")

artifact = joblib.load(MODEL_FILE)

model = artifact["model"]
preprocessor = artifact["preprocessor"]

features = artifact["features"]
categorical_features = artifact["categorical_features"]

print("Model loaded successfully. ✅")


# ------------------------------------------------------------
# Load test data
# ------------------------------------------------------------

print("\n[2/5] Loading test sample...")

con = duckdb.connect()

query = f"""
SELECT
    timestamp,
    building_id,
    {", ".join(features)},
    {", ".join(categorical_features)},
    target_next_hour_energy
FROM read_parquet('{INPUT_FILE}')
WHERE timestamp >= '{TEST_START}'
  AND target_next_hour_energy IS NOT NULL
USING SAMPLE reservoir({SAMPLE_ROWS} ROWS)
"""

df = con.execute(query).df()

print("Test rows:", f"{len(df):,}")


# ------------------------------------------------------------
# Prediction
# ------------------------------------------------------------

print("\n[3/5] Generating predictions...")

X = df[features + categorical_features]
y = df["target_next_hour_energy"]

X_processed = preprocessor.transform(X)

predictions = model.predict(X_processed)

df["prediction"] = predictions

df["absolute_error"] = (
    df["target_next_hour_energy"] - df["prediction"]
).abs()

df["squared_error"] = (
    df["target_next_hour_energy"] - df["prediction"]
) ** 2


# ------------------------------------------------------------
# Overall metrics
# ------------------------------------------------------------

print("\n[4/5] Overall performance...")

mae = mean_absolute_error(
    y,
    predictions,
)

rmse = mean_squared_error(
    y,
    predictions,
) ** 0.5

r2 = r2_score(
    y,
    predictions,
)

print("\n----------------------------------------------")
print("OVERALL TEST PERFORMANCE")
print("----------------------------------------------")

print(f"MAE  : {mae:.4f} kWh")
print(f"RMSE : {rmse:.4f} kWh")
print(f"R²   : {r2:.4f}")


# ------------------------------------------------------------
# Error by building type
# ------------------------------------------------------------

print("\n----------------------------------------------")
print("ERROR BY BUILDING TYPE")
print("----------------------------------------------")

type_results = (
    df.groupby("primaryspaceusage")
    .agg(
        records=("target_next_hour_energy", "size"),
        mae=("absolute_error", "mean"),
        rmse=(
            "squared_error",
            lambda x: np.sqrt(x.mean()),
        ),
        actual_mean=(
            "target_next_hour_energy",
            "mean",
        ),
    )
    .sort_values("mae", ascending=False)
)

print(type_results.to_string())


# ------------------------------------------------------------
# Largest errors
# ------------------------------------------------------------

print("\n----------------------------------------------")
print("LARGEST PREDICTION ERRORS")
print("----------------------------------------------")

largest_errors = (
    df[
        [
            "timestamp",
            "building_id",
            "primaryspaceusage",
            "sqm",
            "target_next_hour_energy",
            "prediction",
            "absolute_error",
        ]
    ]
    .sort_values(
        "absolute_error",
        ascending=False,
    )
    .head(20)
)

print(
    largest_errors.to_string(
        index=False
    )
)


# ------------------------------------------------------------
# Error percentiles
# ------------------------------------------------------------

print("\n----------------------------------------------")
print("ABSOLUTE ERROR PERCENTILES")
print("----------------------------------------------")

percentiles = df["absolute_error"].quantile(
    [0.50, 0.75, 0.90, 0.95, 0.99]
)

for percentile, value in percentiles.items():
    print(
        f"{percentile * 100:.0f}% <= "
        f"{value:.4f} kWh"
    )


# ------------------------------------------------------------
# Save error analysis
# ------------------------------------------------------------

output_file = "data/processed/model_error_analysis.csv"

type_results.to_csv(output_file)

print("\n[5/5] Error analysis saved:")
print(output_file)

print("\n==============================================")
print(" Error analysis completed! ✅")
print("==============================================")


con.close()