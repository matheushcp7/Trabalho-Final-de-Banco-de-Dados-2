document.getElementById('hospedeForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita o envio padrão do formulário
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    const response = await fetch('http://localhost:3000/hospede', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    console.log(data); // Adicione esta linha para verificar o que está sendo enviado
    alert("passou do servidor")

    if (response.ok) {
        alert('Hóspede cadastrado com sucesso!');
    } else {
        alert('Erro aoo cadastrar hóspede.');
    }
});
