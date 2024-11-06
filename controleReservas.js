document.addEventListener('DOMContentLoaded', () => {
    console.log("entrou no controle de reservas");
    fetch('http://localhost:3000/reservas')
        .then(response => response.json())
        .then(data => {
            const listaReservas = document.getElementById('lista-reservas');
            data.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.n_quarto}</td>
                    <td>${reserva.cpf_hospede}</td>
                    <td>${formatarData(reserva.data_entrada)}</td>
                    <td>${formatarData(reserva.data_saida)}</td>
                    <td>
                        <button onclick="excluirReserva('${reserva.data_saida}', '${reserva.data_entrada}', ${reserva.n_quarto}, '${reserva.cpf_hospede}')" class="btn btn-danger">Excluir</button>
                    </td>
                    <td>
                        <button onclick="alterarReserva('${reserva.n_quarto}', '${reserva.cpf_hospede}', '${reserva.data_entrada}', '${reserva.data_saida}')" class="btn btn-primary">Alterar</button>
                    </td>
                `;
                listaReservas.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Erro ao buscar reservas:', error);
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = 'VOCÊ NÃO TEM PERMISSÃO DE ESTAR AQUI, TENTE NOVAMENTE E SOFRA COM AS CONSEQUENCIAS';
            errorMessage.style.color = '#ff0000'; // Define a cor do texto como vermelho forte
            errorMessage.style.fontWeight = 'bold';
            errorMessage.style.display = 'block';
            const divError = document.getElementById('divError');
            divError.style.backgroundColor = '#ffffff';
        });
});

// Função para excluir reserva
function excluirReserva(data_saida, data_entrada, n_quarto, cpf_hosp) {
    if (confirm('Tem certeza que deseja excluir esta reserva?')) {
        fetch('http://localhost:3000/reservas', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data_saida, data_entrada, n_quarto, cpf_hosp }),
        })
        .then(response => {
            if (response.ok) {
                alert('Reserva excluída com sucesso!');
                window.location.reload(); // Recarrega a página para atualizar a lista de reservas
            } else {
                alert('Erro ao excluir reserva.');
            }
        })
        .catch(error => {
            console.error('Erro ao excluir reserva:', error);
        });
    }
}

// Função para redirecionar para a página de alteração de reserva
function alterarReserva(n_quarto, cpf_hospede, data_entrada, data_saida) {
    // Codifica os parâmetros na URL
    const url = `alterarReserva.html?n_quarto=${n_quarto}&cpf_hospede=${cpf_hospede}&data_entrada=${encodeURIComponent(data_entrada)}&data_saida=${encodeURIComponent(data_saida)}`;
    // Redireciona para a página alterarReserva.html com os dados da reserva
    window.location.href = url;
}


// Função para formatar a data
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
