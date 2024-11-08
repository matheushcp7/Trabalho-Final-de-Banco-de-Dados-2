document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando o carregamento do cardápio.");

    fetch('http://localhost:3000/produtosEstoque')
        .then(response => {
            console.log("Resposta do servidor recebida:", response);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const listaCardapio = document.getElementById('lista-cardapio');

            data.forEach(cardapio => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cardapio.prato}</td>
                    <td>${formatarPreco(cardapio.preco)}</td>
                    <td>${cardapio.ingrediente}</td>
                    <td>${cardapio.fornecedor}</td>
                `;
                listaCardapio.appendChild(tr);
            });
        })
        .catch(error => {
            const errorMessage = document.getElementById('error-message');
            const divError = document.getElementById('divError');

            if (errorMessage && divError) {
                errorMessage.textContent = error.message || 'Erro desconhecido ao carregar o cardápio.';
                errorMessage.style.color = '#ff0000';
                errorMessage.style.fontWeight = 'bold';
                errorMessage.style.display = 'block';

                divError.style.backgroundColor = '#ffffff';
            } else {
                console.error("Elemento 'error-message' ou 'divError' não encontrado no DOM.");
            }
        });
});

function formatarPreco(preco) {
    return `R$ ${preco}`;
}
