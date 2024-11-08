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
    document.getElementById('n_quarto').value = nQuarto; // Preenche o campo com o número do quarto
    alert("Quarto Nº " + nQuarto + " selecionado para reserva.");
}

// Função para criar uma reserva com os dados fornecidos
async function criarReserva() {
    // Captura os dados do formulário
    const cpfHospede = document.getElementById('cpf_hospede').value;
    const dataEntrada = document.getElementById('data_entrada').value;
    const dataSaida = document.getElementById('data_saida').value;
    const nQuarto = document.getElementById('n_quarto').value;
    const codPagamento = document.getElementById('cod_pagamento').value;
    const metodoPagamento = document.getElementById('metodo_pagamento').value;
    const valorPagamento = document.getElementById('valor').value;

    // Verifica se todos os campos estão preenchidos
    if (!cpfHospede || !dataEntrada || !dataSaida || !nQuarto || !codPagamento || !metodoPagamento || !valorPagamento) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        // Faz a requisição POST para o servidor com os dados completos
        const response = await fetch('http://localhost:3000/criar_reserva', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data_entrada: dataEntrada,
                data_saida: dataSaida,
                n_quarto: nQuarto,
                cpf_hospede: cpfHospede,
                cod_pagamento: codPagamento,
                metodo_pagamento: metodoPagamento,
                valor: valorPagamento
            })
        });

        // Verifica a resposta do servidor
        if (!response.ok) {
            alert("Erro ao criar a reserva. Verifique as informações e tente novamente.");
            return;
        }

        alert("Reserva criada com sucesso!");
    } catch (error) {
        console.error("Erro ao criar a reserva:", error);
        alert("Erro ao criar a reserva. Tente novamente mais tarde.");
    }
}
