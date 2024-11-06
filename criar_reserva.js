// Variável para guardar o quarto selecionado
let quartoSelecionado = null;

// Função para buscar quartos disponíveis com base nas datas fornecidas
async function buscarQuartosDisponiveis() {
    const data_entrada = document.getElementById('data-entrada').value;
    const data_saida = document.getElementById('data-saida').value;

    if (!data_entrada || !data_saida) {
        alert("Por favor, preencha ambas as datas.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/quartos_disponiveis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data_entrada, data_saida })
        });

        if (!response.ok) {
            alert("Erro ao buscar quartos. Verifique as datas e tente novamente.");
            return;
        }

        const quartos = await response.json();
        const listaQuartos = document.getElementById('lista-quartos');
        listaQuartos.innerHTML = ''; // Limpa a tabela antes de popular

        if (quartos.length === 0) {
            listaQuartos.innerHTML = '<tr><td colspan="6">Nenhum quarto disponível para o período selecionado.</td></tr>';
        } else {
            quartos.forEach(quarto => {
                const statusLimpeza = quarto.status_limpeza ? "Limpo" : "Aguardando Limpeza";
                listaQuartos.innerHTML += `
                    <tr>
                        <td>${quarto.n_quarto}</td>
                        <td>${quarto.andar}</td>
                        <td>${quarto.tema_quarto}</td>
                        <td>R$ ${quarto.val_diaria}</td>
                        <td>${statusLimpeza}</td>
                        <td><button onclick="selecionarQuarto(${quarto.n_quarto})">Selecionar</button></td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        alert("Erro ao buscar quartos. Tente novamente mais tarde.");
    }
}

// Função para selecionar o quarto desejado para a reserva
function selecionarQuarto(nQuarto) {
    quartoSelecionado = nQuarto;
    document.getElementById('n-quarto').value = nQuarto; // Preenche o campo com o número do quarto
    alert("Quarto Nº " + nQuarto + " selecionado para reserva.");
}

// Função para criar uma reserva com os dados fornecidos
async function criarReserva() {
    const cpfHospede = document.getElementById('cpf-hospede').value; // Corrigido o ID
    const dataEntrada = document.getElementById('data_entrada').value; // Corrigido o ID
    const dataSaida = document.getElementById('data_saida').value; // Corrigido o ID
    const nQuarto = document.getElementById('n-quarto').value; // Corrigido o ID

    if (!cpfHospede || !dataEntrada || !dataSaida || !nQuarto) {
        alert("Por favor, preencha todos os campos para a reserva.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/criar_reserva', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data_entrada: dataEntrada,
                data_saida: dataSaida,
                n_quarto: nQuarto,
                cpf_hospede: cpfHospede
            })
        });

        if (!response.ok) {
            alert("Erro ao criar a reserva. Verifique as informações e tente novamente.");
            return;
        }

        alert("Reserva criada com sucesso!");
    } catch (error) {
        alert("Erro ao criar a reserva. Tente novamente mais tarde.");
    }
}
