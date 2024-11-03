const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcrypt'); // Importa o bcrypt
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
    database: 'HotelTransilvania',
    password: String(password),
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

app.post('/Hospede', upload.single('foto'), async (req, res) => {
  try {
    const { cpf, nome, telefone, email, senha, especie, estagio_de_vida } = req.body;
    
    // Criptografa a senha para a tabela 'hospede'
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Verifica se uma imagem foi enviada
    const foto = req.file ? req.file.buffer : null;
    const tipoImagem = req.file ? req.file.mimetype : null;

    // Insere o hóspede na tabela 'hospede'
    await currentUser.query(
      'INSERT INTO public.hospede (cpf, nome, telefone, email, senha, especie, estagio_de_vida, foto, tipo_imagem) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [cpf, nome, telefone, email, senhaCriptografada, especie, estagio_de_vida, foto, tipoImagem]
    );

    // Cria o usuário PostgreSQL com o CPF como username e senha original
    await currentUser.query(`CREATE USER "${cpf}" WITH PASSWORD '${senha}'`);

    // Adiciona o usuário ao grupo 'hospede'
    await currentUser.query(`GRANT hospede TO "${cpf}"`);

    res.status(201).send('Hóspede cadastrado e usuário PostgreSQL criado com sucesso!');
  } catch (error) {
    console.error('Erro ao cadastrar hóspede ou criar usuário PostgreSQL:', error.message);
    res.status(500).send('Erro ao cadastrar hóspede ou criar usuário PostgreSQL.');
  }
});

app.get('/reservas', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    const result = await currentUser.query('SELECT * FROM reserva');
    res.json(result.rows); // Retorna as reservas como JSON
  } catch (error) {
    // Log completo do erro para diagnóstico
    console.error('Erro ao procurar reservas:', error);

    // Verifica se o código de erro é relativo à permissão negada
    if (error.code === '42501') { // Código de erro para falta de permissão no PostgreSQL
      return res.status(403).json({ error: 'Você não tem permissão para acessar essa aba.' });
    }

    res.status(500).json({ error: 'Erro ao processar a solicitação.', details: error.message });
  }
});






app.post('/BuscaCPF', async (req, res) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const { cpf } = req.body; // Recebe o CPF do corpo da requisição
  
  try {
    const result = await currentUser.query('SELECT * FROM hospede WHERE cpf = $1', [cpf]);
    
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

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
