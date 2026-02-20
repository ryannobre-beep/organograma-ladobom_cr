import requests
import json

CODA_TOKEN = "369563c3-5a4c-4992-b7aa-645104ea0e32"
DOC_ID = "NqBfudo5pw"
FAQ_TABLE_ID = "grid-ekHg8U40Vz"
SPEC_TABLE_ID = "grid-qLsLR341lN"

# IDs ESTÁVEIS IDENTIFICADOS VIA API
FAQ_COLS = {
    "pergunta": "c-1o5bE5d3cF",
    "resposta": "c-FTF6i84QnD",
    "categoria": "c-LBroW2RunS"
}

SPEC_COLS = {
    "area": "c-XYdmnRA6c7",
    "nome": "c-mgogWlwNXp",
    "processo": "c-kY68_aiY48",
    "email": "c-_2npD5ZeOB"
}

headers = {
    "Authorization": f"Bearer {CODA_TOKEN}",
    "Content-Type": "application/json"
}

def delete_all_rows(table_id):
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{table_id}/rows"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        rows = res.json().get("items", [])
        if not rows: return
        row_ids = [r['id'] for r in rows]
        requests.delete(url, headers=headers, json={"rowIds": row_ids})

def populate():
    # 1. FAQ
    print("Populating FAQ with Stable IDs...")
    faq_data = [
        ["O que é o Seguro Fiança?", "O seguro fiança substitui o fiador e garante o pagamento do aluguel e encargos de locação.", "fianca"],
        ["Como acionar um sinistro?", "Entre em contato com nossa equipe de sinistros ou utilize os canais emergenciais 24h disponíveis na Central de Ajuda.", "geral"],
        ["Qual o prazo para resgate de capitalização?", "O resgate pode ser solicitado ao final do contrato de locação, seguindo os prazos da seguradora (geralmente 5 a 30 dias).", "capitalizacao"]
    ]
    
    faq_rows = []
    for d in faq_data:
        cells = [
            {"column": FAQ_COLS["pergunta"], "value": d[0]},
            {"column": FAQ_COLS["resposta"], "value": d[1]},
            {"column": FAQ_COLS["categoria"], "value": d[2]}
        ]
        faq_rows.append({"cells": cells})
    
    delete_all_rows(FAQ_TABLE_ID)
    requests.post(f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{FAQ_TABLE_ID}/rows", headers=headers, json={"rows": faq_rows})

    # 2. Specialists
    print("Populating Specialists with Stable IDs...")
    spec_data = [
        ["fianca", "Matheus Antonio Pereira", "Cotação", "matheus.pereira@ladobom.com"],
        ["fianca", "Roque Lemos Junior", "Contratação", "roque.junior@ladobom.com"],
        ["incendio", "Bruna Lucena Gouveira de Araujo", "Incêndio", "bruna.lucena@ladobom.com"],
        ["condominio", "Ana Carolina Minato", "Especialista", "ana.minato@ladobom.com"],
        ["conteudo", "Ana Carolina Minato", "Especialista", "ana.minato@ladobom.com"],
        ["sinistro-fianca", "Bruna Araújo", "Fiança", "bruna.araujo@ladobom.com"],
        ["sinistro-gerais", "Manuela Cardoso", "Gerais", "sinistro.re@ladobom.com"],
        ["resgate", "Maria Eduarda Alves Machado", "Atendimento", "maria.eduarda@ladobom.com"]
    ]
    
    spec_rows = []
    for d in spec_data:
        cells = [
            {"column": SPEC_COLS["area"], "value": d[0]},
            {"column": SPEC_COLS["nome"], "value": d[1]},
            {"column": SPEC_COLS["processo"], "value": d[2]},
            {"column": SPEC_COLS["email"], "value": d[3]}
        ]
        spec_rows.append({"cells": cells})
        
    delete_all_rows(SPEC_TABLE_ID)
    requests.post(f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{SPEC_TABLE_ID}/rows", headers=headers, json={"rows": spec_rows})

if __name__ == "__main__":
    populate()
