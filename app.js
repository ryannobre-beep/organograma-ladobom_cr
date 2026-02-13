document.addEventListener('DOMContentLoaded', () => {
    const orgRoot = document.getElementById('org-root');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('detail-modal');
    const modalData = document.getElementById('modal-data');
    const closeModal = document.querySelector('.close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let companyData = null;
    let currentCategory = 'internal';

    fetch('/api/data')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            companyData = data;
            renderOrg(data.categories[currentCategory]);
            renderVacationGlobalSummary(data);
        })
        .catch(async (error) => {
            console.error('Erro ao carregar dados:', error);

            let detailedError = error.message;
            let debugInfo = '';

            // Tenta pegar o JSON de erro se for 500
            try {
                if (detailedError.includes('500')) {
                    // Nota: Isso é simplificado, o erro no catch do fetch geralmente é de rede 
                    // a menos que o throw manual no .then(response) seja disparado.
                }
            } catch (e) { }

            orgRoot.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #718096; max-width: 600px; margin: 0 auto;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">⚠️ Erro ao carregar dados em tempo real.</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem;">
                        Certifique-se de que o <strong>CODA_DOC_ID</strong> no Cloudflare é exatamente: <code>NqBfudo5pw</code> (sem o "d" no início).
                    </p>
                    <p style="font-size: 0.8rem; margin-top: 1.5rem; opacity: 0.7;">
                        Detalhe técnico: ${detailedError}<br>
                        ${debugInfo}
                    </p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; border: 1px solid #cbd5e0; background: white;">Tentar Novamente</button>
                </div>
            `;
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
                        <h2>Equipe em Férias</h2>
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
        if (!id) return '';
        let name = null;
        ['internal', 'external'].forEach(cat => {
            if (!companyData.categories[cat]) return;
            companyData.categories[cat].forEach(dept => {
                const found = dept.members.find(m => m.id === id);
                if (found) name = found.name;
            });
        });
        return name || id; // Retorna o próprio ID se não encontrar (pode ser um nome digitado no Coda)
    }

    // Modal close logic
    closeModal.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };
});
