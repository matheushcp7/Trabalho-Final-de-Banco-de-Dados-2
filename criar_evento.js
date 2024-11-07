async function criarEvento() {
    const idEvento = document.getElementById('id-evento').value;
    const nomeEvento = document.getElementById('nome-evento').value;
    const dataEvento = document.getElementById('data-evento').value;
    const custos = document.getElementById('custos').value;
    const localizacao = document.getElementById('localizacao').value;
    const numeroParticipantes = document.getElementById('numeroparticipantes').value;
    const capacidadeEvento = document.getElementById('capacidade-evento').value;
    const temaEvento = document.getElementById('tema-evento').value;

    // Verifica se todos os campos estão preenchidos
    if (!idEvento ||numeroParticipantes>capacidadeEvento || !nomeEvento || !dataEvento || !custos || !localizacao || !numeroParticipantes || !capacidadeEvento || !temaEvento) {
        alert("Por favor, preencha todos os campos para o evento. Verifique se o numero de participantes não é maior que a capacidade");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/criar_evento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_evento: idEvento,
                nome_evento: nomeEvento,
                data_evento: dataEvento,
                custos: custos,
                localizacao: localizacao,
                numeroparticipantes: numeroParticipantes,
                capacidade_evento: capacidadeEvento,
                tema_evento: temaEvento
            })
        });

        if (!response.ok) {
            alert("Erro ao criar o evento. Verifique as informações e tente novamente.");
            return;
        }

        alert("Evento criado com sucesso!");
    } catch (error) {
        alert("Erro ao criar o evento. Tente novamente mais tarde.");
    }
}
