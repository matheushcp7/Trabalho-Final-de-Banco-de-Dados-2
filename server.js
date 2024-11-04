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
      'INSERT INTO public.hospede (cpf, nome, telefone, email, senha, especie, estagio_de_vida, foto, tipo_imagem) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [cpf, nome, telefone, email, senhaCriptografada, especie, estagio_de_vida, foto, tipoImagem]
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

app.get('/reservas', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    console.log("Buscando reservas...");
    const result = await currentUser.query('SELECT * FROM reserva');
    console.log("Reservas encontradas:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao procurar reservas:", error);

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
    const result = await currentUser.query('SELECT * FROM cardapio');
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao procurar cardápio:", error);

    if (error.code === '42501') {
      return res.status(403).json({ error: 'Você não tem permissão para acessar essa aba.' });
    }

    res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});

app.post('/BuscaCPF', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const { cpf } = req.body;
  console.log("Buscando hóspede com CPF:", cpf);

  try {
    const result = await currentUser.query('SELECT * FROM hospede WHERE cpf = $1', [cpf]);
    
    if (result.rows.length === 0) {
      console.warn("Hóspede não encontrado no banco de dados.");
      return res.status(404).json({ error: 'Hóspede não encontrado no servidor.' });
    }

    const hospede = result.rows[0];
    
    if (hospede.foto) {
      hospede.foto = `data:${hospede.tipo_foto};base64,${hospede.foto.toString('base64')}`;
    }

    console.log("Hóspede encontrado:", hospede);
    res.json(hospede);

  } catch (error) {
    console.error("Erro ao procurar hóspede:", error.message);
    res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
