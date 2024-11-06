document.getElementById('BuscaCPF').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita o envio padrão do formulário
    const cpf = event.target[0].value; // Captura o CPF exatamente como foi digitado

    if (!cpf) {
        alert('Por favor, insira um CPF.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/BuscaCPF', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf }) // Envia o CPF no corpo da requisição
        });

        if (response.ok) {
            const data = await response.json();

            if (data && data.nome_hosp) { // Verifica se 'data' contém os dados esperados
                
                document.getElementById('profileContainer').style.display = 'block';
                document.getElementById('profileName').innerText = 'Nome: ' + data.nome_hosp;
                document.getElementById('profileCpf').innerText = 'CPF: ' + data.cpf_hosp;
                document.getElementById('profileTelefone').innerText = 'Telefone: ' + data.telefone;
                document.getElementById('profileEmail').innerText = 'Email: ' + data.email;
                document.getElementById('profileEspecie').innerText = 'Espécie: ' + data.especie;
                document.getElementById('profileEstagio').innerText = 'Estágio de Vida: ' + data.estagio_de_vida;

                // Se a foto for retornada como um Blob ou base64, ajuste a linha abaixo:
                const imgElement = document.getElementById('profileImage');
                imgElement.src = data.foto; 
                imgElement.style.display = 'block'; // Torna a imagem visível
                console.log(data);
            } else {
                alert('Hóspede não encontrado.');
            }
        } else {
            const errorData = await response.json();
            alert('Erro: ' + errorData.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao tentar buscar hóspede no js. ' + error.message);
    }
});