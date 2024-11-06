document.getElementById('pagamentoForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita o envio padrão do formulário
    
    const formData = new FormData(this); // Cria FormData a partir do formulário

    // Captura o arquivo da nota fiscal e o tipo
    const notaFiscal = formData.get('nota_fiscal');
    const tipoDocumento = notaFiscal ? notaFiscal.type : null;
    
    // Adiciona o tipo do documento ao FormData
    formData.append('tipo_documento', tipoDocumento);

    try {
        const response = await fetch('http://localhost:3000/pagamento', {
            method: 'POST',
            body: formData // Envia FormData diretamente (com foto inclusa)
        });

        if (response.ok) {
            alert('Pagamento cadastrado com sucesso!');
        } else {
            alert('Erro ao cadastrar pagamento.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao tentar cadastrar pagamento.');
    }
});
