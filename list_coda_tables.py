import requests

CODA_TOKEN = "bba1cc5d-35d7-4772-a866-c95f2310d071"
DOC_ID = "NqBfudo5pw"

def list_tables():
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables"
    headers = {
        "Authorization": f"Bearer {CODA_TOKEN}"
    }
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        tables = response.json().get('items', [])
        print("Tabelas encontradas:")
        for t in tables:
            print(f"- {t['name']} (ID: {t['id']})")
    else:
        print(response.text)

if __name__ == "__main__":
    list_tables()
