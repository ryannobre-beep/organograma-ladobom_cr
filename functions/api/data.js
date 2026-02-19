export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "equipe"; // equipe, faq, ou especialistas

    const CODA_API_KEY = env.CODA_API_KEY;
    const CODA_DOC_ID = env.CODA_DOC_ID || "NqBfudo5pw";
    const CODA_EQUIPE_TABLE_ID = env.CODA_EQUIPE_TABLE_ID || "grid-M-rY9C7_6l";
    const CODA_FAQ_TABLE_ID = env.CODA_FAQ_TABLE_ID || "tu8U40Vz";
    const CODA_SPEC_TABLE_ID = env.CODA_SPEC_TABLE_ID || "tuR341lN";

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
        const colsResponse = await fetch(`https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${TABLE_ID}/columns`, {
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
            throw new Error(`Erro ao buscar colunas (${type})`);
        }

        const colsData = await colsResponse.json();
        const colMap = {};
        colsData.items.forEach(c => colMap[c.name.trim().toLowerCase()] = c.id);

        // 2. Busca linhas
        const response = await fetch(`https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${TABLE_ID}/rows`, {
            headers: { "Authorization": `Bearer ${CODA_API_KEY}` }
        });

        if (!response.ok) throw new Error("Erro ao buscar dados do Coda");
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
        const getVal = (name) => colMap[name.toLowerCase()] ? item.values[colMap[name.toLowerCase()]] : "";
        return {
            pergunta: getVal("pergunta"),
            resposta: getVal("resposta"),
            categoria: getVal("categoria") || "geral"
        };
    });
}

// NOVA LÓGICA PARA ESPECIALISTAS (Cards da Central de Ajuda)
function transformEspecialistas(items, colMap) {
    return items.map(item => {
        const getVal = (name) => colMap[name.toLowerCase()] ? item.values[colMap[name.toLowerCase()]] : "";
        return {
            secao_id: getVal("seção id"), // ex: fianca, incendio
            nome: getVal("nome"),
            tag: getVal("tag"), // ex: Cotação, Contratação
            email: getVal("email") || "equipe@ladobomseguros.com.br",
            assunto: getVal("assunto") || "Contato Central de Ajuda"
        };
    });
}
