document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('http://localhost:3000/pagamentos');
        if (response.ok) {
            const pagamentos = await response.json();
            const pagamentosList = document.getElementById('pagamentosList');
            
            pagamentos.forEach(pagamento => {
                const byteCharacters = atob(pagamento.nota_fiscal);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                
                // Cria um Blob com o tipo MIME correto
                const blob = new Blob([byteArray], { type: pagamento.tipo_documento });
                const url = URL.createObjectURL(blob);
                

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pagamento.cod_pagamento}</td>
                    <td>${formatarData(pagamento.data_pagamento)}</td>
                    <td>${pagamento.metodo_pagamento}</td>
                    <td>${pagamento.valor}</td>
                    <td><a href="${url}" target="_blank">Visualizar Nota Fiscal</a></td>
                `;
                pagamentosList.appendChild(row);
            });
        } else {
            alert('Erro ao carregar pagamentos.');
        }
    } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        alert('Erro ao tentar buscar pagamentos.');
    }
});

function formatarData(data) {
    const dataObj = new Date(data); // Cria um objeto Date a partir da string
    const dia = String(dataObj.getDate()).padStart(2, '0'); // Obtém o dia e garante que tenha 2 dígitos
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Obtém o mês (0-11) e ajusta para 1-12
    const ano = dataObj.getFullYear(); // Obtém o ano
    const horas = String(dataObj.getHours()).padStart(2, '0'); // Obtém as horas
    const minutos = String(dataObj.getMinutes()).padStart(2, '0'); // Obtém os minutos

    // Retorna a data formatada
    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
}

