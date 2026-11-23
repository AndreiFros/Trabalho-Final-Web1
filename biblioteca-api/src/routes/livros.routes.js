const express = require("express");
const prisma = require("../prisma");
const auth = require("../middlewares/auth");

const router = express.Router();
router.use(auth); // todas as rotas abaixo exigem token

// Busca o livro e confere se é do usuário logado.
async function buscarLivro(req, res) {
  const livro = await prisma.livro.findUnique({ where: { id: req.params.id } });
  if (!livro) {
    res.status(404).json({ erro: "Livro não encontrado" });
    return null;
  }
  if (livro.userId !== req.userId) {
    res.status(403).json({ erro: "Acesso negado a este livro" });
    return null;
  }
  return livro;
}

// Confere se a categoria informada existe e é do usuário.
async function categoriaValida(categoriaId, userId) {
  if (!categoriaId) return true; // categoria é opcional
  const cat = await prisma.categoria.findUnique({ where: { id: categoriaId } });
  return cat && cat.userId === userId;
}

// GET /livros
router.get("/", async (req, res) => {
  try {
    const livros = await prisma.livro.findMany({
      where: { userId: req.userId },
      include: { categoria: true },
      orderBy: { titulo: "asc" },
    });
    return res.status(200).json(livros);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao listar livros" });
  }
});

// GET /livros/:id
router.get("/:id", async (req, res) => {
  try {
    const livro = await buscarLivro(req, res);
    if (!livro) return;

    const completo = await prisma.livro.findUnique({
      where: { id: livro.id },
      include: { categoria: true },
    });
    return res.status(200).json(completo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao buscar livro" });
  }
});

// POST /livros
router.post("/", async (req, res) => {
  try {
    const { titulo, ano, categoriaId } = req.body || {};
    if (!titulo) return res.status(400).json({ erro: "titulo é obrigatório" });
    if (ano !== undefined && !Number.isInteger(ano)) {
      return res.status(400).json({ erro: "ano deve ser um número inteiro" });
    }
    if (!(await categoriaValida(categoriaId, req.userId))) {
      return res.status(400).json({ erro: "categoriaId inválido" });
    }

    const livro = await prisma.livro.create({
      data: { titulo, ano, categoriaId, userId: req.userId },
    });
    return res.status(201).json(livro);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao criar livro" });
  }
});

// PUT /livros/:id
router.put("/:id", async (req, res) => {
  try {
    const { titulo, ano, categoriaId } = req.body || {};
    if (!titulo) return res.status(400).json({ erro: "titulo é obrigatório" });
    if (ano !== undefined && !Number.isInteger(ano)) {
      return res.status(400).json({ erro: "ano deve ser um número inteiro" });
    }

    const livro = await buscarLivro(req, res);
    if (!livro) return;

    if (!(await categoriaValida(categoriaId, req.userId))) {
      return res.status(400).json({ erro: "categoriaId inválido" });
    }

    const atualizado = await prisma.livro.update({
      where: { id: livro.id },
      data: { titulo, ano, categoriaId },
    });
    return res.status(200).json(atualizado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao atualizar livro" });
  }
});

// DELETE /livros/:id
router.delete("/:id", async (req, res) => {
  try {
    const livro = await buscarLivro(req, res);
    if (!livro) return;

    await prisma.livro.delete({ where: { id: livro.id } });
    return res.status(200).json({ mensagem: "Livro removido" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao remover livro" });
  }
});

// ---------- N:N: autores de um livro ----------

// POST /livros/:id/autores/:idAutor  -> cria linha na tabela livro_autor
router.post("/:id/autores/:idAutor", async (req, res) => {
  try {
    const livro = await buscarLivro(req, res);
    if (!livro) return;

    const autor = await prisma.autor.findUnique({ where: { id: req.params.idAutor } });
    if (!autor) return res.status(404).json({ erro: "Autor não encontrado" });
    if (autor.userId !== req.userId) {
      return res.status(403).json({ erro: "Acesso negado a este autor" });
    }

    const jaExiste = await prisma.livroAutor.findUnique({
      where: { livroId_autorId: { livroId: livro.id, autorId: autor.id } },
    });
    if (jaExiste) return res.status(409).json({ erro: "Autor já associado a este livro" });

    const ligacao = await prisma.livroAutor.create({
      data: { livroId: livro.id, autorId: autor.id },
    });
    return res.status(201).json(ligacao);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao associar autor ao livro" });
  }
});

// GET /livros/:id/autores
router.get("/:id/autores", async (req, res) => {
  try {
    const livro = await buscarLivro(req, res);
    if (!livro) return;

    const ligacoes = await prisma.livroAutor.findMany({
      where: { livroId: livro.id },
      include: { autor: true },
    });
    return res.status(200).json(ligacoes.map((l) => l.autor));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao listar autores do livro" });
  }
});

// DELETE /livros/:id/autores/:idAutor
router.delete("/:id/autores/:idAutor", async (req, res) => {
  try {
    const livro = await buscarLivro(req, res);
    if (!livro) return;

    const chave = { livroId_autorId: { livroId: livro.id, autorId: req.params.idAutor } };
    const ligacao = await prisma.livroAutor.findUnique({ where: chave });
    if (!ligacao) return res.status(404).json({ erro: "Associação não encontrada" });

    await prisma.livroAutor.delete({ where: chave });
    return res.status(200).json({ mensagem: "Associação removida" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro ao remover associação" });
  }
});

module.exports = router;
