import requests

CODA_TOKEN = "bba1cc5d-35d7-4772-a866-c95f2310d071"

def test_token():
    url = "https://coda.io/apis/v1/docs"
    headers = {
        "Authorization": f"Bearer {CODA_TOKEN}"
    }
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        docs = response.json().get('items', [])
        print("Documentos acessíveis:")
        for doc in docs:
            print(f"- {doc['name']} (ID: {doc['id']})")
    else:
        print(response.text)

if __name__ == "__main__":
    test_token()
