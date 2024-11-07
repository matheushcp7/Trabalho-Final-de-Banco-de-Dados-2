document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando o carregamento do relatório de caixa.");

    fetch('http://localhost:3000/relatorio_caixa_mensal')
        .then(response => {
            console.log("Resposta do servidor recebida:", response);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const listaMensal = document.getElementById('lista-mensal');

            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.total}</td>
                    <td>${item.tipo}</td>
                `;
                listaMensal.appendChild(tr);
            });
        })
        .catch(error => {
            const errorMessage = document.getElementById('error-message');
            const divError = document.getElementById('divError');

            if (errorMessage && divError) {
                errorMessage.textContent = error;
                errorMessage.style.color = '#ff0000';
                errorMessage.style.fontWeight = 'bold';
                errorMessage.style.display = 'block';

                divError.style.backgroundColor = '#ffffff';
            } else {
                console.error("Elemento 'error-message' ou 'divError' não encontrado no DOM.");
            }
        });
});
