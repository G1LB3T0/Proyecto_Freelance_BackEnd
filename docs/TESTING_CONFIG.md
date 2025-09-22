Razón de uso de `vitest.config.mjs` únicamente
=============================================

Se eliminó `vitest.config.js` porque:

1. Vite es ESM y al cargar vía CommonJS se producía `ERR_REQUIRE_ESM`.
2. Tener ambos (`.js` y `.mjs`) causa que Vitest priorice el `.js` y reviva el error.
3. Simplificamos a un único archivo ESM: `vitest.config.mjs`.

Si vuelve a aparecer `vitest.config.js`, revisa:
- Algún stash/merge lo reintrodujo.
- Algún script de copia (no existe ahora) lo regeneró.

Comando recomendado para correr tests:

```sh
npx vitest run --config vitest.config.mjs
```

Fin.