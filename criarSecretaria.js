async function cadastrarSecretaria() {
    const nome = document.getElementById('nome-secretaria').value;
    const senha = document.getElementById('senha-secretaria').value;

    if (!nome || !senha) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/cadastrar_secretaria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome, senha: senha })
        });

        if (!response.ok) {
            alert("Erro ao cadastrar a secretária.");
            return;
        }

        alert("Secretária cadastrada com sucesso!");
    } catch (error) {
        alert("Erro ao cadastrar a secretária. Tente novamente mais tarde.");
    }
}