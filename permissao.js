// arquivo: permissao.js

document.addEventListener("DOMContentLoaded", function() {
    // Função para pegar as permissões do servidor
    function fetchPermissions() {
        fetch('http://localhost:3000/permissoes')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.getElementById('lista-permissao');
                if (data.length > 0) {
                    data.forEach(row => {
                        const tr = document.createElement('tr');
                        const tdTable = document.createElement('td');
                        const tdPermissions = document.createElement('td');
                        
                        tdTable.textContent = row.table;
                        tdPermissions.textContent = row.permissions;
                        
                        tr.appendChild(tdTable);
                        tr.appendChild(tdPermissions);
                        tableBody.appendChild(tr);
                    });
                } else {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = 2;
                    td.textContent = "Nenhuma permissão encontrada.";
                    tr.appendChild(td);
                    tableBody.appendChild(tr);
                }
            })
            .catch(error => {
                console.error("Erro ao buscar permissões:", error);
                const tableBody = document.getElementById('lista-permissao');
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 2;
                td.textContent = "Erro ao carregar permissões.";
                tr.appendChild(td);
                tableBody.appendChild(tr);
            });
    }

    // Chama a função de buscar permissões assim que a página for carregada
    fetchPermissions();
});
