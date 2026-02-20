export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "equipe"; // equipe, faq, ou especialistas

    const CODA_API_KEY = env.CODA_API_KEY;
    const CODA_DOC_ID = env.CODA_DOC_ID || "NqBfudo5pw";
    const CODA_EQUIPE_TABLE_ID = env.CODA_EQUIPE_TABLE_ID || "grid-BsCb45xbdh";
    const CODA_FAQ_TABLE_ID = env.CODA_FAQ_TABLE_ID || "grid-ekHg8U40Vz";
    const CODA_SPEC_TABLE_ID = env.CODA_SPEC_TABLE_ID || "grid-qLsLR341lN";

    // IDs das Tabelas (O usuário precisará criar estas novas no Coda e atualizar aqui se mudarem)
    const TABLE_MAP = {
        "equipe": CODA_EQUIPE_TABLE_ID,
        "faq": CODA_FAQ_TABLE_ID,
        "especialistas": CODA_SPEC_TABLE_ID
    };

    const TABLE_ID = TABLE_MAP[type];

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (!CODA_API_KEY) {
        return new Response(JSON.stringify({
            success: false,
            error: "CODA_API_KEY não configurada no Cloudflare."
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        // 1. Busca colunas
        const codaColsUrl = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${TABLE_ID}/columns?cacheBust=${Date.now()}`;
        const colsResponse = await fetch(codaColsUrl, {
            headers: { "Authorization": `Bearer ${CODA_API_KEY}` }
        });

        if (!colsResponse.ok) {
            // Se for um placeholder, avisar amigavelmente
            if (TABLE_ID.includes("placeholder")) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `A tabela para '${type}' ainda não foi configurada no Cloudflare.`
                }), { headers: corsHeaders });
            }
            const errorText = await colsResponse.text();
            throw new Error(`Erro Coda (Colunas ${type}): ${colsResponse.status} - ${errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText}`);
        }

        const colsData = await colsResponse.json();
        const colMap = {};
        colsData.items.forEach(c => colMap[c.name.trim().toLowerCase()] = c.id);

        // 2. Busca linhas
        const codaRowsUrl = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${TABLE_ID}/rows?cacheBust=${Date.now()}`;
        const response = await fetch(codaRowsUrl, {
            headers: { "Authorization": `Bearer ${CODA_API_KEY}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro Coda (Linhas ${type}): ${response.status} ${errorText.substring(0, 100)}`);
        }
        const rawData = await response.json();

        // 3. Transformação Baseada no Tipo
        let result;
        if (type === "equipe") {
            result = transformEquipe(rawData.items, colMap);
        } else if (type === "faq") {
            result = transformFAQ(rawData.items, colMap);
        } else if (type === "especialistas") {
            result = transformEspecialistas(rawData.items, colMap);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}

// MANTÉM A LÓGICA EXISTENTE PARA EQUIPE
function transformEquipe(items, colMap) {
    const data = { categories: { internal: [], external: [] } };
    const deptMap = {};

    items.forEach(item => {
        const getVal = (name) => colMap[name.toLowerCase()] ? item.values[colMap[name.toLowerCase()]] : "";
        const member = {
            id: getVal("id") || item.id,
            name: getVal("nome") || "Sem Nome",
            role: getVal("cargo") || "",
            function: getVal("função") || "",
            email: getVal("email") || "",
            phone: String(getVal("telefone") || "").trim(),
            vacationStart: getVal("férias início") || "",
            vacationEnd: getVal("férias fim") || "",
            substituteId: getVal("substituto") || "",
            notes: getVal("notas") || ""
        };
        const deptName = getVal("departamento") || "Geral";
        if (!deptMap[deptName]) {
            deptMap[deptName] = { name: deptName, category: String(getVal("categoria")).toLowerCase() || "internal", members: [] };
        }
        deptMap[deptName].members.push(member);
    });

    Object.values(deptMap).forEach(dept => {
        if (dept.category === 'external') data.categories.external.push(dept);
        else data.categories.internal.push(dept);
    });
    return data;
}

// NOVA LÓGICA PARA FAQ
function transformFAQ(items, colMap) {
    return items.map(item => {
        const getV = (id, name) => {
            const v = item.values[id] || item.values[name] || item.values[name.toLowerCase()];
            return (v && typeof v === 'object' ? v.value : v) || "";
        };
        return {
            pergunta: getV("c-1o5bE5d3cF", "Pergunta"),
            resposta: getV("c-FTF6i84QnD", "Resposta"),
            categoria: (getV("c-LBroW2RunS", "Área") || "geral").toLowerCase().trim(),
            debug_row: item.values
        };
    });
}

// NOVA LÓGICA PARA ESPECIALISTAS (Cards da Central de Ajuda)
function transformEspecialistas(items, colMap) {
    return items.map(item => {
        const getV = (id, name) => {
            const v = item.values[id] || item.values[name] || item.values[name.toLowerCase()];
            return (v && typeof v === 'object' ? v.value : v) || "";
        };
        return {
            secao_id: (getV("c-XYdmnRA6c7", "Área") || "").toLowerCase().trim(),
            nome: getV("c-mgogWlwNXp", "Nome"),
            tag: getV("c-kY68_aiY48", "Processo"),
            email: getV("c-_2npD5ZeOB", "E-mail") || "equipe@ladobomseguros.com.br",
            assunto: "Contato Central de Ajuda",
            debug_row: item.values
        };
    });
}
