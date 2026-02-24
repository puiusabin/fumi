<div align="center">
  <a href="https://fumi.run">
    <img src="https://raw.githubusercontent.com/puiusabin/fumi/main/docs/images/fumi-title.png" width="500" height="auto" alt="fumi"/>
  </a>
</div>

<hr />

[![Build](https://img.shields.io/github/actions/workflow/status/puiusabin/fumi/ci.yml?branch=main&label=build)](https://github.com/puiusabin/fumi/actions)
[![npm](https://img.shields.io/npm/v/@puiusabin/fumi)](https://www.npmjs.com/package/@puiusabin/fumi)
[![npm](https://img.shields.io/npm/dm/@puiusabin/fumi)](https://www.npmjs.com/package/@puiusabin/fumi)
[![GitHub](https://img.shields.io/github/license/puiusabin/fumi)](https://github.com/puiusabin/fumi/blob/main/LICENSE)
[![npm bundle size](https://img.shields.io/npm/unpacked-size/@puiusabin/fumi)](https://www.npmjs.com/package/@puiusabin/fumi)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/puiusabin/fumi)](https://github.com/puiusabin/fumi/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/puiusabin/fumi)](https://github.com/puiusabin/fumi/commits/main)

fumi - _**means letter✉️ in Japanese**_ - is a small, simple, and ultrafast SMTP Server framework built on Bun.

```ts
import { Fumi } from "@puiusabin/fumi";

const app = new Fumi({ authOptional: true });

app.onMailFrom(async (ctx, next) => {
  if (ctx.address.address.endsWith("@blocked.example")) {
    ctx.reject("Domain blocked", 550);
  }
  await next();
});

await app.listen(2525);
```

## Quick Start

```sh
bun add @puiusabin/fumi
```

## Features

- **Ultrafast** 🚀 - Runs natively on Bun. No adapter layer, no Node.js compat overhead.
- **Lightweight** 🪶 - Tiny core. One runtime dependency (`smtp-server`).
- **Middleware** 🔗 - koa-style `(ctx, next)` chains per SMTP phase: connect, auth, mailFrom, rcptTo, data, close.
- **Plugin system** 🔌 - A plugin is just `(app: Fumi) => void`. No registry, no lifecycle hooks.
- **Delightful DX** 😃 - Super clean APIs. First-class TypeScript support.

## Documentation

Full docs at [fumi.run](https://fumi.run).

## Contributing

Contributions welcome.

- Open an issue to propose a feature or report a bug.
- Open a pull request to fix a bug or improve docs.
- Build and share a plugin.

## Authors

Sabin Puiu <https://github.com/puiusabin>

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
