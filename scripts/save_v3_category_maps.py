import json
from pathlib import Path

import duckdb
import pandas as pd


# ============================================================
# EcoBuild AI
# Save exact V3 categorical mappings
# ============================================================

FEATURE_FILE = Path(
    "data/processed/bdg2_v3_features.parquet"
)

OUTPUT_FILE = Path(
    "data/processed/v3_category_maps.json"
)

MAX_TRAIN_ROWS = 800_000


categorical_features = [
    "primaryspaceusage",
    "site_id",
]


print("\n==============================================")
print(" EcoBuild AI - V3 Category Mapping")
print("==============================================\n")


# ------------------------------------------------------------
# Connect to DuckDB
# ------------------------------------------------------------

con = duckdb.connect()

con.execute("SET memory_limit='2GB'")
con.execute("SET threads=2")


# ------------------------------------------------------------
# Use EXACT same training sample
# ------------------------------------------------------------

query = f"""
SELECT
    primaryspaceusage,
    site_id
FROM read_parquet('{FEATURE_FILE}')
WHERE timestamp < TIMESTAMP '2017-06-30'
USING SAMPLE reservoir({MAX_TRAIN_ROWS} ROWS)
REPEATABLE (42)
"""


print("[1/3] Loading exact V3 training sample...")

train_df = con.execute(query).fetchdf()

con.close()

print(
    f"Training rows loaded: {len(train_df):,}"
)


# ------------------------------------------------------------
# Build mappings
# ------------------------------------------------------------

category_maps = {}


print("\n[2/3] Building category mappings...")


for column in categorical_features:

    values = (
        train_df[column]
        .fillna("Unknown")
        .astype("category")
    )

    categories = values.cat.categories

    mapping = {
        str(value): index + 1
        for index, value in enumerate(categories)
    }

    category_maps[column] = mapping

    print(f"\n{column}:")
    print(f"Categories: {len(mapping)}")

    for key, value in mapping.items():
        print(f"  {key} -> {value}")


# ------------------------------------------------------------
# Save
# ------------------------------------------------------------

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)


with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        category_maps,
        file,
        indent=2,
        ensure_ascii=False,
    )


print("\n[3/3] Mapping saved successfully.")

print(
    f"\nFile:\n{OUTPUT_FILE}"
)

print("\nDone.")