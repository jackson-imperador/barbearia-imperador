# BASELINE OFICIAL DA BARBEARIA IMPÉRIO

> O estado registrado neste documento representa o baseline oficial da Barbearia Império. Todas as futuras alterações devem preservar as funcionalidades existentes e utilizar a menor alteração possível.

## 1. Visão Geral
Este documento serve como um **checkpoint de segurança e referência imutável** para o projeto "Barbearia Império". O projeto atualmente encontra-se em um estado funcional, estável e aprovado. 

**Nenhuma funcionalidade existente deve ser alterada, recriada, removida ou ter sua arquitetura modificada sem autorização explícita.**

## 2. Tecnologias e Arquitetura

### Frontend (Client)
- **Framework:** Next.js 16.2 (Turbopack) com React 19
- **Estilização:** Tailwind CSS v4, Framer Motion, Lucide React
- **Funcionalidades PWA:** `@ducanh2912/next-pwa`
- **Comunicação de API:** Axios (com retry)
- **Estrutura:** App Router do Next.js
- **Navegação de Telas Funcionais:** Autenticação, Área do Cliente (Customer), Área do Barbeiro (Barber), Área do Dono (Owner/Admin), Academy.

### Backend
- **Framework:** NestJS 11.0
- **Servidor Web:** Fastify
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma v6
- **Autenticação:** JWT (Passport) + Argon2 para hash de senha
- **Upload e Mídia:** Multer (tipos), Fastify multipart
- **Integrações (Prontas/Base):** Mercado Pago, WhatsApp (Baileys)
- **Segurança:** Helmet, Throttler (Rate limit), CORS

## 3. Autenticação e Autorização (Roles/Permissões)
- **Fluxo:** Login via email/senha, retornando um JWT (Access Token) e possivelmente Refresh Token.
- **Armazenamento Seguro:** Cookies (ou storage local no frontend para manipulação via Axios interceptors).
- **Entidades:** O sistema usa o modelo de `Tenant` (Multitenancy base) e `User`.
- **Papéis (Roles):** Utiliza-se um sistema robusto de `UserRole` que vincula um `User` a uma `Role` e suas respectivas `Permission`. Papéis comuns em uso parecem abranger: Admin/Owner, Barbeiro (Barber) e Cliente (Customer).

## 4. Banco de Dados e Prisma Schema
O banco de dados é um PostgreSQL hospedado e gerenciado pelo Prisma. Entidades principais funcionando de forma relacional em `schema.prisma`:
- **Tenant & User:** Base do multitenancy e usuários.
- **Barber & Working Hours:** Perfis de barbeiros, jornadas de trabalho, férias e horários de bloqueio/folgas.
- **Services & Categories:** Catálogo de serviços da barbearia.
- **Appointments:** Agendamentos de serviços, com status, histórico financeiro e lembretes.
- **Products & Store:** Categorias de produtos, produtos físicos, carrinho/compras e reviews.
- **Academy/Cursos:** Cursos, módulos, lições (vídeos/PDFs), matrículas, progresso e certificados.
- **Media & CMS:** Pastas de mídia, configurações do site (Logo, Banners, Cores), depoimentos e galerias.
- **Fidelidade (Premium):** Sistema de pontuação, cashback, níveis de lealdade (Bronze, etc) e conquistas.

## 5. Funcionalidades Estáveis e Aprovadas
1. **Autenticação:** Funcionando perfeitamente.
2. **Painel do Administrador (Owner):** Gerenciamento da equipe de barbeiros, controle de expediente e bloqueio de horários.
3. **Agendamento:** Motor de reservas integrado com a grade de horários dos barbeiros.
4. **Catálogo de Serviços:** Listagem de serviços de barbearia disponíveis.
5. **PWA:** Manifest e service worker configurados.
6. **Módulo Academy (Cursos):** Gestão de conteúdo educacional.
7. **CMS Integrado:** Controle dinâmico do conteúdo do site (hero banner, about, galerias).

## 6. Estrutura de Pastas (Repositório)
```text
APP BARBEARIA/
├── backend/
│   ├── src/           # Controllers, Modules, Services do NestJS
│   ├── prisma/        # schema.prisma, migrations, seeds
│   ├── dist/          # Build final
│   └── package.json
└── client/
    ├── src/
    │   ├── app/       # Next.js App Router (auth, customer, owner, barber, academy)
    │   ├── components/# UI Components
    │   └── lib/       # API Axios configuration
    ├── public/        # PWA Icons, Manifest, Static Assets
    ├── .next/         # Build do frontend
    └── package.json
```

## 7. Diretrizes Críticas para Desenvolvimentos Futuros
1. **Análise Inicial:** Primeiro analisar o código existente.
2. **Reaproveitamento:** Reutilizar o que já existe (Componentes, Endpoints, Modals).
3. **Não recriar:** Não recriar módulos que já operam com sucesso.
4. **Preservar Arquitetura:** Não alterar arquitetura ou trocar libs principais sem extrema necessidade e aprovação prévia.
5. **Escopo Focado:** Não modificar funcionalidades fora do escopo específico da nova solicitação.
6. **Menor Alteração Possível:** O código que for tocado deve ter apenas a alteração cirúrgica exigida para o funcionamento do novo requisito.
7. **Testes de Regressão:** Confirmar sempre se a área modificada não quebrou as áreas já estáveis (Baseline).

---
*Este documento é a âncora do projeto e garante a preservação do esforço já realizado.*
