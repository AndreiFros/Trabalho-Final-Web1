require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const categoriasRoutes = require("./routes/categorias.routes");
const livrosRoutes = require("./routes/livros.routes");
const autoresRoutes = require("./routes/autores.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ mensagem: "API Biblioteca funcionando" }));

app.use("/auth", authRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/livros", livrosRoutes);
app.use("/autores", autoresRoutes);

// Rota inexistente
app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));

// JSON inválido no corpo ou outro erro não tratado
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
