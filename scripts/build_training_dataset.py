import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# EcoBuild AI
# STEP 13
# BDG2 ENERGY FEATURE ENGINEERING
# ============================================================

INPUT_FILE = Path(
    "data/raw/bdg2_sample.csv"
)

OUTPUT_FILE = Path(
    "data/processed/bdg2_features.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_dataset():

    print("\nLoading BDG2 dataset...")

    df = pd.read_csv(
        INPUT_FILE
    )

    print(
        f"Rows: {len(df):,}"
    )

    print(
        f"Columns: {len(df.columns)}"
    )

    return df


# ============================================================
# BASIC CLEANING
# ============================================================

def clean_dataset(df):

    df = df.copy()

    # Convert timestamp
    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce"
    )

    # Remove invalid timestamps
    df = df.dropna(
        subset=["timestamp"]
    )

    # Sort chronologically
    df = df.sort_values(
        "timestamp"
    )

    # Remove duplicate timestamps
    df = df.drop_duplicates(
        subset=["timestamp"]
    )

    return df


# ============================================================
# TIME FEATURES
# ============================================================

def create_time_features(df):

    df["hour"] = (
        df["timestamp"]
        .dt.hour
    )

    df["day_of_week"] = (
        df["timestamp"]
        .dt.dayofweek
    )

    df["day_of_month"] = (
        df["timestamp"]
        .dt.day
    )

    df["month"] = (
        df["timestamp"]
        .dt.month
    )

    df["week_of_year"] = (
        df["timestamp"]
        .dt.isocalendar()
        .week
        .astype(int)
    )

    df["is_weekend"] = (
        df["day_of_week"] >= 5
    ).astype(int)

    # Cyclic time encoding

    df["hour_sin"] = np.sin(
        2 * np.pi * df["hour"] / 24
    )

    df["hour_cos"] = np.cos(
        2 * np.pi * df["hour"] / 24
    )

    df["day_sin"] = np.sin(
        2 * np.pi * df["day_of_week"] / 7
    )

    df["day_cos"] = np.cos(
        2 * np.pi * df["day_of_week"] / 7
    )

    return df


# ============================================================
# BUILDING ENERGY FEATURES
# ============================================================

def create_building_features(
    df,
    building_column
):

    prefix = building_column

    # Rename original reading
    df[
        f"{prefix}_energy"
    ] = pd.to_numeric(
        df[building_column],
        errors="coerce"
    )

    # Negative values are not useful
    df[
        f"{prefix}_energy"
    ] = df[
        f"{prefix}_energy"
    ].clip(
        lower=0
    )

    # --------------------------------------------------------
    # LAG FEATURES
    # --------------------------------------------------------

    df[
        f"{prefix}_lag_1h"
    ] = df[
        f"{prefix}_energy"
    ].shift(1)

    df[
        f"{prefix}_lag_24h"
    ] = df[
        f"{prefix}_energy"
    ].shift(24)

    df[
        f"{prefix}_lag_168h"
    ] = df[
        f"{prefix}_energy"
    ].shift(168)

    # --------------------------------------------------------
    # ROLLING FEATURES
    # --------------------------------------------------------

    df[
        f"{prefix}_rolling_mean_24h"
    ] = df[
        f"{prefix}_energy"
    ].rolling(
        window=24
    ).mean()

    df[
        f"{prefix}_rolling_std_24h"
    ] = df[
        f"{prefix}_energy"
    ].rolling(
        window=24
    ).std()

    # --------------------------------------------------------
    # DAILY RANGE
    # --------------------------------------------------------

    df[
        f"{prefix}_rolling_min_24h"
    ] = df[
        f"{prefix}_energy"
    ].rolling(
        window=24
    ).min()

    df[
        f"{prefix}_rolling_max_24h"
    ] = df[
        f"{prefix}_energy"
    ].rolling(
        window=24
    ).max()

    return df


# ============================================================
# BUILDING DIFFERENCE
# ============================================================

def create_city_energy_features(df):

    df["total_energy"] = (

        df["building_1_energy"]

        +

        df["building_2_energy"]

    )

    df["building_energy_difference"] = (

        df["building_1_energy"]

        -

        df["building_2_energy"]

    ).abs()

    return df


# ============================================================
# CO2 ESTIMATION
# ============================================================

def create_co2_feature(df):

    # Reference electricity emission factor.
    #
    # This is a modelling factor.
    # It can later be replaced by a year-specific
    # official factor from CEA.

    GRID_CO2_FACTOR = 0.71

    df["estimated_co2_kg"] = (

        df["total_energy"]

        * GRID_CO2_FACTOR

    )

    return df


# ============================================================
# REMOVE MISSING VALUES
# ============================================================

def clean_ml_rows(df):

    print(
        "\nRows before ML cleaning:",
        len(df)
    )

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # Lag features create NaN
    # during the first 168 hours.

    df = df.dropna()

    print(
        "Rows after ML cleaning:",
        len(df)
    )

    return df


# ============================================================
# SAVE
# ============================================================

def save_dataset(df):

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        "\nSaved processed dataset:"
    )

    print(
        OUTPUT_FILE
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("\n")
    print("=" * 65)
    print("        ECOBUILD AI")
    print("        STEP 13")
    print("        ENERGY FEATURE ENGINEERING")
    print("=" * 65)

    # 1. Load
    df = load_dataset()

    # 2. Clean
    df = clean_dataset(df)

    # 3. Time features
    df = create_time_features(df)

    # 4. Building features
    df = create_building_features(
        df,
        "building_1"
    )

    df = create_building_features(
        df,
        "building_2"
    )

    # 5. City energy
    df = create_city_energy_features(
        df
    )

    # 6. CO2
    df = create_co2_feature(
        df
    )

    # 7. ML cleaning
    df = clean_ml_rows(
        df
    )

    # 8. Save
    save_dataset(
        df
    )

    print("\nFinal shape:")
    print(
        df.shape
    )

    print("\nFinal columns:")

    for column in df.columns:
        print(
            f"  - {column}"
        )

    print("\nSample:")
    print(
        df.head()
        .to_string()
    )

    print("\n")
    print("=" * 65)
    print("STEP 13 ENERGY PIPELINE COMPLETED")
    print("=" * 65)


if __name__ == "__main__":
    main()