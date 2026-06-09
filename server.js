require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve arquivos estáticos

// Configuração do banco de dados
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Rota de cadastro
app.post('/api/cadastro', async (req, res) => {
    try {
        const { nome_completo, usuario, email, telefone, cpf, senha } = req.body;

        // Validações básicas
        if (!nome_completo || !usuario || !email || !cpf || !senha) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Preencha todos os campos obrigatórios' 
            });
        }

        // Hash da senha
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // Inserir no banco
        const query = `
            INSERT INTO usuarios (nome_completo, usuario, email, telefone, cpf, senha) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await pool.execute(query, [nome_completo, usuario, email, telefone, cpf, senhaHash]);

        res.status(201).json({ 
            sucesso: true, 
            mensagem: 'Usuário cadastrado com sucesso!' 
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                sucesso: false, 
                mensagem: 'Usuário, e-mail ou CPF já cadastrado' 
            });
        }
        
        res.status(500).json({ 
            sucesso: false, 
            mensagem: 'Erro no servidor' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});