import requests
import json

CODA_TOKEN = "bba1cc5d-35d7-4772-a866-c95f2310d071"
DOC_ID = "NqBfudo5pw"
TABLE_ID = "grid-BsCb45xbdh"

def get_columns():
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{TABLE_ID}/columns"
    headers = {"Authorization": f"Bearer {CODA_TOKEN}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        cols = response.json().get('items', [])
        mapping = {c['name']: c['id'] for c in cols}
        print(json.dumps(mapping, indent=2, ensure_ascii=False))
    else:
        print(f"Erro: {response.text}")

if __name__ == "__main__":
    get_columns()
