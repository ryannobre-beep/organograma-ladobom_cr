document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.doc-section');
    const searchInput = document.getElementById('help-search');

    // --- NAVEGAÇÃO E BÁSICOS ---
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetId = link.getAttribute('data-target');
            activateSection(targetId);
            if (window.innerWidth <= 768) window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    function activateSection(id) {
        sections.forEach(s => s.classList.remove('active'));
        sidebarLinks.forEach(l => l.classList.remove('active'));
        const targetSection = document.getElementById(id);
        const targetLink = document.querySelector(`.sidebar-link[data-target="${id}"]`);
        if (targetSection) targetSection.classList.add('active');
        if (targetLink) targetLink.classList.add('active');
    }

    // --- BUSCA ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length < 2) return;
        sections.forEach(section => {
            if (section.innerText.toLowerCase().includes(term)) activateSection(section.id);
        });
    });

    // --- INTEGRAÇÃO CODA (DADOS DINÂMICOS) ---
    async function loadDynamicContent() {
        try {
            const response = await fetch('/api/data?type=especialistas');
            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data && Array.isArray(data)) {
                // Agrupa especialistas por seção ID
                const specialistsBySection = {};
                data.forEach(spec => {
                    if (!specialistsBySection[spec.secao_id]) specialistsBySection[spec.secao_id] = [];
                    specialistsBySection[spec.secao_id].push(spec);
                });

                // Injeta nos containers correspondentes
                Object.keys(specialistsBySection).forEach(sectionId => {
                    const grid = document.getElementById(`grid-${sectionId}`);
                    if (grid) {
                        const html = specialistsBySection[sectionId].map(spec => `
                            <a href="mailto:${spec.email}?subject=${encodeURIComponent(spec.assunto || 'Contato Profissional')}" class="contact-card">
                                <div class="icon-circle"><svg><use href="#icon-mail"></use></svg></div>
                                <div class="card-info">
                                    <span class="card-tag">${spec.tag}</span>
                                    <span class="card-name">${spec.nome}</span>
                                </div>
                            </a>
                        `).join('');
                        grid.innerHTML = html;
                    }
                });
            }

            // --- BUSCA FAQ ---
            const faqResponse = await fetch('/api/data?type=faq');
            if (faqResponse.ok) {
                const faqData = await faqResponse.json();
                if (faqData && Array.isArray(faqData)) {
                    const faqByCategory = {};
                    faqData.forEach(item => {
                        const cat = item.categoria || 'geral';
                        if (!faqByCategory[cat]) faqByCategory[cat] = [];
                        faqByCategory[cat].push(item);
                    });

                    // Limpa container global primeiro
                    const globalFaqContainer = document.getElementById('faq-container');
                    if (globalFaqContainer) globalFaqContainer.innerHTML = '';

                    // Injeta FAQs por categoria
                    Object.keys(faqByCategory).forEach(cat => {
                        let container = document.getElementById(`faq-list-${cat}`) || globalFaqContainer;
                        if (!container) return;

                        const html = faqByCategory[cat].map(item => `
                            <div class="faq-item">
                                <button class="faq-question">
                                    <span>${item.pergunta}</span>
                                    <svg class="toggle-icon"><use href="#icon-plus"></use></svg>
                                </button>
                                <div class="faq-answer">
                                    <p>${item.resposta}</p>
                                </div>
                            </div>
                        `).join('');

                        // Se for o global, acumula. Se for específico, substitui.
                        if (container === globalFaqContainer) {
                            container.innerHTML += html;
                        } else {
                            container.innerHTML = html;
                        }
                    });

                    // Re-bind eventos FAQ para itens dinâmicos
                    document.querySelectorAll('.faq-question').forEach(q => {
                        q.addEventListener('click', () => {
                            const item = q.parentElement;
                            item.classList.toggle('open');
                            const icon = q.querySelector('.toggle-icon use');
                            if (icon) icon.setAttribute('href', item.classList.contains('open') ? '#icon-minus' : '#icon-plus');
                        });
                    });
                }
            }
        } catch (err) {
            console.warn("Coda Specialists not loaded yet or error:", err);
            // Mantém o HTML hardcoded como fallback
        }
    }

    loadDynamicContent();

    // --- UTILITÁRIOS ---
    window.toggleCoverage = function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('open');
        const btn = el.previousElementSibling;
        if (btn && btn.classList.contains('coverage-toggle-btn')) {
            const icon = btn.querySelector('use');
            const span = btn.querySelector('span');
            if (icon) icon.setAttribute('href', el.classList.contains('open') ? '#icon-folder-open' : '#icon-folder');
            if (span) span.textContent = el.classList.contains('open') ? 'Fechar Detalhes' : 'Ver Coberturas Detalhadas';
        }
    };
});
