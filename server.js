const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Configurações gerais do banco
const globalPool = new Pool({
  host: 'localhost',
  database: 'HotelTransilvania',
  port: 5432,
});

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
    database: 'HotelTransilvania',
    password: password,
    port: 5432,
  });
  senhaGlobal = password;
  usuarioGlobal = username;
  try {
    await userPool.connect(); // Valida as credenciais
    res.status(200).send('Login bem-sucedido!');
    currentUser = { username, password };
  } catch (error) {
    res.status(401).send('Usuário ou senha inválidos.');
  }
});

// Rota para inserção de hóspede (após login)
app.post('/hospede', async (req, res) => {

  if (!currentUser) {
    return res.status(401).send('Usuário não autenticado.');
  }

  const userPool = new Pool({
    user: currentUser.username,
    host: 'localhost',
    database: 'HotelTransilvania',
    password: currentUser.password,
    port: 5432,
  });

  try {
    // Conecta ao banco de dados

    await userPool.connect();  // Abre a conexão com o banco de dados

    const { cpf, nome, telefone, email, especie, estagio_de_vida } = req.body;

    //Executa a inserção do hóspede
    const result = await userPool.query(
      'INSERT INTO public.hospede (cpf, nome, telefone, email, especie, estagio_de_vida) VALUES ($1, $2, $3, $4, $5, $6)',
      [cpf, nome, telefone, email, especie, estagio_de_vida]
    );

    res.status(201).send('Hóspede cadastrado com sucesso!');
  } catch (error) {
    res.status(500).send('Erro ao cadastrar hóspede.');
 }
   finally {
    //Fecha a conexão ao banco de dados
    await userPool.end();
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
