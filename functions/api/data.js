export async function onRequestGet(context) {
    const { env } = context;
    const CODA_API_KEY = env.CODA_API_KEY;
    const DOC_ID = env.CODA_DOC_ID || "NqBfudo5pw"; // ID do documento verificado
    const TABLE_ID = "grid-BsCb45xbdh"; // ID exato da tabela

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (!CODA_API_KEY) {
        return new Response(JSON.stringify({
            success: false,
            error: "CODA_API_KEY não configurada no Cloudflare. Por favor, adicione-a nas variáveis de ambiente."
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    try {
        // 1. Busca os metadados das colunas para mapear nomes -> IDs
        const colsResponse = await fetch(`https://coda.io/apis/v1/docs/${DOC_ID}/tables/${TABLE_ID}/columns`, {
            headers: { "Authorization": `Bearer ${CODA_API_KEY}` }
        });

        if (!colsResponse.ok) {
            throw new Error("Erro ao buscar colunas do Coda");
        }

        const colsData = await colsResponse.json();
        const colMap = {};
        colsData.items.forEach(c => {
            // Mapeia tanto o nome normal quanto o nome limpo em minúsculas
            colMap[c.name.trim().toLowerCase()] = c.id;
        });

        // 2. Busca as linhas da tabela
        const response = await fetch(`https://coda.io/apis/v1/docs/${DOC_ID}/tables/${TABLE_ID}/rows`, {
            headers: { "Authorization": `Bearer ${CODA_API_KEY}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao buscar dados do Coda");
        }

        const rawData = await response.json();

        // 3. Transformação dinâmica usando o mapa de colunas
        const formattedData = transformCodaToOrgChart(rawData.items, colMap);

        return new Response(JSON.stringify(formattedData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            debug: {
                docId: DOC_ID,
                tableId: TABLE_ID,
                hasToken: !!CODA_API_KEY
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}

function transformCodaToOrgChart(items, colMap) {
    const data = {
        company: "Lado Bom Seguros",
        unit: "Operação Vertical CR (Crédito Real)",
        categories: {
            internal: [],
            external: []
        }
    };

    const deptMap = {};

    items.forEach(item => {
        const values = item.values;

        // Função auxiliar para pegar valor com segurança pelo nome da coluna
        const getVal = (name) => {
            const id = colMap[name.trim().toLowerCase()];
            return id ? values[id] : undefined;
        };

        const member = {
            id: getVal("ID") || item.id,
            name: getVal("Nome") || "Sem Nome",
            role: getVal("Cargo") || "",
            function: getVal("Função") || "",
            email: getVal("Email") || "",
            vacationStart: getVal("Férias Início") || "",
            vacationEnd: getVal("Férias Fim") || "",
            substituteId: getVal("Substituto") || "",
            phone: String(getVal("Telefone") || getVal("Phone") || "").trim(),
            notes: getVal("Notas") || ""
        };

        const deptName = getVal("Departamento") || "Sem Departamento";
        const categoryVal = getVal("Categoria") || "internal";
        const category = String(categoryVal).toLowerCase();
        const displayOrder = parseInt(getVal("Ordem Área")) || 99;

        if (!deptMap[deptName]) {
            deptMap[deptName] = {
                id: `dept_${deptName.toLowerCase().replace(/\s+/g, '_')}`,
                name: deptName,
                displayOrder: displayOrder,
                category: category,
                members: []
            };
        }

        deptMap[deptName].members.push(member);
    });

    Object.values(deptMap).forEach(dept => {
        if (dept.category === 'external') {
            data.categories.external.push(dept);
        } else {
            data.categories.internal.push(dept);
        }
    });

    return data;
}
