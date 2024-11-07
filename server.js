const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de login
let currentUser = null;

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userPool = new Pool({
    user: username,
    host: 'localhost',
    database: 'hotel_transilvania',
    password: String(password),
    port: 5432,
  });

  try {
    console.log("Tentando conectar com o banco para autenticação do usuário");
    await userPool.connect();
    res.status(200).send('Login bem-sucedido!');
    currentUser = userPool;
    console.log("Usuário autenticado e pool de conexão armazenado.");
  } catch (error) {
    console.error("Erro de autenticação: Usuário ou senha inválidos.", error.message);
    res.status(401).send('Usuário ou senha inválidos.');
  }
});

app.post('/Hospede', upload.single('foto'), async (req, res) => {
  try {
    const { cpf, nome, telefone, email, senha, especie, estagio_de_vida } = req.body;
    console.log("Iniciando o cadastro de hóspede:", cpf);

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const foto = req.file ? req.file.buffer : null;
    const tipoImagem = req.file ? req.file.mimetype : null;

    await currentUser.query(
      'INSERT INTO public.hospede (cpf_hosp, nome_hosp, telefone, email, especie, estagio_de_vida, foto, tipo_imagem) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [cpf, nome, telefone, email, especie, estagio_de_vida, foto, tipoImagem]
    );
    console.log("Hóspede cadastrado com sucesso.");

    await currentUser.query(`CREATE USER "${cpf}" WITH PASSWORD '${senha}'`);
    console.log("Usuário PostgreSQL criado para o hóspede:", cpf);

    await currentUser.query(`GRANT hospede TO "${cpf}"`);
    console.log("Permissões atribuídas ao hóspede:", cpf);

    res.status(201).send('Hóspede cadastrado e usuário PostgreSQL criado com sucesso!');
  } catch (error) {
    console.error("Erro ao cadastrar hóspede ou criar usuário PostgreSQL:", error.message);
    res.status(500).send('Erro ao cadastrar hóspede ou criar usuário PostgreSQL.');
  }
});

app.put('/alterarReserva', async (req, res) => {
  // Desestruturando os dados enviados pelo frontend
  const {
      n_quarto_novo, cpf_hospede_novo, data_entrada_novo, data_saida_novo, 
      n_quarto_antigo, cpf_hospede_antigo, data_entrada_antigo, data_saida_antigo
  } = req.body;

  try {
      // Atualizando os dados na tabela 'reserva'
      const resultado = await currentUser.query(
          `UPDATE reserva SET 
              n_quarto = $1, 
              cpf_hospede = $2, 
              data_entrada = $3, 
              data_saida = $4 
          WHERE 
              n_quarto = $5 AND 
              cpf_hospede = $6 AND 
              data_entrada = $7 AND 
              data_saida = $8 
          RETURNING *;`,
          [
              n_quarto_novo, cpf_hospede_novo, data_entrada_novo, data_saida_novo, 
              n_quarto_antigo, cpf_hospede_antigo, data_entrada_antigo, data_saida_antigo
          ]
      );
      
      // Respondendo com os dados atualizados
      res.json(resultado.rows[0]);
  } catch (err) {
      console.error('Erro ao atualizar a reserva:', err);
      res.status(500).send('Erro ao atualizar a reserva.');
  }
});



app.get('/reservas', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    console.log("Buscando reservas...");
    const result = await currentUser.query('SELECT * FROM reserva');
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao procurar reservas:", error);

    if (error.code === '42501') {
      return res.status(403).json({ error: 'Você não tem permissão para acessar essa aba.' });
    }

    res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});

app.get('/eventosFuncionarios', async (req, res) => {
  try {
      const result = await currentUser.query('SELECT codigo_evento, nome_evento, data, local, capacidade, organizador, participante FROM  visao_eventos_programados;');
      res.json(result.rows);
  } catch (error) {
      console.error("Erro ao buscar próximos eventos:", error);
      res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});


app.get('/proximosEventos', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    console.log("Buscando eventos futuros...");
    const result = await currentUser.query(`
      SELECT id_evento, nome_evento, data_evento, custos, localizacao, numeroparticipantes, capacidade_evento, tema_evento 
      FROM eventos
      WHERE data_evento > current_date
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao procurar eventos:", error);

    if (error.code === '42501') {
      return res.status(403).json({ error: 'Você não tem permissão para acessar essa aba.' });
    }

    res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});

app.get('/cardapio', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  console.log("Requisição para obter o cardápio recebida.");
  
  try {
    console.log("Tentou fazer a busca")
    const result = await currentUser.query('SELECT * FROM visao_cardapio_completo');
    console.log(result);
    res.json(result.rows);
    
  } catch (error) {
    console.error("Erro ao procurar cardápio:", error);

    if (error.code === '42501') {
      return res.status(403).json({ error: 'Você não tem permissão para acessar essa aba.' });
    }

    res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});

app.post('/quartos_disponiveis', async (req, res) => {
  // Confirma se os dados estão chegando corretamente
  console.log("Recebendo requisição em /quartos_disponiveis");

  const { data_entrada, data_saida } = req.body;  // Certifique-se de que os nomes sejam os mesmos do frontend
  
  console.log("Datas recebidas:", data_entrada, data_saida);  // Log das datas para verificar

  if (!data_entrada || !data_saida) {
    console.error("Erro: Datas de entrada e saída não fornecidas");
    return res.status(400).json({ erro: 'Datas de entrada e saída são obrigatórias.' });
  }

  if (!currentUser) {
    console.error("Erro: Usuário não autenticado");
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  try {
      console.log("Executando consulta no banco de dados com as datas:", data_entrada, data_saida);

      // Verifique se currentUser.query está configurado corretamente para fazer consultas
      const resultado = await currentUser.query('SELECT * FROM quartos_disponiveis($1, $2);', [data_entrada, data_saida]);
      
      console.log("Consulta ao banco de dados concluída com sucesso:", resultado.rows);  // Log para verificar os resultados da consulta

      const quartosDisponiveis = resultado.rows.map(quarto => ({
          n_quarto: quarto.n_quarto,
          andar: quarto.andar,
          tema_quarto: quarto.tema_quarto,
          val_diaria: quarto.val_diaria,
          status_limpeza: quarto.status_limpeza
      }));

      res.json(quartosDisponiveis);
  } catch (error) {
      console.error('Erro ao buscar quartos disponíveis:', error);
      res.status(500).json({ erro: 'Erro ao buscar quartos disponíveis' });
  }
});

app.get('/hospedes_mortos', async (req, res) => {
  try {
      const result = await currentUser.query(`
          SELECT cpf_hosp, nome_hosp, telefone, email, estagio_de_vida, especie 
          FROM hospedes_mortos
      `);
      res.json(result.rows);
  } catch (error) {
      console.error("Erro ao buscar hóspedes mortos:", error);
      res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});


app.get('/relatorio_caixa_mensal', async (req, res) => {
  try {
      const result = await currentUser.query('SELECT * FROM relatorio_mes');
      res.json(result.rows);
  } catch (error) {
      console.error("Erro ao buscar o relatório de caixa mensal:", error);
      res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});



app.post('/criar_reserva', async (req, res) => {
  const { data_entrada, data_saida, n_quarto, cpf_hospede } = req.body;

  try {
      const result = await currentUser.query(
          'INSERT INTO reserva (data_entrada, data_saida, n_quarto, cpf_hospede) VALUES ($1, $2, $3, $4)',
          [data_entrada, data_saida, n_quarto, cpf_hospede]
      );
      res.status(201).send({ message: 'Reserva criada com sucesso!' });
  } catch (error) {
      console.error('Erro ao inserir reserva:', error);
      res.status(500).send({ error: 'Erro ao criar reserva. Tente novamente.' });
  }
});

app.post('/BuscaCPF', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const { cpf } = req.body; // Recebe o CPF do corpo da requisição
  
  try {
    const result = await currentUser.query('SELECT * FROM hospede WHERE cpf_hosp = $1', [cpf]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hóspede não encontrado no servidor.' });
    }

    const hospede = result.rows[0];
    
    // Se houver uma foto, converte o campo 'foto' de BYTEA para Base64
    if (hospede.foto) {
      hospede.foto = `data:${hospede.tipo_foto};base64,${hospede.foto.toString('base64')}`;
    }

    res.json(hospede); // Retorna os dados do hóspede, incluindo a foto em formato Base64
    console.log("Hóspede encontrado:", hospede);

  } catch (error) {
    console.error('Erro ao procurar hóspede:', error.message);
    res.status(500).json({ error: 'Você não tem permissão para fazer isso, se tentar novamente sofrerá com as consequencias', details: error.message });
  }
});

app.delete('/reservas', async (req, res) => {
  const { data_saida, data_entrada, n_quarto, cpf_hosp } = req.body;
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    console.log("Excluindo reserva:", { data_saida, data_entrada, n_quarto, cpf_hosp });
    await currentUser.query(
      'DELETE FROM reserva WHERE data_saida = $1 AND data_entrada = $2 AND n_quarto = $3 AND cpf_hospede = $4',
      [data_saida, data_entrada, n_quarto, cpf_hosp]
    );
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir reserva:", error.message);
    res.status(500).json({ error: 'Erro ao excluir reserva.', details: error.message });
  }
});

app.get('/pagamentos', async (req, res) => {
  try {
      const result = await currentUser.query('SELECT cod_pagamento, data_pagamento, metodo_pagamento, valor, tipo_documento, encode(nota_fiscal, \'base64\') AS nota_fiscal FROM pagamento');
      const pagamentos = result.rows;
      res.json(pagamentos);
  } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
  }
});



app.post('/pagamento', upload.single('nota_fiscal'), async (req, res) => {
  const { cod_pagamento, data_pagamento, metodo_pagamento, valor, tipo_documento } = req.body;
  const notaFiscal = req.file ? req.file.buffer : null; // Obter o arquivo binário da nota fiscal

  if (!cod_pagamento || !data_pagamento || !metodo_pagamento || !valor || !notaFiscal || !tipo_documento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
      // Inserir no banco de dados (exemplo de inserção utilizando PostgreSQL)
      const result = await currentUser.query(
          'INSERT INTO pagamento (cod_pagamento, data_pagamento, metodo_pagamento, valor, nota_fiscal, tipo_documento) VALUES ($1, $2, $3, $4, $5, $6)',
          [cod_pagamento, data_pagamento, metodo_pagamento, valor, notaFiscal, tipo_documento]
      );
      
      res.status(200).json({ message: 'Pagamento cadastrado com sucesso!' });
  } catch (error) {
      console.error('Erro ao cadastrar pagamento:', error);
      res.status(500).json({ error: 'Erro ao cadastrar pagamento.' });
  }
});


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
