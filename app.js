document.addEventListener('DOMContentLoaded', () => {
    const orgRoot = document.getElementById('org-root');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('detail-modal');
    const modalData = document.getElementById('modal-data');
    const closeModal = document.querySelector('.close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let companyData = null;
    let currentCategory = 'internal';

    // Load Data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            companyData = data;
            renderOrg(data.categories[currentCategory]);
            renderVacationGlobalSummary(data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados:', error);
            orgRoot.innerHTML = '<div class="error">Erro ao carregar os dados. Verifique se o servidor local está rodando.</div>';
        });

    function renderVacationGlobalSummary(data) {
        const container = document.getElementById('vacation-summary-container');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const vacationingMembers = [];

        ['internal', 'external'].forEach(cat => {
            data.categories[cat].forEach(dept => {
                dept.members.forEach(member => {
                    if (member.vacationStart && member.vacationEnd) {
                        const start = new Date(member.vacationStart);
                        const end = new Date(member.vacationEnd);
                        start.setHours(0, 0, 0, 0);
                        end.setHours(0, 0, 0, 0);

                        if (today >= start && today <= end) {
                            vacationingMembers.push({
                                name: member.name,
                                returnDate: new Date(new Date(end).setDate(end.getDate() + 1)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                            });
                        }
                    }
                });
            });
        });

        if (vacationingMembers.length > 0) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="vacation-summary-card">
                    <div class="vacation-summary-title">
                        <h2>🏝️ Equipe em Férias</h2>
                    </div>
                    <div class="vacation-summary-list">
                        ${vacationingMembers.map(m => `
                            <div class="vacation-summary-item">
                                <div class="vacation-summary-avatar">${m.name.charAt(0)}</div>
                                <div class="vacation-summary-info">
                                    <strong>${m.name}</strong>
                                    <span>Volta em ${m.returnDate}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            container.style.display = 'none';
        }
    }

    function renderOrg(departments, searchTerm = '') {
        orgRoot.innerHTML = '';
        const filteredSearch = searchTerm.toLowerCase();

        // Ordenar áreas por displayOrder
        const sortedDepartments = [...departments].sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

        sortedDepartments.forEach(dept => {
            const filteredMembers = dept.members.filter(member =>
                member.name.toLowerCase().includes(filteredSearch) ||
                member.role.toLowerCase().includes(filteredSearch) ||
                (member.function && member.function.toLowerCase().includes(filteredSearch)) ||
                dept.name.toLowerCase().includes(filteredSearch)
            );

            if (filteredMembers.length > 0) {
                const deptSection = document.createElement('section');
                deptSection.className = 'department';

                deptSection.innerHTML = `
                    <h2 class="department-title">${dept.name}</h2>
                    <div class="members-grid"></div>
                `;

                const grid = deptSection.querySelector('.members-grid');

                filteredMembers.forEach(member => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let isOnVacation = false;
                    let isNoticePeriod = false;
                    let vacationMsg = '';

                    if (member.vacationStart && member.vacationEnd) {
                        const start = new Date(member.vacationStart);
                        const end = new Date(member.vacationEnd);
                        start.setHours(0, 0, 0, 0);
                        end.setHours(0, 0, 0, 0);

                        if (today >= start && today <= end) {
                            isOnVacation = true;
                        } else if (today < start) {
                            const diffTime = Math.abs(start - today);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays <= 10) {
                                isNoticePeriod = true;
                                vacationMsg = `Férias em ${diffDays} dia(s)`;
                            }
                        }
                    }

                    const card = document.createElement('div');
                    card.className = `card ${isOnVacation ? 'card-vacation' : ''}`;
                    card.innerHTML = `
                        ${isOnVacation ? '<span class="vacation-badge">Em Férias</span>' : ''}
                        <div class="card-header">
                            ${isNoticePeriod ? `<div class="vacation-notice">🔔 ${vacationMsg}</div>` : ''}
                            <h3>${member.name}</h3>
                            <span class="role">${member.role}</span>
                        </div>
                        <div class="card-body">
                            <p>${member.function ? member.function.substring(0, 80) + '...' : 'Descrição em fase de mapeamento.'}</p>
                            ${isOnVacation && member.substituteId ? `<div class="substitute-info">Substituído(a) por: <span class="substitute-name">${getMemberNameById(member.substituteId)}</span></div>` : ''}
                        </div>
                        <div class="card-footer">
                            ${member.email ? `<a href="mailto:${member.email}" class="email-btn">📧 ${member.email}</a>` : '<span class="text-muted">Sem e-mail</span>'}
                        </div>
                    `;
                    card.addEventListener('click', (e) => {
                        if (e.target.tagName !== 'A') showDetails(member, dept.name);
                    });
                    grid.appendChild(card);
                });

                orgRoot.appendChild(deptSection);
            }
        });

        if (orgRoot.innerHTML === '') {
            orgRoot.innerHTML = '<div class="no-results">Nenhum registro encontrado.</div>';
        }
    }

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderOrg(companyData.categories[currentCategory], searchInput.value);
        });
    });

    function showDetails(member, deptName) {
        modalData.innerHTML = `
            <div style="color: var(--primary); font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 1px;">${deptName}</div>
            <h2 style="font-size: 2.2rem; color: var(--primary-dark); margin-bottom: 0.5rem; font-weight: 800;">${member.name}</h2>
            <div style="color: var(--accent); font-weight: 600; margin-bottom: 2rem; font-size: 1.1rem;">${member.role}</div>
            
            <div style="margin-bottom: 2rem;">
                <h4 style="margin-bottom: 0.8rem; color: var(--text); font-weight: 700;">Principais Funções:</h4>
                <p style="line-height: 1.7; color: #4A5568; font-size: 1rem;">${member.function || 'Informações sobre as responsabilidades deste papel estão sendo mapeadas.'}</p>
            </div>

            ${member.notes ? `
                <div style="margin-bottom: 2rem; padding: 1.2rem; background: #F7FAFC; border-left: 4px solid var(--primary-light); border-radius: 4px;">
                    <strong style="color: var(--primary-dark);">Observação:</strong> ${member.notes}
                </div>
            ` : ''}

            <div style="display: flex; gap: 1rem; margin-top: 2.5rem;">
                ${member.email ? `
                    <a href="mailto:${member.email}" style="background: var(--primary); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; flex: 1; text-align: center; transition: background 0.2s;">
                        Enviar E-mail
                    </a>
                ` : ''}
            </div>
        `;
        modal.style.display = 'flex';
    }

    // Search logic
    searchInput.addEventListener('input', (e) => {
        if (companyData) {
            renderOrg(companyData.categories[currentCategory], e.target.value);
        }
    });

    function getMemberNameById(id) {
        let name = '...';
        ['internal', 'external'].forEach(cat => {
            companyData.categories[cat].forEach(dept => {
                const found = dept.members.find(m => m.id === id);
                if (found) name = found.name;
            });
        });
        return name;
    }

    // Modal close logic
    closeModal.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };
});
