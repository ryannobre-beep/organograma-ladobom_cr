import requests

CODA_TOKEN = "bba1cc5d-35d7-4772-a866-c95f2310d071"
DOC_ID = "NqBfudo5pw"
TABLE_ID = "grid-BsCb45xbdh"

def verify_coda():
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{TABLE_ID}/rows"
    headers = {"Authorization": f"Bearer {CODA_TOKEN}"}
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Sucesso! Encontradas {len(data.get('items', []))} linhas.")
    else:
        print(f"Erro: {response.text}")

if __name__ == "__main__":
    verify_coda()
