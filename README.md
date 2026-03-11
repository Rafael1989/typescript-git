# Competition Project

Aplicacao web multipagina com TypeScript, Webpack e servidor mock local.

## Visao Geral

O projeto possui paginas para:

- cadastrar peso (`Enter Weight`)
- listar pesos cadastrados (`Show Weights`)
- exibir tabela de animais (`Animals`)
- exibir grafico de clima com dados JSON (`Weather Data`)

Toda a logica de frontend esta centralizada em `src/index.ts` e empacotada em `dist/bundle.js`.

## Stack

- TypeScript
- Webpack + webpack-dev-server
- Node.js HTTP server (mock API)
- HTML + CSS

## Estrutura do Projeto

```text
competition/
|- css/
|  \- styles.css
|- data/
|  \- weather-data.json
|- html/
|  |- index.html
|  |- enter-weight.html
|  |- show-weights.html
|  |- animals.html
|  \- weather-data.html
|- src/
|  \- index.ts
|- dist/                      # gerado no build/dev
|- mock-server.js
|- package.json
|- tsconfig.json
\- webpack.config.js
```

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Instalacao

```bash
npm install
```

## Como Rodar

Use dois terminais.

1. Iniciar o servidor mock (porta 3001):

```bash
npm run mock
```

2. Iniciar o frontend com webpack dev server:

```bash
npm run dev -- --port 8081
```

Abra no navegador:

- `http://localhost:8081/html/index.html`

## Scripts

- `npm run build`: gera bundle de producao em `dist/`
- `npm run dev`: sobe o dev server
- `npm run watch`: build em modo watch (sem servidor HTTP)
- `npm run mock`: sobe API mock em `http://localhost:3001`

## Endpoints Mock

Base URL: `http://localhost:3001`

- `GET /api/animals`: retorna lista de animais
- `GET /api/weather-data`: retorna dados de `data/weather-data.json`
- `GET /api/weights`: retorna pesos cadastrados em memoria
- `POST /api/weights`: adiciona novo peso

Exemplo de payload para `POST /api/weights`:

```json
{
	"weight": 180
}
```

Observacao: os pesos ficam apenas em memoria. Ao reiniciar o mock server, a lista de pesos e resetada.

## Regras da Tela Enter Weight

- aceita apenas numeros inteiros
- intervalo permitido: `50` a `400`
- envio feito via `POST /api/weights`

## Build de Producao

```bash
npm run build
```

Arquivos principais gerados:

- `dist/bundle.js`
- `dist/css/styles.css`
- `dist/html/*.html`

## Troubleshooting

Se alguma porta estiver ocupada:

- mude a porta do frontend:

```bash
npm run dev -- --port 8082
```

- para liberar a porta 3001 no PowerShell:

```powershell
$conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

Se a interface nao refletir mudancas:

- confirme se o mock server esta ativo
- rode `npm run build` para validar compilacao
- recarregue a pagina no navegador (Ctrl+F5)
