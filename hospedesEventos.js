document.getElementById('buscar-hospedes').addEventListener('click', async function(event) {
    event.preventDefault(); // Evita o comportamento padrão

    const idEvento = document.getElementById('id-evento').value; // Captura o ID do evento

    if (!idEvento) {
        alert("Por favor, insira o ID do evento.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/listarHospedesEvento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_evento: idEvento }) // Envia o ID do evento no corpo da requisição
        });

        if (response.ok) {
            const data = await response.json();

            if (data && data.length > 0) { // Verifica se há dados retornados
                const listaHospedes = document.getElementById('lista-hospedes');
                listaHospedes.innerHTML = ''; // Limpa a tabela antes de inserir novos dados

                data.forEach(hospede => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${hospede.cpf_hosp}</td>
                        <td>${hospede.nome_hosp}</td>
                        <td>${hospede.telefone}</td>
                        <td>${hospede.email}</td>
                    `;
                    listaHospedes.appendChild(tr);
                });
            } else {
                alert('Nenhum hóspede encontrado para o evento especificado.');
            }
        } else {
            const errorData = await response.json();
            alert('Erro: ' + errorData.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao buscar hóspedes: ' + error.message);
    }
});
