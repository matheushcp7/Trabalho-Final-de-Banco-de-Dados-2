// Função para preencher o formulário com os dados do evento
function preencherFormularioComDados() {
    const params = new URLSearchParams(window.location.search);
    document.getElementById("id_evento").value = params.get("id_evento") || "";
    document.getElementById("nome_evento").value = params.get("nome_evento") || "";
    document.getElementById("data_evento").value = formatarData(params.get("data_evento")) || "";
    document.getElementById("custos").value = params.get("custos") || "";
    document.getElementById("localizacao").value = params.get("localizacao") || "";
    document.getElementById("numeroParticipantes").value = params.get("numeroParticipantes") || "";
    document.getElementById("capacidade_evento").value = params.get("capacidade_evento") || "";
    document.getElementById("tema_evento").value = params.get("tema_evento") || "";
}

function formatarData(data) {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // Meses começam do 0, por isso somamos 1
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Função para atualizar o evento ao enviar o formulário
function alterarEvento(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const dadosOriginais = new URLSearchParams(window.location.search); // Para obter valores originais

    const dadosAtualizados = {
        id_evento: dadosOriginais.get("id_evento"),
        nome_evento_novo: document.getElementById('nome_evento').value,
        data_evento_novo: document.getElementById('data_evento').value,
        custos_novo: document.getElementById('custos').value,
        localizacao_novo: document.getElementById('localizacao').value,
        numeroParticipantes_novo: document.getElementById('numeroParticipantes').value,
        capacidade_evento_novo: document.getElementById('capacidade_evento').value,
        tema_evento_novo: document.getElementById('tema_evento').value,
    };

    fetch('http://localhost:3000/alterarEvento', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...dadosOriginais, // Dados originais da URL
            ...dadosAtualizados // Dados novos do formulário
        }),
    })
    .then(response => {
        if (response.ok) {
            alert('Evento atualizado com sucesso!');
            window.location.href = 'proximosEventos.html'; // Redireciona para a página de eventos
        } else {
            alert('Erro ao atualizar o evento.');
            console.log("Erro: ", response);
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar evento:', error);
    });
}

// Ao carregar a página, preenche os dados no formulário e adiciona o evento de submit
document.addEventListener('DOMContentLoaded', () => {
    preencherFormularioComDados();
    document.getElementById('form-alterar-evento').addEventListener('submit', alterarEvento);
});
