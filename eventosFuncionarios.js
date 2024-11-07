document.addEventListener('DOMContentLoaded', () => {
    console.log("Carregando a lista de próximos eventos.");

    fetch('http://localhost:3000/eventosFuncionarios')
        .then(response => {
            console.log("Resposta do servidor recebida:", response);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const listaEventos = document.getElementById('lista-eventos');

            data.forEach(evento => {
                const tr = document.createElement('tr');
                if(!evento.participante){
                    evento.participante = "Nenhum participante";
                }
                tr.innerHTML = `
                    <td>${evento.codigo_evento}</td>
                    <td>${evento.nome_evento}</td>
                    <td>${formatarData(evento.data)}</td>
                    <td>${evento.local}</td>
                    <td>${evento.capacidade}</td>
                    <td>${evento.organizador}</td>
                    <td>${evento.participante}</td>
                `;
                listaEventos.appendChild(tr);
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


function formatarData(data) {
    const dataObj = new Date(data); // Cria um objeto Date a partir da string
    const dia = String(dataObj.getDate()).padStart(2, '0'); // Obtém o dia e garante que tenha 2 dígitos
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Obtém o mês (0-11) e ajusta para 1-12
    const ano = dataObj.getFullYear(); // Obtém o ano
    const horas = String(dataObj.getHours()).padStart(2, '0'); // Obtém as horas
    const minutos = String(dataObj.getMinutes()).padStart(2, '0'); // Obtém os minutos

    // Retorna a data formatada
    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
}