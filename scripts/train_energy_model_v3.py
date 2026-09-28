import duckdb
import joblib
import numpy as np
import pandas as pd

from pathlib import Path

from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


# ============================================================
# EcoBuild AI
# Energy Prediction Model V3
# MEMORY-SAFE TRAINING VERSION
# ============================================================

print("\n==============================================")
print(" EcoBuild AI - Energy Prediction Model V3")
print(" Memory-Safe Training")
print("==============================================\n")


FEATURE_FILE = Path(
    "data/processed/bdg2_v3_features.parquet"
)

MODEL_FILE = Path(
    "data/processed/energy_model_v3.joblib"
)


# ------------------------------------------------------------
# Features
# ------------------------------------------------------------

numeric_features = [
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


categorical_features = [
    "primaryspaceusage",
    "site_id",
]


target = "target_next_hour_energy"


all_features = (
    numeric_features
    + categorical_features
    + [target]
)


# ------------------------------------------------------------
# Memory-safe sampling
# ------------------------------------------------------------

MAX_TRAIN_ROWS = 800_000
MAX_TEST_ROWS = 200_000


# ------------------------------------------------------------
# 1. Connect
# ------------------------------------------------------------

print("[1/6] Connecting to DuckDB...")

con = duckdb.connect()

# Keep DuckDB from aggressively using all system RAM.
con.execute("SET memory_limit='2GB'")
con.execute("SET threads=2")


columns_sql = ", ".join(all_features)


# ------------------------------------------------------------
# 2. Training data
# ------------------------------------------------------------

print("\n[2/6] Loading sampled training data...")

train_query = f"""
SELECT
    {columns_sql}
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp < TIMESTAMP '2017-06-30'
USING SAMPLE reservoir({MAX_TRAIN_ROWS} ROWS)
REPEATABLE (42)
"""

train_df = con.execute(
    train_query
).fetchdf()

print(
    f"Training rows: {len(train_df):,}"
)


# ------------------------------------------------------------
# 3. Test data
# ------------------------------------------------------------

print("\n[3/6] Loading sampled test data...")

test_query = f"""
SELECT
    {columns_sql}
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp >= TIMESTAMP '2017-07-01'
USING SAMPLE reservoir({MAX_TEST_ROWS} ROWS)
REPEATABLE (42)
"""

test_df = con.execute(
    test_query
).fetchdf()

print(
    f"Test rows: {len(test_df):,}"
)


con.close()


# ------------------------------------------------------------
# 4. Prepare categorical features
# ------------------------------------------------------------

print("\n[4/6] Preparing features...")


# We use integer category codes instead of one-hot encoding.
# This saves a large amount of RAM.

for column in categorical_features:

    train_df[column] = (
        train_df[column]
        .fillna("Unknown")
        .astype("category")
    )

    categories = train_df[column].cat.categories

    train_df[column] = (
        train_df[column]
        .cat.codes
        .astype(np.int16)
        + 1
    )

    # Map test categories to training categories.
    test_values = (
        test_df[column]
        .fillna("Unknown")
        .astype(str)
    )

    category_map = {
        str(value): index + 1
        for index, value in enumerate(categories)
    }

    test_df[column] = (
        test_values
        .map(category_map)
        .fillna(0)
        .astype(np.int16)
    )


# ------------------------------------------------------------
# Numeric preparation
# ------------------------------------------------------------

for column in numeric_features:

    train_df[column] = (
        pd.to_numeric(
            train_df[column],
            errors="coerce"
        )
        .replace([np.inf, -np.inf], np.nan)
    )

    test_df[column] = (
        pd.to_numeric(
            test_df[column],
            errors="coerce"
        )
        .replace([np.inf, -np.inf], np.nan)
    )

    median_value = train_df[column].median()

    train_df[column] = (
        train_df[column]
        .fillna(median_value)
        .astype(np.float32)
    )

    test_df[column] = (
        test_df[column]
        .fillna(median_value)
        .astype(np.float32)
    )


# ------------------------------------------------------------
# Build compact NumPy matrices
# ------------------------------------------------------------

X_train = train_df[
    numeric_features + categorical_features
].to_numpy(
    dtype=np.float32
)

X_test = test_df[
    numeric_features + categorical_features
].to_numpy(
    dtype=np.float32
)

y_train = train_df[target].to_numpy(
    dtype=np.float32
)

y_test = test_df[target].to_numpy(
    dtype=np.float32
)


print(
    f"\nTraining matrix: {X_train.shape}"
)

print(
    f"Test matrix    : {X_test.shape}"
)


# ------------------------------------------------------------
# Free DataFrames
# ------------------------------------------------------------

del train_df
del test_df


# ------------------------------------------------------------
# Categorical feature indices
# ------------------------------------------------------------

categorical_indices = [
    len(numeric_features),
    len(numeric_features) + 1,
]


# ------------------------------------------------------------
# 5. Train
# ------------------------------------------------------------

print("\n[5/6] Training V3 model...")

model = HistGradientBoostingRegressor(
    max_iter=300,
    learning_rate=0.07,
    max_leaf_nodes=31,
    l2_regularization=1.0,
    random_state=42,
    categorical_features=categorical_indices,
)


model.fit(
    X_train,
    y_train
)

print("Model training completed. ✅")


# ------------------------------------------------------------
# 6. Evaluation
# ------------------------------------------------------------

print("\n[6/6] Evaluating V3 model...")

y_pred = model.predict(
    X_test
)


mae = mean_absolute_error(
    y_test,
    y_pred
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        y_pred
    )
)

r2 = r2_score(
    y_test,
    y_pred
)


print("\n==============================================")
print(" MODEL V3 RESULTS")
print("==============================================")

print(
    f"MAE  : {mae:.4f} kWh"
)

print(
    f"RMSE : {rmse:.4f} kWh"
)

print(
    f"R²   : {r2:.4f}"
)


# ------------------------------------------------------------
# Save model
# ------------------------------------------------------------

artifact = {
    "model": model,

    "numeric_features": numeric_features,
    "categorical_features": categorical_features,

    "categorical_indices": categorical_indices,

    "target": target,

    "model_version": "V3",

    "train_start": "2016-01-08",
    "train_end": "2017-06-29",

    "test_start": "2017-07-01",

    "training_rows": int(len(X_train)),
    "test_rows": int(len(X_test)),

    "metrics": {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
    },
}


joblib.dump(
    artifact,
    MODEL_FILE
)


print("\nModel saved:")
print(MODEL_FILE)


print("\n==============================================")
print(" MODEL V3 COMPLETED! 🚀")
print("==============================================\n")