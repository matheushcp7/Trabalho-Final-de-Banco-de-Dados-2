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
    const result = await currentUser.query('SELECT * FROM reserva ORDER BY data_entrada ASC, data_saida ASC');
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
      const result = await currentUser.query('SELECT codigo_evento, nome_evento, data, local, capacidade, organizador, participante FROM  visao_eventos_programados ORDER BY data ASC;');
      res.json(result.rows);
  } catch (error) {
      console.error("Erro ao buscar próximos eventos:", error);
      res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});

app.post('/adicionarHospede', async (req, res) => {
  const { id_evento, cpf_hospede } = req.body;

  if (!id_evento || !cpf_hospede) {
      return res.status(400).json({ error: "ID do evento e CPF do hóspede são obrigatórios" });
  }

  try {
      const query = `
          INSERT INTO participa (idevento, cpfhosp)
          VALUES ($1, $2)
          ON CONFLICT (idevento, cpfhosp) DO NOTHING
      `;

      await currentUser.query(query, [id_evento, cpf_hospede]);

      res.status(200).json({ message: "Hóspede adicionado ao evento com sucesso!" });
  } catch (error) {
      console.error("Erro ao inserir hóspede no evento:", error);
      res.status(500).json({ error: "Erro ao inserir hóspede no evento." });
  }
});


app.put('/alterarEvento', async (req, res) => {
  try {
      const {
          id_evento, 
          nome_evento_novo, 
          data_evento_novo, 
          custos_novo, 
          localizacao_novo,
          numeroParticipantes_novo,
          capacidade_evento_novo,
          tema_evento_novo
      } = req.body;

      // Verificar se o ID do evento está presente
      if (!id_evento) {
          return res.status(400).json({ error: 'ID do evento é obrigatório' });
      }

      // Atualizar os dados do evento na tabela
      const query = `
          UPDATE eventos
          SET nome_evento = $1,
              data_evento = $2,
              custos = $3,
              localizacao = $4,
              numeroparticipantes = $5,
              capacidade_evento = $6,
              tema_evento = $7
          WHERE id_evento = $8
      `;

      const values = [
          nome_evento_novo,
          data_evento_novo,
          custos_novo,
          localizacao_novo,
          numeroParticipantes_novo,
          capacidade_evento_novo,
          tema_evento_novo,
          id_evento
      ];

      const result = await currentUser.query(query, values);

      // Verificar se o evento foi atualizado
      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Evento não encontrado' });
      }

      res.status(200).json({ message: 'Evento atualizado com sucesso' });
  } catch (error) {
      console.error('Erro ao atualizar o evento:', error);
      res.status(500).json({ error: 'Erro ao atualizar o evento' });
  }
});



app.post('/listarHospedesEvento', async (req, res) => {
  const { id_evento } = req.body;

  if (!id_evento) {
      return res.status(400).json({ error: 'ID do evento é necessário' });
  }

  try {
      // Chama a função listar_hospedes_evento do PostgreSQL
      const query = `SELECT * FROM listar_hospedes_evento($1) ORDER BY nome_hosp ASC`;
      const { rows } = await currentUser.query(query, [id_evento]);

      if (rows.length === 0) {
          return res.status(404).json({ error: 'Nenhum hóspede encontrado para este evento' });
      }

      res.json(rows);
  } catch (error) {
      console.error('Erro ao buscar hóspedes:', error);
      res.status(500).json({ error: 'Erro no servidor ao buscar hóspedes' });
  }
});

function sanitizeUserName(name) {
  // A função pode ser mais robusta dependendo do seu caso, aqui estamos apenas checando se o nome é uma string válida
  return name && typeof name === 'string' && name.length > 0;
}

// Rota para matar (excluir) a secretária
app.post('/matarSecretaria', async (req, res) => {
  const { nome } = req.body;

  if (!sanitizeUserName(nome)) {
      return res.status(400).json({ error: 'Nome da secretária inválido.' });
  }

  try {
      // Inicia a transação
      await currentUser.query('BEGIN');

      // Revogar permissões concedidas à secretária
      await currentUser.query(`
          REVOKE ALL PRIVILEGES ON TABLE hospede, reserva, cardapio, eventos, participa, quarto, pagamento, hospedes_mortos, relatorio_mes, visao_eventos_programados FROM ${nome};
      `);

      // Revogar permissão de execução de funções e procedimentos
      await currentUser.query(`
          REVOKE EXECUTE ON PROCEDURE alterar_datas_reserva FROM ${nome};
          REVOKE EXECUTE ON FUNCTION quartos_disponiveis FROM ${nome};
      `);

      // Revogar a associação da secretária à role 'secretarias'
      await currentUser.query(`
          REVOKE secretarias FROM ${nome};
      `);

      // Remover o usuário 'secretaria' do banco de dados
      await currentUser.query(`
          DROP USER IF EXISTS ${nome};
      `);

      // Finaliza a transação
      await currentUser.query('COMMIT');

      return res.status(200).json({ message: 'Secretária excluída com sucesso!' });
  } catch (error) {
      // Caso ocorra um erro, desfaz a transação
      await currentUser.query('ROLLBACK');
        console.error('Erro ao excluir secretária:', error);
        // Enviar o erro para o cliente
        return res.status(500).json({ error: error.message });
  }
});

app.get('/produtosEstoque', async (req, res) => {

  try {
      const result = await currentUser.query('SELECT * FROM visao_cardapio_completo');
      
      // Retorna os dados do cardápio
      res.json(result.rows);
  } catch (err) {
      console.error('Erro ao buscar cardápio:', err);
      res.status(500).json({ error: 'Erro ao carregar o cardápio.' });
  }
});


app.get('/permissoes', async (req, res) => {
  try {
      // Consultar permissões das tabelas associadas ao usuário 'secretaria'
      const query = `
          SELECT c.relname AS table,
                 c.relacl AS permissions
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_roles r ON r.oid = c.relowner
          WHERE r.rolname = 'secretaria' OR c.relacl::text LIKE '%secretaria%';
      `;
      
      const result = await currentUser.query(query);
      
      // Enviar a resposta com os dados das permissões
      res.json(result.rows);
  } catch (err) {
      console.error("Erro na consulta de permissões:", err);
      res.status(500).json({ error: 'Erro ao consultar permissões' });
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
      ORDER BY data_evento ASC, id_evento ASC;
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
    const result = await currentUser.query('SELECT * FROM cardapio ORDER BY nome_item ASC;');
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
      const resultado = await currentUser.query('SELECT * FROM quartos_disponiveis($1, $2) ORDER BY tema_quarto ASC;', [data_entrada, data_saida]);
      
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
  const { data_entrada, data_saida, n_quarto, cpf_hospede, cod_pagamento, metodo_pagamento, valor } = req.body;

  const client = await currentUser.connect(); // Obtém um cliente de conexão para iniciar a transação

  try {
      await client.query('BEGIN'); // Inicia a transação

      // Inserir uma nova reserva
      await client.query(
          'INSERT INTO reserva (data_entrada, data_saida, n_quarto, cpf_hospede) VALUES ($1, $2, $3, $4)',
          [data_entrada, data_saida, n_quarto, cpf_hospede]
      );

      // Atualizar o status do quarto
      await client.query(
          'UPDATE quarto SET status_limpeza = FALSE WHERE n_quarto = $1',
          [n_quarto]
      );

      // Inserir registro de pagamento referente à reserva
      await client.query(
          'INSERT INTO pagamento (cod_pagamento, data_pagamento, metodo_pagamento, valor) VALUES ($1, CURRENT_DATE, $2, $3)',
          [cod_pagamento, metodo_pagamento, valor]
      );

      await client.query('COMMIT'); // Confirma a transação
      res.status(201).send({ message: 'Reserva criada com sucesso!' });

  } catch (error) {
      await client.query('ROLLBACK'); // Reverte a transação em caso de erro
      console.error('Erro ao criar reserva:', error);
      res.status(500).send({ error: 'Erro ao criar reserva. Tente novamente.' });

  } finally {
      client.release(); // Libera o cliente
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

app.post('/cadastrar_secretaria', async (req, res) => {
  const { nome, senha } = req.body;

  if (!nome || !senha) {
    return res.status(400).json({ error: 'Nome e senha são obrigatórios' });
  }

  try {
    // Criptografa a senha antes de salvar no banco
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Cria o usuário com as permissões no banco de dados
    await currentUser.query(`
      CREATE USER ${nome} WITH
      LOGIN
      PASSWORD '${hashedPassword}';
      GRANT secretarias TO ${nome};
      ALTER ROLE ${nome} CREATEROLE;
    `);

    res.status(201).json({ message: 'Secretária cadastrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar secretária:', error);
    res.status(500).json({ error: 'Erro ao cadastrar secretária.' });
  }
});

// Rota para criar um evento
app.post('/criar_evento', async (req, res) => {
  const { id_evento, nome_evento, data_evento, custos, localizacao, numeroparticipantes, capacidade_evento, tema_evento } = req.body;

  // Verificação dos dados recebidos
  if (!id_evento || !nome_evento || !data_evento || numeroparticipantes == null || capacidade_evento == null || !tema_evento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
      // Inserindo o evento na tabela 'eventos'
      const query = `
          INSERT INTO public.eventos (
              id_evento, nome_evento, data_evento, custos, localizacao, numeroparticipantes, capacidade_evento, tema_evento
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
      `;
      
      const values = [id_evento, nome_evento, data_evento, custos, localizacao, numeroparticipantes, capacidade_evento, tema_evento];

      const result = await currentUser.query(query, values);
      
      // Enviando resposta de sucesso com os dados do evento inserido
      res.status(201).json({ success: true, evento: result.rows[0], message: 'Evento criado com sucesso!' });
  } catch (error) {
      console.error("Erro ao criar evento:", error.message);

      // Retornando erro em caso de problemas no banco de dados
      res.status(500).json({ success: false, error: 'Erro ao inserir evento no banco de dados.', details: error.message });
  }
});



app.delete('/evento', async (req, res) => {
  const { id_evento } = req.body;
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    console.log("Excluindo evento:", {id_evento});
    await currentUser.query(
      'DELETE FROM participa WHERE idevento = $1;',
      [id_evento]
    );
    await currentUser.query(
      'DELETE FROM organiza WHERE id_evento = $1;',
      [id_evento]
    );
    await currentUser.query(
      'DELETE FROM eventos WHERE id_evento = $1;',
      [id_evento]
    );
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir evento:", error.message);
    res.status(500).json({ error: 'Erro ao excluir evento.', details: error.message });
  }
});

app.delete('/reservas', async (req, res) => {
  const { data_saida, data_entrada, n_quarto, cpf_hosp, cod_pagamento } = req.body;

  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    await currentUser.query('BEGIN');

    // Excluir a reserva
    await currentUser.query(
      'DELETE FROM reserva WHERE data_saida = $1 AND data_entrada = $2 AND n_quarto = $3 AND cpf_hospede = $4',
      [data_saida, data_entrada, n_quarto, cpf_hosp]
    );

    // Atualizar o status de limpeza do quarto
    await currentUser.query(
      'UPDATE quarto SET status_limpeza = TRUE WHERE n_quarto = $1',
      [n_quarto]
    );

    // Excluir o pagamento associado
    await currentUser.query(
      'DELETE FROM pagamento WHERE cod_pagamento = $1',
      [cod_pagamento]
    );

    await currentUser.query('COMMIT');
    res.status(204).send();

  } catch (error) {
    await currentUser.query('ROLLBACK');  // Reverte a transação em caso de erro
    console.error("Erro ao excluir reserva:", error.message);
    res.status(500).json({ error: 'Erro ao excluir reserva.', details: error.message });
  }
});

app.get('/pagamentos', async (req, res) => {
  try {
      const result = await currentUser.query('SELECT cod_pagamento, data_pagamento, metodo_pagamento, valor, tipo_documento, encode(nota_fiscal, \'base64\') AS nota_fiscal FROM pagamento ORDER BY data_pagamento DESC;');
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
