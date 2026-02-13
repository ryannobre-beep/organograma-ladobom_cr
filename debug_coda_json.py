import requests
import json

CODA_TOKEN = "bba1cc5d-35d7-4772-a866-c95f2310d071"
DOC_ID = "NqBfudo5pw"
TABLE_ID = "grid-BsCb45xbdh"

def debug_coda_structure():
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{TABLE_ID}/rows?valueFormat=simple"
    headers = {"Authorization": f"Bearer {CODA_TOKEN}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        items = response.json().get('items', [])
        if items:
            print("Chaves encontradas no primeiro item:")
            print(json.dumps(items[0]['values'], indent=2, ensure_ascii=False))
        else:
            print("Tabela vazia.")
    else:
        print(f"Erro: {response.text}")

if __name__ == "__main__":
    debug_coda_structure()
