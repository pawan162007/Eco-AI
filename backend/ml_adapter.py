from datetime import datetime
from math import cos, pi, sin


# ============================================================
# EcoBuild AI
# ML Adapter
#
# Converts an EcoBuild building into the feature structure
# expected by the trained BDG2 V3 energy model.
# ============================================================


# ------------------------------------------------------------
# Representative building profiles
# ------------------------------------------------------------

BUILDING_PROFILES = {

    "house": {
        "primaryspaceusage": "Lodging/residential",
        "sqm": 100.0,
        "base_energy": 25.0,
        "site_id": "Hog",
    },

    "office": {
        "primaryspaceusage": "Office",
        "sqm": 500.0,
        "base_energy": 120.0,
        "site_id": "Bear",
    },

    "school": {
        "primaryspaceusage": "Education",
        "sqm": 800.0,
        "base_energy": 100.0,
        "site_id": "Eagle",
    },

    "hospital": {
        "primaryspaceusage": "Healthcare",
        "sqm": 1000.0,
        "base_energy": 250.0,
        "site_id": "Wolf",
    },

    "factory": {
        "primaryspaceusage": "Manufacturing/industrial",
        "sqm": 1000.0,
        "base_energy": 300.0,
        "site_id": "Gator",
    },
}


# ------------------------------------------------------------
# Safe division
# ------------------------------------------------------------

def safe_divide(
    numerator,
    denominator,
):
    if denominator == 0:
        return 0.0

    return numerator / denominator


# ------------------------------------------------------------
# Cyclical time features
# ------------------------------------------------------------

def create_time_features(
    dt
):
    hour = dt.hour
    day = dt.day
    month = dt.month

    day_of_week = dt.weekday()

    is_weekend = (
        1
        if day_of_week >= 5
        else 0
    )

    hour_sin = sin(
        2 * pi * hour / 24
    )

    hour_cos = cos(
        2 * pi * hour / 24
    )

    day_of_week_sin = sin(
        2 * pi * day_of_week / 7
    )

    day_of_week_cos = cos(
        2 * pi * day_of_week / 7
    )

    month_sin = sin(
        2 * pi * month / 12
    )

    month_cos = cos(
        2 * pi * month / 12
    )

    return {
        "hour": hour,
        "day": day,
        "month": month,
        "year": dt.year,

        "day_of_week": day_of_week,
        "is_weekend": is_weekend,

        "hour_sin": hour_sin,
        "hour_cos": hour_cos,

        "day_of_week_sin": day_of_week_sin,
        "day_of_week_cos": day_of_week_cos,

        "month_sin": month_sin,
        "month_cos": month_cos,
    }


# ------------------------------------------------------------
# Build representative energy history
# ------------------------------------------------------------

def create_energy_history(
    current_energy
):
    """
    Creates a deterministic representative profile.

    These values are NOT measured building data.
    They are used only to provide the temporal feature
    structure required by the trained model.

    Actual BDG2 historical profiles can replace this
    layer in a later version.
    """

    energy_lag_1h = (
        current_energy * 0.98
    )

    energy_lag_24h = (
        current_energy * 0.95
    )

    energy_lag_168h = (
        current_energy * 0.92
    )

    energy_rolling_mean_24h = (
        current_energy * 0.96
    )

    energy_rolling_std_24h = (
        max(
            current_energy * 0.08,
            0.1,
        )
    )

    energy_rolling_mean_168h = (
        current_energy * 0.94
    )

    energy_change_1h = (
        current_energy
        - energy_lag_1h
    )

    energy_change_24h = (
        current_energy
        - energy_lag_24h
    )

    energy_change_168h = (
        current_energy
        - energy_lag_168h
    )

    energy_ratio_1h = safe_divide(
        current_energy,
        energy_lag_1h,
    )

    energy_ratio_24h = safe_divide(
        current_energy,
        energy_lag_24h,
    )

    energy_ratio_168h = safe_divide(
        current_energy,
        energy_lag_168h,
    )

    deviation_from_24h_mean = (
        current_energy
        - energy_rolling_mean_24h
    )

    deviation_from_168h_mean = (
        current_energy
        - energy_rolling_mean_168h
    )

    energy_max_24h = (
        current_energy * 1.15
    )

    energy_min_24h = (
        current_energy * 0.75
    )

    energy_max_168h = (
        current_energy * 1.20
    )

    energy_min_168h = (
        current_energy * 0.70
    )

    energy_std_6h = (
        max(
            current_energy * 0.06,
            0.1,
        )
    )

    energy_std_24h = (
        max(
            current_energy * 0.08,
            0.1,
        )
    )

    return {
        "energy_kwh": current_energy,

        "energy_lag_1h": energy_lag_1h,
        "energy_lag_24h": energy_lag_24h,
        "energy_lag_168h": energy_lag_168h,

        "energy_rolling_mean_24h":
            energy_rolling_mean_24h,

        "energy_rolling_std_24h":
            energy_rolling_std_24h,

        "energy_rolling_mean_168h":
            energy_rolling_mean_168h,

        "energy_change_1h":
            energy_change_1h,

        "energy_abs_change_1h":
            abs(energy_change_1h),

        "energy_change_24h":
            energy_change_24h,

        "energy_abs_change_24h":
            abs(energy_change_24h),

        "energy_change_168h":
            energy_change_168h,

        "energy_abs_change_168h":
            abs(energy_change_168h),

        "energy_ratio_1h":
            energy_ratio_1h,

        "energy_ratio_24h":
            energy_ratio_24h,

        "energy_ratio_168h":
            energy_ratio_168h,

        "energy_max_24h":
            energy_max_24h,

        "energy_min_24h":
            energy_min_24h,

        "energy_max_168h":
            energy_max_168h,

        "energy_min_168h":
            energy_min_168h,

        "energy_std_6h":
            energy_std_6h,

        "energy_std_24h":
            energy_std_24h,
    }


# ------------------------------------------------------------
# Main feature builder
# ------------------------------------------------------------

def build_ml_features(
    building_type,
    parameters=None,
    timestamp=None,
):
    """
    Convert an EcoBuild object into ML features.

    Parameters
    ----------
    building_type : str
        Example: office, school, hospital.

    parameters : dict
        Optional EcoBuild building parameters.

    timestamp : datetime
        Prediction timestamp.

    Returns
    -------
    dict
        Feature dictionary expected by the API/model.
    """

    if building_type not in BUILDING_PROFILES:

        raise ValueError(
            f"Unsupported ML building type: "
            f"{building_type}"
        )

    profile = BUILDING_PROFILES[
        building_type
    ]

    parameters = parameters or {}

    # --------------------------------------------------------
    # Building area
    # --------------------------------------------------------

    sqm = float(
        parameters.get(
            "area",
            profile["sqm"],
        )
    )

    sqm = max(
        sqm,
        1.0,
    )

    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    if timestamp is None:

        timestamp = datetime(
            2017,
            7,
            1,
            12,
        )

    time_features = create_time_features(
        timestamp
    )

    # --------------------------------------------------------
    # Base energy
    # --------------------------------------------------------

    area_factor = safe_divide(
        sqm,
        profile["sqm"],
    )

    current_energy = (
        profile["base_energy"]
        * area_factor
    )

    # --------------------------------------------------------
    # Energy history
    # --------------------------------------------------------

    energy_features = (
        create_energy_history(
            current_energy
        )
    )

    # --------------------------------------------------------
    # Per-square-metre features
    # --------------------------------------------------------

    energy_per_sqm = safe_divide(
        current_energy,
        sqm,
    )

    lag_24h_per_sqm = safe_divide(
        energy_features[
            "energy_lag_24h"
        ],
        sqm,
    )

    # --------------------------------------------------------
    # Deviation features
    # --------------------------------------------------------

    deviation_from_24h_mean = (
        energy_features[
            "energy_change_24h"
        ]
    )

    absolute_deviation_24h = abs(
        deviation_from_24h_mean
    )

    deviation_from_168h_mean = (
        energy_features[
            "energy_change_168h"
        ]
    )

    absolute_deviation_168h = abs(
        deviation_from_168h_mean
    )

    # --------------------------------------------------------
    # Final feature dictionary
    # --------------------------------------------------------

    features = {

        "sqm": sqm,

        **time_features,

        **energy_features,

        "energy_per_sqm":
            energy_per_sqm,

        "lag_24h_per_sqm":
            lag_24h_per_sqm,

        "deviation_from_24h_mean":
            deviation_from_24h_mean,

        "absolute_deviation_24h":
            absolute_deviation_24h,

        "deviation_from_168h_mean":
            deviation_from_168h_mean,

        "absolute_deviation_168h":
            absolute_deviation_168h,

        "primaryspaceusage":
            profile[
                "primaryspaceusage"
            ],

        "site_id":
            profile[
                "site_id"
            ],
    }

    return features