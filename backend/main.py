# backend/main.py

from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .model_service import predict_energy


# ============================================================
# EcoBuild AI
# Energy Prediction API
# ============================================================

app = FastAPI(
    title="EcoBuild AI Energy Prediction API",
    description=(
        "FastAPI service for EcoBuild AI energy "
        "prediction using the BDG2-trained V3 model."
    ),
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=[
        "*",
    ],

    allow_headers=[
        "*",
    ],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class EnergyPredictionRequest(BaseModel):

    building_type: str

    area: float = 100.0

    occupants: int = 0

    timestamp: str | None = None


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():

    return {

        "project":
            "EcoBuild AI",

        "service":
            "Energy Prediction API",

        "status":
            "running",

        "model":
            "BDG2 HistGradientBoosting V3",

        "version":
            "2.0.0",

    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    try:

        from .model_service import (
            MODEL,
        )

        model_loaded = MODEL is not None

    except Exception:

        model_loaded = False


    return {

        "status":
            "healthy",

        "model_loaded":
            model_loaded,

    }


# ============================================================
# MODEL INFORMATION
# ============================================================

@app.get("/model-info")
def model_info():

    try:

        from .model_service import (
            MODEL_BUNDLE,
            NUMERIC_FEATURES,
            CATEGORICAL_FEATURES,
        )


        return {

            "model_version":
                MODEL_BUNDLE.get(
                    "model_version",
                    "V3",
                ),

            "target":
                MODEL_BUNDLE.get(
                    "target",
                    "target_next_hour_energy",
                ),

            "training_rows":
                MODEL_BUNDLE.get(
                    "training_rows"
                ),

            "test_rows":
                MODEL_BUNDLE.get(
                    "test_rows"
                ),

            "train_start":
                MODEL_BUNDLE.get(
                    "train_start"
                ),

            "train_end":
                MODEL_BUNDLE.get(
                    "train_end"
                ),

            "test_start":
                MODEL_BUNDLE.get(
                    "test_start"
                ),

            "metrics":
                MODEL_BUNDLE.get(
                    "metrics"
                ),

            "numeric_feature_count":
                len(
                    NUMERIC_FEATURES
                ),

            "categorical_feature_count":
                len(
                    CATEGORICAL_FEATURES
                ),

            "total_features":
                len(NUMERIC_FEATURES)
                +
                len(CATEGORICAL_FEATURES),

        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to load model information: "
                f"{error}"
            ),
        )


# ============================================================
# ENERGY PREDICTION
# ============================================================

@app.post("/predict-energy")
def predict_energy_api(
    request: EnergyPredictionRequest
):

    try:

        # ----------------------------------------------------
        # Optional timestamp
        # ----------------------------------------------------

        timestamp = None


        if request.timestamp:

            try:

                timestamp = datetime.fromisoformat(
                    request.timestamp
                )

            except ValueError:

                raise HTTPException(

                    status_code=400,

                    detail=(
                        "Invalid timestamp format. "
                        "Use ISO format such as "
                        "2017-07-01T12:00:00."
                    ),

                )


        # ----------------------------------------------------
        # Validate area
        # ----------------------------------------------------

        if request.area <= 0:

            raise HTTPException(

                status_code=400,

                detail="Area must be greater than 0.",

            )


        # ----------------------------------------------------
        # Validate occupants
        # ----------------------------------------------------

        if request.occupants < 0:

            raise HTTPException(

                status_code=400,

                detail="Occupants cannot be negative.",

            )


        # ----------------------------------------------------
        # ML prediction
        # ----------------------------------------------------

        result = predict_energy(

            building_type=
                request.building_type,

            parameters={

                "area":
                    request.area,

                "occupants":
                    request.occupants,

            },

            timestamp=
                timestamp,

        )


        # ----------------------------------------------------
        # API response
        # ----------------------------------------------------

        return {

            "success":
                True,

            **result,

        }


    except HTTPException:

        raise


    except ValueError as error:

        raise HTTPException(

            status_code=400,

            detail=str(error),

        )


    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=(
                f"Prediction failed: {error}"
            ),

        )