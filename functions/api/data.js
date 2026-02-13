export async function onRequestGet(context) {
    const { env } = context;
    const CODA_API_KEY = env.CODA_API_KEY;
    const DOC_ID = env.CODA_DOC_ID || "dNqBfudo5pw"; // Fallback para o Doc ID identificado
    const TABLE_ID = "Colaboradores"; // Nome sugerido da tabela

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
        // Busca as linhas da tabela no Coda
        // Documentação: https://coda.io/developers/apis/v1#operation/listRows
        const response = await fetch(`https://coda.io/apis/v1/docs/${DOC_ID}/tables/${TABLE_ID}/rows`, {
            headers: {
                "Authorization": `Bearer ${CODA_API_KEY}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao buscar dados do Coda");
        }

        const rawData = await response.json();

        // Transformar o formato do Coda para o formato que o OrgChart espera
        const formattedData = transformCodaToOrgChart(rawData.items);

        return new Response(JSON.stringify(formattedData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}

function transformCodaToOrgChart(items) {
    const data = {
        company: "Lado Bom Seguros",
        unit: "Operação Vertical CR (Crédito Real)",
        categories: {
            internal: [],
            external: []
        }
    };

    // Mapa para agrupar por departamento
    const deptMap = {};

    items.forEach(item => {
        const values = item.values;
        // Mapeamento das colunas do Coda (usando nomes prováveis ou IDs)
        // O Coda API retorna os campos baseados nos nomes das colunas
        const member = {
            id: values["ID"] || item.id,
            name: values["Nome"],
            role: values["Cargo"],
            function: values["Função"],
            email: values["Email"],
            vacationStart: values["Férias Início"],
            vacationEnd: values["Férias Fim"],
            substituteId: values["Substituto"],
            notes: values["Notas"]
        };

        const deptName = values["Departamento"] || "Sem Departamento";
        const category = (values["Categoria"] || "internal").toLowerCase();
        const displayOrder = parseInt(values["Ordem Área"]) || 99;

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

    // Converter mapa para o formato final
    Object.values(deptMap).forEach(dept => {
        if (dept.category === 'external') {
            data.categories.external.push(dept);
        } else {
            data.categories.internal.push(dept);
        }
    });

    return data;
}
