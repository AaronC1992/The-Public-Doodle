# The Public Doodle

### [Play Now at the-public-doodle.vercel.app](https://the-public-doodle.vercel.app/)

---

The Public Doodle is a browser based drawing game where you create characters and release them into a shared living world. Every drawing you release joins a community that is visible to anyone else playing at the same time.

Choose a world, draw your character using the built in drawing tools, and watch it come to life alongside everyone else's creations.

## Worlds

**Duck World** — Draw ducks and release them into a sunny pond. Ducks swim, forage, rest, and socialize on their own.

**Stickman World** — Draw stickmen and send them out into a grassy field.

**Animal World** — Draw any animal and add it to the wild meadow.

**Random World** — Draw anything you want and drop it into the mystery basin.

## Drawing Tools

- Pencil tool with adjustable brush size and color
- Fill bucket to color enclosed shapes
- Rainbow pencil mode
- Up to 5 animation frames per character
- Onion skin to trace your previous frame while animating
- Playback preview before you release your character

## Community

Drawings are stored and shared in real time using Supabase. When you release a character, everyone currently playing can see it appear in their world. Likes are tracked across users.

## Local Development

Install dependencies:

```bash
npm install
```

Copy the environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```


This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
