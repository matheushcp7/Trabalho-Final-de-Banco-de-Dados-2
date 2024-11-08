async function matarSecretaria() {
    // Obtém o nome da secretária a ser "excluída" do input
    const nomeSecretaria = document.getElementById('nome-secretaria').value;

    // Verifica se o campo de nome está preenchido
    if (!nomeSecretaria) {
        alert("Por favor, insira o nome da secretária.");
        return;
    }

    try {
        // Faz a requisição para a rota /matarSecretaria na porta 3000
        const response = await fetch('http://localhost:3000/matarSecretaria', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome: nomeSecretaria })
        });

        // Verifica a resposta da requisição
        if (response.ok) {
            alert("Secretária matada com sucesso!");
        } else {
            const data = await response.json();
            const errorMessage = data.error || 'Erro desconhecido ao excluir a secretária.';
            alert("Erro ao matar secretaria:"+errorMessage);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao excluir a secretária. Tente novamente mais tarde.");
    }
}
