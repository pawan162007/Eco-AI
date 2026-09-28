import duckdb
import os
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


INPUT_FILE = "data/processed/bdg2_ml_features.parquet"
MODEL_FILE = "data/processed/energy_model.joblib"

TRAIN_END = "2017-06-30"
TEST_START = "2017-07-01"

MAX_TRAIN_ROWS = 2_000_000
MAX_TEST_ROWS = 500_000


print("\n==============================================")
print(" EcoBuild AI - Energy Prediction Model")
print("==============================================")


# ------------------------------------------------------------
# Load data using DuckDB
# ------------------------------------------------------------

con = duckdb.connect()

con.execute("SET memory_limit='4GB';")
con.execute("SET threads=4;")

print("\n[1/5] Loading training data...")


feature_columns = [
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
]

categorical_columns = [
    "primaryspaceusage",
    "site_id",
]

target_column = "target_next_hour_energy"


# ------------------------------------------------------------
# Get training data
# ------------------------------------------------------------

train_query = f"""
SELECT
    {", ".join(feature_columns)},
    {", ".join(categorical_columns)},
    {target_column}
FROM read_parquet('{INPUT_FILE}')
WHERE timestamp < '{TRAIN_END}'
  AND target_next_hour_energy IS NOT NULL
USING SAMPLE reservoir({MAX_TRAIN_ROWS} ROWS)
"""

train_df = con.execute(train_query).df()

print("Training rows:", f"{len(train_df):,}")


# ------------------------------------------------------------
# Get test data
# ------------------------------------------------------------

print("\n[2/5] Loading test data...")

test_query = f"""
SELECT
    {", ".join(feature_columns)},
    {", ".join(categorical_columns)},
    {target_column}
FROM read_parquet('{INPUT_FILE}')
WHERE timestamp >= '{TEST_START}'
  AND target_next_hour_energy IS NOT NULL
USING SAMPLE reservoir({MAX_TEST_ROWS} ROWS)
"""

test_df = con.execute(test_query).df()

print("Test rows:", f"{len(test_df):,}")


# ------------------------------------------------------------
# Prepare X / y
# ------------------------------------------------------------

print("\n[3/5] Preparing features...")

X_train = train_df[feature_columns + categorical_columns]
y_train = train_df[target_column]

X_test = test_df[feature_columns + categorical_columns]
y_test = test_df[target_column]


# ------------------------------------------------------------
# Preprocessing
# ------------------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False,
            ),
            categorical_columns,
        ),
    ],
    remainder="passthrough",
)


print("Encoding categorical features...")

X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)


# ------------------------------------------------------------
# Model
# ------------------------------------------------------------

print("\n[4/5] Training model...")

model = HistGradientBoostingRegressor(
    max_iter=300,
    learning_rate=0.08,
    max_leaf_nodes=31,
    l2_regularization=1.0,
    random_state=42,
)

model.fit(
    X_train_processed,
    y_train,
)

print("Model training completed. ✅")


# ------------------------------------------------------------
# Evaluation
# ------------------------------------------------------------

print("\n[5/5] Evaluating model...")

predictions = model.predict(X_test_processed)

mae = mean_absolute_error(
    y_test,
    predictions,
)

rmse = mean_squared_error(
    y_test,
    predictions,
) ** 0.5

r2 = r2_score(
    y_test,
    predictions,
)


print("\n==============================================")
print(" MODEL RESULTS")
print("==============================================")

print(f"MAE  : {mae:.4f} kWh")
print(f"RMSE : {rmse:.4f} kWh")
print(f"R²   : {r2:.4f}")


# ------------------------------------------------------------
# Save model
# ------------------------------------------------------------

artifact = {
    "model": model,
    "preprocessor": preprocessor,
    "features": feature_columns,
    "categorical_features": categorical_columns,
}

joblib.dump(
    artifact,
    MODEL_FILE,
)

print("\nModel saved:")
print(MODEL_FILE)

print("\nTraining pipeline completed! 🚀")

con.close()