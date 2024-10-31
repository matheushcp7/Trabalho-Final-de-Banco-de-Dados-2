const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

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
    password: String(password), // Garante que é uma string
    port: 5432,
  });

  try {
    await userPool.connect(); // Valida as credenciais
    res.status(200).send('Login bem-sucedido!');
    currentUser = userPool; // Armazena o pool autenticado
  } catch (error) {
    res.status(401).send('Usuário ou senha inválidos.');
  }
});

// Rota para inserção de hóspede (após login)
app.post('/hospede', async (req, res) => {
  if (!currentUser) {
    return res.status(401).send('Usuário não autenticado.');
  }

  try {
    const { cpf, nome, telefone, email, senha, especie, estagio_de_vida } = req.body;
    // Executa a inserção do hóspede
    await currentUser.query(
      'INSERT INTO public.hospede (cpf, nome, telefone, email, senha, especie, estagio_de_vida) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [cpf, nome, telefone, email, senha, especie, estagio_de_vida]
    );
    res.status(201).send('Hóspede cadastrado com sucesso!');
  } catch (error) {
    console.error('Erro ao cadastrar hóspede:', error.message);
    res.status(500).send('Erro ao cadastrar hóspede.');
  }
});

// Rota para listar reservas
app.get('/reservas', async (req, res) => {
  if (!currentUser) {
    return res.status(401).send('Usuário não autenticado.');
  }

  try {
    const result = await currentUser.query('SELECT * FROM reserva');
    res.json(result.rows); // Retorna as reservas como JSON
  } catch (error) {
    console.error('Erro ao procurar reservas:', error.message);
    res.status(500).send('Erro ao procurar reservas.');
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
