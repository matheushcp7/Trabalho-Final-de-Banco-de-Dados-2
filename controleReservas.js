document.addEventListener('DOMContentLoaded', () => {
    console.log("entrou no controle de reservas");
    fetch('http://localhost:3000/reservas')
        .then(response => response.json())
        .then(data => {
            const listaReservas = document.getElementById('lista-reservas');
            console.log(data);
            data.forEach(reserva => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reserva.n_quarto}</td>
                    <td>${reserva.cpf_hospede}</td>
                    <td>${reserva.data_entrada}</td>
                    <td>${reserva.data_saida}</td>
                `;
                listaReservas.appendChild(tr);
            });
            console.log("entrou no servidor");
        })
        .catch(error => console.error('Erro ao buscar reservas:', error));
});
