import os
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


INPUT_FILE = "data/processed/bdg2_energy_long.csv"
OUTPUT_FILE = "data/processed/bdg2_energy_long.parquet"

CHUNK_SIZE = 100_000


def main():
    print("\nStarting CSV → Parquet conversion...")
    print(f"Input : {INPUT_FILE}")
    print(f"Output: {OUTPUT_FILE}\n")

    if not os.path.exists(INPUT_FILE):
        raise FileNotFoundError(
            f"Input file not found: {INPUT_FILE}"
        )

    if os.path.exists(OUTPUT_FILE):
        os.remove(OUTPUT_FILE)

    writer = None
    total_rows = 0
    chunk_number = 0

    for chunk in pd.read_csv(
        INPUT_FILE,
        chunksize=CHUNK_SIZE,
    ):
        chunk_number += 1

        # Convert timestamp to proper datetime
        chunk["timestamp"] = pd.to_datetime(
            chunk["timestamp"],
            errors="coerce",
        )

        # Use compact integer types where possible
        chunk["hour"] = chunk["hour"].astype("int8")
        chunk["day"] = chunk["day"].astype("int8")
        chunk["month"] = chunk["month"].astype("int8")
        chunk["year"] = chunk["year"].astype("int16")
        chunk["day_of_week"] = chunk["day_of_week"].astype("int8")
        chunk["is_weekend"] = chunk["is_weekend"].astype("int8")

        # Convert pandas dataframe to Arrow table
        table = pa.Table.from_pandas(
            chunk,
            preserve_index=False,
        )

        if writer is None:
            writer = pq.ParquetWriter(
                OUTPUT_FILE,
                table.schema,
                compression="snappy",
            )

        writer.write_table(table)

        total_rows += len(chunk)

        print(
            f"Chunk {chunk_number:03d} | "
            f"Rows processed: {total_rows:,}"
        )

    if writer is not None:
        writer.close()

    file_size_mb = os.path.getsize(OUTPUT_FILE) / (
        1024 * 1024
    )

    print("\n========================================")
    print("Conversion completed successfully! ✅")
    print("========================================")
    print(f"Rows: {total_rows:,}")
    print(f"Parquet size: {file_size_mb:.2f} MB")
    print(f"Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()