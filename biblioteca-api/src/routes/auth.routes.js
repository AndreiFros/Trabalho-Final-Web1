const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();

// POST /auth/register (pública)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ erro: "username, email e password são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });
    }

    const existe = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existe) {
      return res.status(409).json({ erro: "E-mail ou username já cadastrado" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hash },
      select: { id: true, username: true, email: true }, // nunca devolve a senha
    });

    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// POST /auth/login (pública)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ erro: "email e password são obrigatórios" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const senhaOk = user && (await bcrypt.compare(password, user.password));

    if (!senhaOk) {
      // mensagem genérica: não revela se errou o e-mail ou a senha
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao fazer login" });
  }
});

// GET /auth/me (protegida)
router.get("/me", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });

    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao buscar usuário" });
  }
});

module.exports = router;
