export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { newData, commitMessage, authCode } = await request.json();

        // Verificação de segurança: Código de Acesso
        const SIGNED_ADMIN_CODE = env.ADMIN_CODE || "CR2024"; // Fallback se não configurado
        if (authCode !== SIGNED_ADMIN_CODE) {
            return new Response(JSON.stringify({ success: false, error: "Código de acesso inválido!" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const REPO = "ryannobre-beep/organograma-ladobom_cr";
        const FILE_PATH = "data.json";
        const GITHUB_TOKEN = env.GITHUB_TOKEN;

        if (!GITHUB_TOKEN) {
            throw new Error("Variável GITHUB_TOKEN não configurada no Cloudflare.");
        }

        // 1. Get the current file SHA
        const getFile = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "User-Agent": "Cloudflare-Pages-Function"
            }
        });

        if (!getFile.ok) {
            throw new Error("Não foi possível ler o arquivo do GitHub. Verifique o Token.");
        }

        const fileData = await getFile.json();
        const sha = fileData.sha;

        // 2. Update the file
        const updateFile = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "User-Agent": "Cloudflare-Pages-Function",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: commitMessage || "Update data.json via Admin Panel",
                content: btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2)))),
                sha: sha
            })
        });

        const result = await updateFile.json();

        if (!updateFile.ok) {
            throw new Error(result.message || "Erro ao fazer commit no GitHub");
        }

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
}
