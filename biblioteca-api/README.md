# API Biblioteca — Trabalho DWEB 1

API REST com **Node.js + Express**, **PostgreSQL (Neon)**, **Prisma 7.10.0** com adaptador Neon, autenticação **JWT** e senhas com **bcrypt**.

## Tabelas (5)

| Tabela | Descrição | Relacionamento |
|---|---|---|
| `users` | Usuários (senha com hash bcrypt) | 1:N com categorias, livros e autores |
| `livros` | Entidade principal A | pertence a um user; N:N com autores; N:1 com categoria |
| `autores` | Entidade principal B | pertence a um user; N:N com livros |
| `livro_autor` | Tabela pivô (N:N) | chave composta (livroId, autorId) + campo `criadoEm` |
| `categorias` | Entidade de apoio | 1:N com livros |

## Como rodar

```bash
npm install
cp .env.example .env      # cole a connection string do Neon em DATABASE_URL
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

## Rotas

**Públicas**
- `POST /auth/register` — `{ "username", "email", "password" }`
- `POST /auth/login` — `{ "email", "password" }` → `{ "token" }`

**Protegidas** (cabeçalho `Authorization: Bearer <token>`)
- `GET /auth/me`
- `GET | POST /livros` · `GET | PUT | DELETE /livros/:id` — `{ "titulo", "ano", "categoriaId" }`
- `GET | POST /autores` · `GET | PUT | DELETE /autores/:id` — `{ "nome", "nacionalidade" }`
- `GET | POST /categorias` · `GET | PUT | DELETE /categorias/:id` — `{ "nome" }`

**N:N (protegidas)**
- `POST /livros/:id/autores/:idAutor` — associa autor ao livro
- `GET /livros/:id/autores` — autores de um livro
- `GET /autores/:id/livros` — livros de um autor
- `DELETE /livros/:id/autores/:idAutor` — remove a associação

## Códigos HTTP usados
200 OK · 201 criado · 400 dados inválidos · 401 sem token/token inválido/login inválido · 403 registro de outro usuário · 404 não encontrado · 409 e-mail/username duplicado ou associação repetida · 500 erro interno.

## Roteiro da apresentação (Postman / Thunder Client)
1. `POST /auth/register` → 201 (senha não aparece na resposta)
2. `POST /auth/login` com senha errada → 401 "Credenciais inválidas"
3. `POST /auth/login` correto → copiar o `token`
4. `GET /livros` **sem** token → 401
5. `GET /auth/me` **com** token → 200
6. Criar categoria, livro (com `categoriaId`) e autor
7. `POST /livros/:id/autores/:idAutor` → 201 (linha em `livro_autor`)
8. `GET /livros/:id/autores` e `GET /autores/:id/livros` → mostra o N:N
9. `DELETE /livros/:id/autores/:idAutor` → remove a associação
