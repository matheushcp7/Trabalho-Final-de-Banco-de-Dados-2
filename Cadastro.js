document.getElementById('hospedeForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita o envio padrão do formulário
    const formData = new FormData(this); // Cria FormData a partir do formulário

    try {
        const response = await fetch('http://localhost:3000/hospede', {
            method: 'POST',
            body: formData // Envia FormData diretamente (com foto inclusa)
        });

        if (response.ok) {
            alert('Hóspede cadastrado com sucesso!');
        } else {
            alert('Erro ao cadastrar hóspede.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao tentar cadastrar hóspede.');
    }
});
