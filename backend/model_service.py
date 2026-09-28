from pathlib import Path

import joblib
import numpy as np

from .ml_adapter import build_ml_features


# ============================================================
# EcoBuild AI
# ML Model Service
# ============================================================


PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

MODEL_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "energy_model_v3.joblib"
)


# ------------------------------------------------------------
# Load model bundle
# ------------------------------------------------------------

MODEL_BUNDLE = joblib.load(
    MODEL_PATH
)

MODEL = MODEL_BUNDLE["model"]

NUMERIC_FEATURES = (
    MODEL_BUNDLE["numeric_features"]
)

CATEGORICAL_FEATURES = (
    MODEL_BUNDLE["categorical_features"]
)

CATEGORY_MAPS = (
    MODEL_BUNDLE["category_maps"]
)


# ------------------------------------------------------------
# Encode categorical values
# ------------------------------------------------------------

def encode_categories(features):
    """
    Convert categorical values into the exact integer
    representation used during V3 model training.
    """

    encoded = dict(features)

    for column in CATEGORICAL_FEATURES:

        value = str(
            encoded[column]
        )

        mapping = CATEGORY_MAPS.get(
            column,
            {}
        )

        # Unknown categories were encoded as 0
        encoded[column] = mapping.get(
            value,
            0
        )

    return encoded


# ------------------------------------------------------------
# Build model input
# ------------------------------------------------------------

def prepare_model_input(features):
    """
    Create the exact feature ordering expected
    by the trained model.
    """

    encoded = encode_categories(
        features
    )

    values = []

    for feature in NUMERIC_FEATURES:

        values.append(
            float(
                encoded[feature]
            )
        )

    for feature in CATEGORICAL_FEATURES:

        values.append(
            int(
                encoded[feature]
            )
        )

    return np.array(
        [values],
        dtype=np.float64,
    )


# ------------------------------------------------------------
# Predict energy
# ------------------------------------------------------------

def predict_energy(
    building_type,
    parameters=None,
    timestamp=None,
):
    """
    Generate next-hour energy prediction for
    an EcoBuild building.
    """

    features = build_ml_features(
        building_type=building_type,
        parameters=parameters,
        timestamp=timestamp,
    )

    model_input = prepare_model_input(
        features
    )

    prediction = MODEL.predict(
        model_input
    )[0]

    prediction = max(
        0.0,
        float(prediction)
    )

    return {
        "building_type": building_type,

        "predicted_energy_kwh": round(
            prediction,
            3,
        ),

        "unit": "kWh",

        "target":
            "next-hour energy consumption",

        "model_version":
            MODEL_BUNDLE.get(
                "model_version",
                "V3",
            ),

        "features_used":
            len(model_input[0]),
    }