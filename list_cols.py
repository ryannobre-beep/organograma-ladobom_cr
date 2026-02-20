import requests
import json

CODA_TOKEN = "369563c3-5a4c-4992-b7aa-645104ea0e32"
DOC_ID = "NqBfudo5pw"
FAQ_TABLE_ID = "grid-ekHg8U40Vz"
SPEC_TABLE_ID = "grid-qLsLR341lN"

headers = {
    "Authorization": f"Bearer {CODA_TOKEN}",
    "Content-Type": "application/json"
}

def list_cols(table_id, name):
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{table_id}/columns"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        cols = res.json().get("items", [])
        print(f"\n--- {name} ({table_id}) Columns ---")
        for c in cols:
            print(f"ID: {c['id']} | Name: {c['name']}")
    else:
        print(f"Error {name}: {res.status_code}")

if __name__ == "__main__":
    list_cols(FAQ_TABLE_ID, "FAQ")
    list_cols(SPEC_TABLE_ID, "Specialists")
