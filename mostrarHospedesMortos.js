document.addEventListener('DOMContentLoaded', () => {
    console.log("Carregando a lista de hóspedes mortos.");

    fetch('http://localhost:3000/hospedes_mortos')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const listaMortos = document.getElementById('lista-mortos');
            
            data.forEach(hospede => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${hospede.cpf_hosp}</td>
                    <td>${hospede.nome_hosp}</td>
                    <td>${hospede.telefone}</td>
                    <td>${hospede.email}</td>
                    <td>${hospede.estagio_de_vida}</td>
                    <td>${hospede.especie}</td>
                `;
                listaMortos.appendChild(tr);
            });
        })
        .catch(error => {
            const errorMessage = document.getElementById('error-message');
            const divError = document.getElementById('divError');

            if (errorMessage && divError) {
                errorMessage.textContent = error;
                errorMessage.style.color = '#ff0000';
                errorMessage.style.fontWeight = 'bold';
                errorMessage.style.display = 'block';

                divError.style.backgroundColor = '#ffffff';
            } else {
                console.error("Elemento 'error-message' ou 'divError' não encontrado no DOM.");
            }
        });
});
