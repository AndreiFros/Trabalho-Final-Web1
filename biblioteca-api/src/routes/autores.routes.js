const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth); // todas as rotas abaixo exigem token

// Busca o autor e confere se é do usuário logado.
async function buscarAutor(req, res) {
  const autor = await prisma.autor.findUnique({ where: { id: req.params.id } });
  if (!autor) {
    res.status(404).json({ erro: "Autor não encontrado" });
    return null;
  }
  if (autor.userId !== req.userId) {
    res.status(403).json({ erro: "Acesso negado a este autor" });
    return null;
  }
  return autor;
}

// GET /autores
router.get("/", async (req, res) => {
  try {
    const autores = await prisma.autor.findMany({
      where: { userId: req.userId },
      orderBy: { nome: "asc" },
    });
    return res.status(200).json(autores);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao listar autores" });
  }
});

// GET /autores/:id
router.get("/:id", async (req, res) => {
  try {
    const autor = await buscarAutor(req, res);
    if (!autor) return;
    return res.status(200).json(autor);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao buscar autor" });
  }
});

// POST /autores
router.post("/", async (req, res) => {
  try {
    const { nome, nacionalidade } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório" });

    const autor = await prisma.autor.create({
      data: { nome, nacionalidade, userId: req.userId },
    });
    return res.status(201).json(autor);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao criar autor" });
  }
});

// PUT /autores/:id
router.put("/:id", async (req, res) => {
  try {
    const { nome, nacionalidade } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório" });

    const autor = await buscarAutor(req, res);
    if (!autor) return;

    const atualizado = await prisma.autor.update({
      where: { id: autor.id },
      data: { nome, nacionalidade },
    });
    return res.status(200).json(atualizado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao atualizar autor" });
  }
});

// DELETE /autores/:id
router.delete("/:id", async (req, res) => {
  try {
    const autor = await buscarAutor(req, res);
    if (!autor) return;

    await prisma.autor.delete({ where: { id: autor.id } });
    return res.status(200).json({ mensagem: "Autor removido" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao remover autor" });
  }
});

// ---------- N:N: livros de um autor ----------

// GET /autores/:id/livros
router.get("/:id/livros", async (req, res) => {
  try {
    const autor = await buscarAutor(req, res);
    if (!autor) return;

    const ligacoes = await prisma.livroAutor.findMany({
      where: { autorId: autor.id },
      include: { livro: true },
    });
    return res.status(200).json(ligacoes.map((l) => l.livro));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao listar livros do autor" });
  }
});

module.exports = router;
