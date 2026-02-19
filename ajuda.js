document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.doc-section');
    const searchInput = document.getElementById('help-search');
    const faqQuestions = document.querySelectorAll('.faq-question');

    // Navegação lateral
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetId = link.getAttribute('data-target');

            // Atualiza sidebar
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Atualiza conteúdo
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // Scroll para o topo do conteúdo no mobile
            if (window.innerWidth <= 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // Acordeão FAQ
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('open');
            const span = q.querySelector('span');
            span.textContent = item.classList.contains('open') ? '-' : '+';
        });
    });

    // Busca Simples
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();

        if (term.length < 2) {
            // Se busca curta, volta para a intro ou mantém a última
            return;
        }

        sections.forEach(section => {
            const text = section.innerText.toLowerCase();
            if (text.includes(term)) {
                // Ativa a primeira seção que encontrar o termo
                activateSection(section.id);
            }
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
});
