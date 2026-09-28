import os
import pandas as pd


# ============================================================
# PATHS
# ============================================================

ELECTRICITY_FILE = (
    "data/raw/bdg2_source/data/meters/cleaned/electricity_cleaned.csv"
)

METADATA_FILE = (
    "data/raw/bdg2_source/data/metadata/metadata.csv"
)

OUTPUT_FILE = (
    "data/processed/bdg2_energy_long.csv"
)

CHUNK_SIZE = 5000


# ============================================================
# LOAD METADATA
# ============================================================

print("\n[1/5] Loading building metadata...")

metadata = pd.read_csv(
    METADATA_FILE,
    usecols=[
        "building_id",
        "site_id",
        "primaryspaceusage",
        "sqm",
    ],
)

metadata["building_id"] = metadata["building_id"].astype(str)

print(f"Metadata buildings: {len(metadata):,}")


# ============================================================
# FIND MATCHED BUILDINGS
# ============================================================

print("\n[2/5] Checking electricity building columns...")

header = pd.read_csv(
    ELECTRICITY_FILE,
    nrows=0,
)

electricity_columns = header.columns.tolist()

building_columns = electricity_columns[1:]

metadata_ids = set(metadata["building_id"])

matched_buildings = [
    column
    for column in building_columns
    if column in metadata_ids
]

print(f"Electricity building columns: {len(building_columns):,}")
print(f"Matched buildings: {len(matched_buildings):,}")

if not matched_buildings:
    raise RuntimeError(
        "No building IDs matched between electricity data and metadata."
    )


# ============================================================
# READ ELECTRICITY DATA IN CHUNKS
# ============================================================

print("\n[3/5] Processing hourly electricity data...")

usecols = ["timestamp"] + matched_buildings

first_chunk = True
total_rows = 0
total_long_rows = 0

# Remove old output if it exists
if os.path.exists(OUTPUT_FILE):
    os.remove(OUTPUT_FILE)

for chunk_number, chunk in enumerate(
    pd.read_csv(
        ELECTRICITY_FILE,
        usecols=usecols,
        chunksize=CHUNK_SIZE,
    ),
    start=1,
):

    print(f"Processing chunk {chunk_number}...")

    # Convert timestamp
    chunk["timestamp"] = pd.to_datetime(
        chunk["timestamp"],
        errors="coerce",
    )

    # Convert wide format to long format
    long_chunk = chunk.melt(
        id_vars="timestamp",
        var_name="building_id",
        value_name="energy_kwh",
    )

    # Remove missing electricity readings
    long_chunk = long_chunk.dropna(
        subset=["energy_kwh"]
    )

    # Make sure building ID is string
    long_chunk["building_id"] = (
        long_chunk["building_id"].astype(str)
    )

    # Add metadata
    long_chunk = long_chunk.merge(
        metadata,
        on="building_id",
        how="left",
    )

    # Add time features
    long_chunk["hour"] = long_chunk["timestamp"].dt.hour
    long_chunk["day"] = long_chunk["timestamp"].dt.day
    long_chunk["month"] = long_chunk["timestamp"].dt.month
    long_chunk["year"] = long_chunk["timestamp"].dt.year
    long_chunk["day_of_week"] = (
        long_chunk["timestamp"].dt.dayofweek
    )

    long_chunk["is_weekend"] = (
        long_chunk["day_of_week"] >= 5
    ).astype(int)

    # Save incrementally
    long_chunk.to_csv(
        OUTPUT_FILE,
        mode="w" if first_chunk else "a",
        header=first_chunk,
        index=False,
    )

    first_chunk = False

    total_rows += len(chunk)
    total_long_rows += len(long_chunk)

    print(
        f"  Source rows: {total_rows:,} | "
        f"Output rows: {total_long_rows:,}"
    )


# ============================================================
# FINISHED
# ============================================================

print("\n[4/5] Processing completed.")

print("\n[5/5] Output information:")

print(f"Output file: {OUTPUT_FILE}")
print(f"Output rows: {total_long_rows:,}")

if os.path.exists(OUTPUT_FILE):
    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)

    print(f"Output size: {size_mb:.2f} MB")

print("\nDone! ✅")