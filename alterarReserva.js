// Função para obter os parâmetros da URL
function obterParametrosDaURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        n_quarto: params.get('n_quarto'),
        cpf_hospede: params.get('cpf_hospede'),
        data_entrada: params.get('data_entrada'),
        data_saida: params.get('data_saida')
    };
}

function formatarData(data) {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // Meses começam do 0, por isso somamos 1
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para preencher o formulário com os dados da reserva
function preencherFormularioComDados() {
    const dadosReserva = obterParametrosDaURL();
    document.getElementById('n_quarto').value = dadosReserva.n_quarto;
    document.getElementById('cpf_hospede').value = dadosReserva.cpf_hospede;
    document.getElementById('data_entrada').value = formatarData(dadosReserva.data_entrada);
    document.getElementById('data_saida').value = formatarData(dadosReserva.data_saida);
}


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




// Função para obter os parâmetros da URL
function obterParametrosDaURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        n_quarto: params.get('n_quarto'),
        cpf_hospede: params.get('cpf_hospede'),
        data_entrada: params.get('data_entrada'),
        data_saida: params.get('data_saida')
    };
}

function formatarData(data) {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // Meses começam do 0, por isso somamos 1
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para preencher o formulário com os dados da reserva
function preencherFormularioComDados() {
    const dadosReserva = obterParametrosDaURL();
    document.getElementById('n_quarto').value = dadosReserva.n_quarto;
    document.getElementById('cpf_hospede').value = dadosReserva.cpf_hospede;
    document.getElementById('data_entrada').value = formatarData(dadosReserva.data_entrada);
    document.getElementById('data_saida').value = formatarData(dadosReserva.data_saida);
}

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

// Função para atualizar a reserva ao enviar o formulário
function alterarReserva(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const n_quarto = document.getElementById('n_quarto').value;
    const cpf_hospede = document.getElementById('cpf_hospede').value;
    const data_entrada = document.getElementById('data_entrada').value;
    const data_saida = document.getElementById('data_saida').value;

    // Obtendo os dados que foram passados pela URL para a condição WHERE
    const dadosReserva = obterParametrosDaURL();

    // Verifique se os dados de entrada foram alterados. Caso contrário, mantenha os dados originais.
    fetch('http://localhost:3000/alterarReserva', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            // Passar os dados originais para a condição WHERE
            n_quarto_antigo: dadosReserva.n_quarto,
            cpf_hospede_antigo: dadosReserva.cpf_hospede,
            data_entrada_antigo: dadosReserva.data_entrada,
            data_saida_antigo: dadosReserva.data_saida,
            // Passar os novos dados que serão atualizados
            n_quarto_novo: n_quarto,
            cpf_hospede_novo: cpf_hospede,
            data_entrada_novo: data_entrada,
            data_saida_novo: data_saida,
        }),
    })
    .then(response => {
        if (response.ok) {
            alert('Reserva atualizada com sucesso!');
            window.location.href = 'controleReservas.html'; // Redireciona para a página de controle
        } else {
            alert('Erro ao atualizar a reserva.');
            console.log("Erro: ", response);
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar reserva:', error);
    });
}

// Ao carregar a página, preenche os dados no formulário e adiciona o evento de submit
document.addEventListener('DOMContentLoaded', () => {
    preencherFormularioComDados(); // Preenche o formulário com os dados da reserva
    document.getElementById('form-alterar-reserva').addEventListener('submit', alterarReserva); // Adiciona o evento de submit
});


// Ao carregar a página, preenche os dados no formulário e adiciona o evento de submit
document.addEventListener('DOMContentLoaded', () => {
    preencherFormularioComDados(); // Preenche o formulário com os dados da reserva
    document.getElementById('form-alterar-reserva').addEventListener('submit', alterarReserva); // Adiciona o evento de submit
});
