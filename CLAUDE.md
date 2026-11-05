# IdleHold

Jogo idle de navegador (inspiração de gênero: Melvor Idle — skills, progressão, recursos acumulando com o tempo). Projeto **original**: mecânicas do gênero sim, nomes/arte/conteúdo de jogos existentes não.

## Como trabalhar neste projeto

- Qualidade de engenharia visível: arquitetura clara, testes, README bom, histórico de commits limpo.
- **Explicar** o que está sendo feito e por quê. Antes de adotar uma tecnologia ou padrão, apresentar os trade-offs; o dono do projeto decide.
- Preferir passos pequenos e incrementais. Começar simples e evoluir.
- Comunicação em **português**. Código, nomes, commits e docs públicas em **inglês**.
- Commits e PRs não levam linhas de coautoria nem atribuição de IA.

## Pilares de design

- **Recompensar quem está jogando.** O jogo é idle, mas estar presente precisa valer a pena de verdade. Isso não deve ser só "a ação demora menos": a ideia é ter decisões, eventos e interação que façam sentido para quem está jogando. A mecânica ainda não foi definida; não implementar antes de discutir com o usuário.

## Roadmap (alto nível)

1. **MVP**: abre no navegador, clica, progride, salva (o save já fica no servidor, porque o servidor é autoritativo).
2. **Contas + save no servidor**: criar conta, login, progresso persistido no backend.
3. **Escala de dados**: o jogo deve aguentar muitos dados (muitos itens, skills, jogadores, histórico).
4. **Multiplayer (futuro)**: interação entre jogadores (mercado, ranking, chat, etc.). Arquitetura deve deixar a porta aberta, sem implementar antes da hora.

## Estrutura e comandos

- `IdleHold.slnx`: solução .NET. `Directory.Build.props` guarda as configurações comuns (net10.0, nullable, warnings como erro). `global.json` fixa o SDK 10.
- `src/IdleHold.Engine`: regras puras do jogo (`GameEngine`, `GameState`, `GameContent`, `Experience`). Não pode depender de web, banco ou I/O.
- `src/IdleHold.Api`: API ASP.NET Core (Minimal APIs) que referencia o Engine. Nunca o contrário.
  - `Players/`: `PlayerService` (alcança o "agora" com `Tick`, aplica o comando e salva), `IPlayerStore` + `InMemoryPlayerStore`, endpoints e DTOs.
  - Endpoints: `GET /health`, `GET /content`, `POST /players`, `GET /players/{id}`, `POST /players/{id}/action`, `DELETE /players/{id}/action`.
  - O horário vem sempre do `TimeProvider` injetado. Nunca usar `DateTime.Now` direto.
- `tests/IdleHold.Engine.Tests`: xUnit, testes do motor.
- `tests/IdleHold.Api.Tests`: testes de integração com `WebApplicationFactory` e `FakeTimeProvider` (`ApiFactory`).
- Rodar os testes: `dotnet test` (na raiz).
- Subir a API: `dotnet run --project src/IdleHold.Api` → http://localhost:5085. A documentação interativa (Scalar) fica em http://localhost:5085/scalar, só em Development. As requisições manuais ficam em `src/IdleHold.Api/IdleHold.Api.http`.

## Decisões técnicas

Registrar aqui cada decisão tomada, com o motivo em uma linha.

- **Backend em C# / .NET (ASP.NET Core)**: tipagem forte, desempenho, e o SignalR para o tempo real do multiplayer.
- **Servidor autoritativo**: as regras do jogo vivem só no C#. O cliente nunca decide resultados; ele recebe o estado e os timestamps e apenas anima o progresso. Isso evita trapaça e prepara o multiplayer.
- **Motor do jogo puro** (`state = Tick(state, elapsed)`) num projeto de class library separado da API: viabiliza progresso offline calculado no servidor e testes fáceis.
- **Frontend: React + TypeScript + Vite** (o Vite 8 usa Rolldown). O cliente é uma "tela", sem regras de jogo.
- **Testes:** xUnit no backend, Vitest no frontend.
- **Monorepo:** pasta raiz com `.slnx` para o .NET e pnpm workspace para o front; o Turborepo só entra se for necessário.
- **Minimal APIs** (não Controllers): é o padrão atual da Microsoft, com menos cerimônia.
- **Estado em memória atrás de `IPlayerStore`** (provisório): o Postgres vai entrar como uma nova implementação da mesma interface.
- **Id do jogador na URL** (provisório, inseguro): vai virar `/me` quando a auth entrar.
- **Avaliação preguiçosa:** cada requisição roda `Tick(state, agora − LastUpdated)`. Nada roda enquanto o jogador está fora.
- **Em aberto:** banco (provavelmente Postgres + EF Core), auth (provavelmente ASP.NET Identity), geração de tipos (OpenAPI), hospedagem, tempo real (SignalR, quando chegar o multiplayer).
