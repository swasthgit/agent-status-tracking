import pandas as pd

excel_file = r"C:\Users\Lenovo\Downloads\for dashborard.xlsx"

try:
    # Read all sheets
    xls = pd.ExcelFile(excel_file)

    print("=" * 80)
    print("READING EXCEL WORKBOOK: for dashborard.xlsx")
    print("=" * 80)
    print(f"\nTotal sheets found: {len(xls.sheet_names)}")
    print(f"Sheet names: {', '.join(xls.sheet_names)}\n")

    for sheet_name in xls.sheet_names:
        print("\n" + "=" * 80)
        print(f"SHEET: {sheet_name}")
        print("=" * 80)

        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        print(df.to_string(index=False))
        print("\n")

except Exception as e:
    print(f"Error reading Excel file: {e}")
