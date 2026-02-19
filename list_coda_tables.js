const CODA_API_KEY = process.env.CODA_API_KEY;
const DOC_ID = "NqBfudo5pw";

async function listTables() {
    console.log(`Listing tables for doc: ${DOC_ID}`);
    const res = await fetch(`https://coda.io/apis/v1/docs/${DOC_ID}/tables`, {
        headers: { "Authorization": `Bearer ${CODA_API_KEY}` }
    });
    if (!res.ok) {
        console.error(`Error: ${res.status} ${await res.text()}`);
        return;
    }
    const data = await res.json();
    console.log(JSON.stringify(data.items.map(t => ({ name: t.name, id: t.id })), null, 2));
}

listTables();
