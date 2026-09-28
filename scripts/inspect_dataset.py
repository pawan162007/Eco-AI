import pandas as pd
from pathlib import Path


DATA_PATH = Path(
    "data/raw/bdg2_sample.csv"
)


def main():

    print("\n" + "=" * 60)
    print("EcoBuild AI - Dataset Inspector")
    print("=" * 60)

    if not DATA_PATH.exists():

        print(
            f"\nDataset not found:\n{DATA_PATH}"
        )

        return


    df = pd.read_csv(
        DATA_PATH
    )


    print("\nDataset Shape:")
    print(
        df.shape
    )


    print("\nColumns:")
    for column in df.columns:

        print(
            f" - {column}"
        )


    print("\nFirst 5 Rows:")
    print(
        df.head()
    )


    print("\nData Types:")
    print(
        df.dtypes
    )


    print("\nMissing Values:")

    missing = (
        df.isnull()
        .sum()
        .sort_values(
            ascending=False
        )
    )

    print(
        missing
    )


    print("\nBasic Statistics:")

    print(
        df.describe(
            include="all"
        )
    )


    print("\nDuplicate Rows:")

    print(
        df.duplicated()
        .sum()
    )


    print("\n" + "=" * 60)
    print("Inspection completed")
    print("=" * 60)


if __name__ == "__main__":

    main()