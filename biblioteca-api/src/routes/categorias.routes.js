const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth); // todas as rotas abaixo exigem token

// Busca a categoria e confere se é do usuário logado.
// Responde 404/403 e retorna null quando não pode continuar.
async function buscarCategoria(req, res) {
  const categoria = await prisma.categoria.findUnique({ where: { id: req.params.id } });
  if (!categoria) {
    res.status(404).json({ erro: "Categoria não encontrada" });
    return null;
  }
  if (categoria.userId !== req.userId) {
    res.status(403).json({ erro: "Acesso negado a esta categoria" });
    return null;
  }
  return categoria;
}

// GET /categorias
router.get("/", async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { userId: req.userId },
      orderBy: { nome: "asc" },
    });
    return res.status(200).json(categorias);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao listar categorias" });
  }
});

// GET /categorias/:id (inclui os livros da categoria)
router.get("/:id", async (req, res) => {
  try {
    const categoria = await buscarCategoria(req, res);
    if (!categoria) return;

    const completa = await prisma.categoria.findUnique({
      where: { id: categoria.id },
      include: { livros: true },
    });
    return res.status(200).json(completa);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao buscar categoria" });
  }
});

// POST /categorias
router.post("/", async (req, res) => {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório" });

    const categoria = await prisma.categoria.create({
      data: { nome, userId: req.userId },
    });
    return res.status(201).json(categoria);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao criar categoria" });
  }
});

// PUT /categorias/:id
router.put("/:id", async (req, res) => {
  try {
    const { nome } = req.body || {};
    if (!nome) return res.status(400).json({ erro: "nome é obrigatório" });

    const categoria = await buscarCategoria(req, res);
    if (!categoria) return;

    const atualizada = await prisma.categoria.update({
      where: { id: categoria.id },
      data: { nome },
    });
    return res.status(200).json(atualizada);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao atualizar categoria" });
  }
});

// DELETE /categorias/:id
router.delete("/:id", async (req, res) => {
  try {
    const categoria = await buscarCategoria(req, res);
    if (!categoria) return;

    await prisma.categoria.delete({ where: { id: categoria.id } });
    return res.status(200).json({ mensagem: "Categoria removida" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao remover categoria" });
  }
});

module.exports = router;
