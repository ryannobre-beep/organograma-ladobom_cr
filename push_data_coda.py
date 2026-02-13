import requests
import json

CODA_TOKEN = "bba1cc5d-35d7-4772-a866-c95f2310d071"
DOC_ID = "NqBfudo5pw"
TABLE_ID = "grid-BsCb45xbdh"

# Consolidated Data
members = [
    # Liderança
    {"Nome": "Douglas Berto", "Cargo": "Head de Operações", "Email": "douglas@ladobom.com", "Departamento": "Liderança e Gestão", "Categoria": "internal", "Ordem Área": 2},
    {"Nome": "Marco Antônio Lenzi Duarte", "Cargo": "CTO – Líder em Tecnologia e Inovação", "Email": "marco@ladobom.com", "Departamento": "Liderança e Gestão", "Categoria": "internal", "Ordem Área": 2},
    {"Nome": "Jonatan Matschulat", "Cargo": "Diretor Comercial", "Email": "jonatan@redevistorias.com.br", "Departamento": "Liderança e Gestão", "Categoria": "internal", "Ordem Área": 2},
    {"Nome": "Alexandra Bortolin de Souza", "Cargo": "Analista de RH (HRBP)", "Função": "Conduz a estratégia de pessoas.", "Email": "alexandra.souza@ladobom.com", "Departamento": "Tecnologia e Inovação", "Categoria": "internal", "Ordem Área": 6},
    
    # Equipe Operacional
    {"Nome": "Ana Carolina Minato", "Cargo": "Consultora de Seguros - Condomínios ", "Função": "Responsável por renovações, contratação e acompanhamento das carteiras da CR na parte de condomínios.", "Email": "ana.minato@ladobom.com", "Departamento": "Pessoas Chaves", "Categoria": "internal", "Ordem Área": 1, "Férias Início": "2026-02-23", "Férias Fim": "2026-03-27", "Substituto": "Cesar Eduardo Fernandes"},
    {"Nome": "Ryan Silva", "Cargo": "Analista de Processos", "Função": "Desenha e otimiza processos.", "Email": "ryan.silva@ladobom.com", "Departamento": "Pessoas Chaves", "Categoria": "internal", "Ordem Área": 1},
    
    {"Nome": "Julia Maria Rodrigues", "Cargo": "Supervisora de Sinistros", "Email": "julia@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    {"Nome": "Elen Moura", "Cargo": "Analista Administrativo de Seguros Pleno", "Função": "Responsável pela abertura e regularização de sinistros novos e pendentes.", "Email": "elen.moura@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    {"Nome": "Bruna Araújo", "Cargo": "Analista Administrativo de Seguros Júnior", "Função": "Acompanha sinistros da Crédito Real.", "Email": "bruna.araujo@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    {"Nome": "Lara Silveira Agostinho", "Cargo": "Auxiliar Administrativo", "Função": "Oferece suporte operacional à equipe de sinistros.", "Email": "lara.agostinho@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    
    {"Nome": "Cesar Eduardo Fernandes", "Cargo": "Supervisor de Contratação", "Email": "cesar@ladobom.com", "Departamento": "Contratação, Imobiliário e Garantias", "Categoria": "internal", "Ordem Área": 4},
    {"Nome": "Bruna Lucena Gouveira de Araujo", "Cargo": "Analista Administrativo de Seguros Júnior", "Função": "Atua em contratações e cancelamentos de seguro incêndio.", "Email": "bruna.lucena@ladobom.com", "Departamento": "Contratação, Imobiliário e Garantias", "Categoria": "internal", "Ordem Área": 4},
    {"Nome": "Maria Eduarda Alves Machado", "Cargo": "Assistente Administrativo", "Função": "Realiza resgates de títulos de capitalização.", "Email": "maria.eduarda@ladobom.com", "Departamento": "Contratação, Imobiliário e Garantias", "Categoria": "internal", "Ordem Área": 4},
    
    {"Nome": "Michel Pauletti", "Cargo": "Coordenador Comercial", "Email": "michel.pauletti@redevistorias.com.br", "Departamento": "Customer Success (CS)", "Categoria": "internal", "Ordem Área": 5},
    {"Nome": "Maria Eduarda Guerreiro", "Cargo": "Analista de CS Júnior", "Função": "Realiza onboarding e atendimento.", "Email": "eduarda.guerreiro@ladobom.com", "Departamento": "Customer Success (CS)", "Categoria": "internal", "Ordem Área": 5},
    
    # Novos (do Google Doc)
    {"Nome": "Gabriella dos Santos Alves", "Cargo": "Especialista / Operacional", "Email": "gabriella@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    {"Nome": "Katia Regina da Silva", "Cargo": "Especialista / Operacional", "Email": "katia@ladobom.com", "Departamento": "Contratação, Imobiliário e Garantias", "Categoria": "internal", "Ordem Área": 4},
    {"Nome": "Laureane Silva", "Cargo": "Especialista / Operacional", "Email": "laureane.silva@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    {"Nome": "Matheus Antonio Pereira", "Cargo": "Especialista / Operacional", "Email": "matheus.pereira@ladobom.com", "Departamento": "Contratação, Imobiliário e Garantias", "Categoria": "internal", "Ordem Área": 4},
    {"Nome": "Pedro Augusto Barros Rodrigues Castilho", "Cargo": "Especialista / Operacional", "Email": "pedro.rodrigues@ladobom.com", "Departamento": "Seguros e Sinistros", "Categoria": "internal", "Ordem Área": 3},
    {"Nome": "Roque Lemos Junior", "Cargo": "Especialista / Operacional", "Email": "roque.junior@ladobom.com", "Departamento": "Contratação, Imobiliário e Garantias", "Categoria": "internal", "Ordem Área": 4}
]

def push_to_coda():
    url = f"https://coda.io/apis/v1/docs/{DOC_ID}/tables/{TABLE_ID}/rows"
    headers = {
        "Authorization": f"Bearer {CODA_TOKEN}",
        "Content-Type": "application/json"
    }
    
    rows = []
    for m in members:
        rows.append({
            "cells": [
                {"column": "Nome", "value": m.get("Nome", "")},
                {"column": "Cargo", "value": m.get("Cargo", "")},
                {"column": "Função", "value": m.get("Função", "")},
                {"column": "Email", "value": m.get("Email", "")},
                {"column": "Categoria", "value": m.get("Categoria", "internal")},
                {"column": "Departamento", "value": m.get("Departamento", "")},
                {"column": "Ordem Área", "value": m.get("Ordem Área", 1)},
                {"column": "Férias Início", "value": m.get("Férias Início", "")},
                {"column": "Férias Fim", "value": m.get("Férias Fim", "")},
                {"column": "Substituto", "value": m.get("Substituto", "")},
                {"column": "Notas", "value": m.get("Notas", "")}
            ]
        })
    
    payload = {"rows": rows}
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 202:
        print("Dados enviados com sucesso para o Coda!")
    else:
        print(f"Erro ao enviar dados: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    push_to_coda()
