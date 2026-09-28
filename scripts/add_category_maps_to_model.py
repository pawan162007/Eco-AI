import json
import joblib

from pathlib import Path


MODEL_FILE = Path(
    "data/processed/energy_model_v3.joblib"
)

MAP_FILE = Path(
    "data/processed/v3_category_maps.json"
)


print("\n==============================================")
print(" EcoBuild AI - Update V3 Model Metadata")
print("==============================================\n")


# Load model bundle
print("[1/3] Loading model...")

bundle = joblib.load(
    MODEL_FILE
)


# Load category mappings
print("[2/3] Loading category mappings...")

with open(
    MAP_FILE,
    "r",
    encoding="utf-8"
) as file:

    category_maps = json.load(file)


# Add mappings
bundle["category_maps"] = category_maps


# Save updated bundle
print("[3/3] Saving updated model bundle...")

joblib.dump(
    bundle,
    MODEL_FILE
)


print("\nModel bundle updated successfully.")

print(
    "\nCategory maps stored:"
)

for column, mapping in category_maps.items():

    print(
        f"  {column}: "
        f"{len(mapping)} categories"
    )

print("\nDone.")