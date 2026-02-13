document.addEventListener('DOMContentLoaded', () => {
    // Selectores
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminModal = document.getElementById('admin-modal');
    const closeAdminModal = document.getElementById('close-admin-modal');
    const adminAuthSection = document.getElementById('admin-auth-section');
    const adminPanelSection = document.getElementById('admin-panel-section');
    const authBtn = document.getElementById('auth-btn');
    const adminCodeInput = document.getElementById('admin-code');
    const adminContent = document.getElementById('admin-content');

    const memberFormModal = document.getElementById('member-form-modal');
    const closeMemberModal = document.getElementById('close-member-modal');
    const memberForm = document.getElementById('member-form');
    const addMemberBtn = document.getElementById('add-member-btn');
    const formDeptSelect = document.getElementById('form-dept');
    const deleteMemberBtn = document.getElementById('delete-member-btn');

    // Novos selectores para Áreas
    const addDeptBtn = document.getElementById('add-dept-btn');
    const newDeptInput = document.getElementById('new-dept-name');

    let currentData = null;
    let userAuthCode = ''; // Armazena o código inserido pelo usuário

    // Criar nova área
    addDeptBtn.onclick = () => {
        const name = newDeptInput.value.trim();
        if (!name) return alert('Insira um nome para a área');

        const newDept = {
            id: `dept_${Date.now()}`,
            name: name,
            members: []
        };

        // Adiciona por padrão na categoria interna
        currentData.categories.internal.push(newDept);
        newDeptInput.value = '';
        renderAdminList();
        populateDeptSelect();
        alert(`Área "${name}" preparada! Não esqueça de Salvar as alterações.`);
    };

    // Abrir modal admin
    adminLoginBtn.onclick = () => {
        adminModal.style.display = 'flex';
        adminAuthSection.style.display = 'block';
        adminPanelSection.style.display = 'none';
        adminCodeInput.value = '';
    };

    // Autenticação (Agora valida apenas se não está vazio localmente, a validação real ocorre no servidor)
    authBtn.onclick = () => {
        const enteredCode = adminCodeInput.value.trim();
        if (enteredCode !== '') {
            userAuthCode = enteredCode;
            loadAdminPanel();
        } else {
            alert('Insira um código!');
        }
    };

    function loadAdminPanel() {
        adminAuthSection.style.display = 'none';
        adminPanelSection.style.display = 'block';

        // Pegar dados atuais do app.js (ou recarregar)
        fetch('data.json')
            .then(res => res.json())
            .then(data => {
                currentData = data;
                renderAdminList();
                populateDeptSelect();
            });
    }

    function populateDeptSelect() {
        formDeptSelect.innerHTML = '';
        const allDepts = [
            ...currentData.categories.internal,
            ...currentData.categories.external
        ];

        allDepts.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            formDeptSelect.appendChild(option);
        });
    }

    async function moveDept(cat, index, direction) {
        const categories = currentData.categories[cat];
        if (direction === 'up' && index > 0) {
            [categories[index], categories[index - 1]] = [categories[index - 1], categories[index]];
        } else if (direction === 'down' && index < categories.length - 1) {
            [categories[index], categories[index + 1]] = [categories[index + 1], categories[index]];
        }

        // Re-atualizar displayOrder baseada no novo array
        categories.forEach((d, i) => d.displayOrder = i + 1);

        renderAdminList();
        await saveData("Ordenar áreas");
    }

    function renderAdminList() {
        adminContent.innerHTML = '';

        // Renderizamos as categorias separadamente para manter a ordenação dentro de cada uma
        ['internal', 'external'].forEach(cat => {
            const categories = currentData.categories[cat];

            categories.forEach((dept, index) => {
                const deptHeaderContainer = document.createElement('div');
                deptHeaderContainer.className = 'admin-dept-header';
                deptHeaderContainer.style.display = 'flex';
                deptHeaderContainer.style.justifyContent = 'space-between';
                deptHeaderContainer.style.alignItems = 'center';
                deptHeaderContainer.style.margin = '2rem 0 0.8rem 0';
                deptHeaderContainer.style.padding = '0.5rem 0';
                deptHeaderContainer.style.borderBottom = '2px solid #edf2f7';

                deptHeaderContainer.innerHTML = `
                    <h3 style="font-size: 1rem; color: var(--primary); margin: 0;">${dept.name} ${cat === 'external' ? '(Externo)' : ''}</h3>
                    <div class="dept-order-controls">
                        <button class="btn-order move-up" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button class="btn-order move-down" ${index === categories.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                `;

                deptHeaderContainer.querySelector('.move-up').onclick = () => moveDept(cat, index, 'up');
                deptHeaderContainer.querySelector('.move-down').onclick = () => moveDept(cat, index, 'down');

                adminContent.appendChild(deptHeaderContainer);

                dept.members.forEach(member => {
                    const item = document.createElement('div');
                    item.className = 'admin-item';
                    item.innerHTML = `
                        <div class="admin-item-info">
                            <h4>${member.name}</h4>
                            <p>${member.role}</p>
                        </div>
                        <div class="admin-item-actions">
                            <button class="btn-outline-small edit-btn" data-id="${member.id}">Editar</button>
                        </div>
                    `;

                    item.querySelector('.edit-btn').onclick = () => openEditForm(member, dept.id);
                    adminContent.appendChild(item);
                });
            });
        });
    }


    function populateSubstituteSelect(currentMemberId) {
        const substituteSelect = document.getElementById('vacation-substitute');
        substituteSelect.innerHTML = '<option value="">Selecione um substituto...</option>';

        ['internal', 'external'].forEach(cat => {
            currentData.categories[cat].forEach(dept => {
                dept.members.forEach(m => {
                    if (m.id !== currentMemberId) {
                        const option = document.createElement('option');
                        option.value = m.id;
                        option.textContent = `${m.name} (${dept.name})`;
                        substituteSelect.appendChild(option);
                    }
                });
            });
        });
    }

    function openEditForm(member, deptId) {
        document.getElementById('form-title').textContent = member ? 'Editar Colaborador' : 'Novo Colaborador';
        document.getElementById('edit-member-id').value = member ? member.id : '';
        document.getElementById('form-name').value = member ? member.name : '';
        document.getElementById('form-role').value = member ? member.role : '';
        document.getElementById('form-dept').value = deptId || '';
        document.getElementById('form-email').value = (member && member.email) ? member.email : '';
        document.getElementById('form-function').value = (member && member.function) ? member.function : '';

        // Campos de férias
        document.getElementById('vacation-start').value = (member && member.vacationStart) ? member.vacationStart : '';
        document.getElementById('vacation-end').value = (member && member.vacationEnd) ? member.vacationEnd : '';

        populateSubstituteSelect(member ? member.id : null);
        document.getElementById('vacation-substitute').value = (member && member.substituteId) ? member.substituteId : '';

        deleteMemberBtn.style.display = member ? 'block' : 'none';
        memberFormModal.style.display = 'flex';
    }

    addMemberBtn.onclick = () => openEditForm(null, currentData.categories.internal[0].id);


    // Função reutilizável para salvar os dados no GitHub
    async function saveData(commitMessage) {
        try {
            const WORKER_URL = '/api/update';

            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newData: currentData,
                    commitMessage: commitMessage,
                    authCode: userAuthCode
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Alterações salvas com sucesso no GitHub!');
                renderAdminList();
                memberFormModal.style.display = 'none';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar no GitHub: ' + error.message + '\n\nSuas alterações foram mantidas apenas nesta sessão.');
        }
    }

    // Lógica de Salvar (Add/Edit)
    memberForm.onsubmit = async (e) => {
        e.preventDefault();

        const submitBtn = memberForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';

        const id = document.getElementById('edit-member-id').value;
        const name = document.getElementById('form-name').value;
        const role = document.getElementById('form-role').value;
        const deptId = document.getElementById('form-dept').value;
        const email = document.getElementById('form-email').value;
        const functionText = document.getElementById('form-function').value;
        const vacationStart = document.getElementById('vacation-start').value;
        const vacationEnd = document.getElementById('vacation-end').value;
        const substituteId = document.getElementById('vacation-substitute').value;

        const newMember = {
            id: id || `mem_${Date.now()}`,
            name,
            role,
            email,
            function: functionText,
            vacationStart,
            vacationEnd,
            substituteId
        };


        // Snapshot dos dados antes da alteração (para rollback se der erro)
        // const oldData = JSON.parse(JSON.stringify(currentData)); // Not used after refactor

        if (id) removeMemberById(id);
        addMemberToDept(newMember, deptId);

        await saveData(`Atualização: ${name} (${role})`);

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    };

    deleteMemberBtn.onclick = async () => {
        const id = document.getElementById('edit-member-id').value;
        const name = document.getElementById('form-name').value;

        if (confirm(`Tem certeza que deseja excluir ${name}?`)) {
            removeMemberById(id);
            await saveData(`Remoção: ${name}`);
        }
    };

    function removeMemberById(id) {
        ['internal', 'external'].forEach(cat => {
            currentData.categories[cat].forEach(dept => {
                dept.members = dept.members.filter(m => m.id !== id);
            });
        });
    }

    function addMemberToDept(member, deptId) {
        ['internal', 'external'].forEach(cat => {
            currentData.categories[cat].forEach(dept => {
                if (dept.id === deptId) {
                    dept.members.push(member);
                }
            });
        });
    }

    // Adicionar botão de download temporário para facilitar
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-outline-small';
    downloadBtn.textContent = 'Baixar JSON Atualizado';
    downloadBtn.style.marginTop = '1rem';
    downloadBtn.onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };
    adminPanelSection.appendChild(downloadBtn);

    // Fechar modais
    closeAdminModal.onclick = () => adminModal.style.display = 'none';
    closeMemberModal.onclick = () => memberFormModal.style.display = 'none';
});

