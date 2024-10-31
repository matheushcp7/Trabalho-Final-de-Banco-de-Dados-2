document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita o envio padrão do formulário
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        window.location.href = 'PaginaSecretaria.html'; 
    } else {
        alert('Usuário ou senha inválidos.');
    }
});

