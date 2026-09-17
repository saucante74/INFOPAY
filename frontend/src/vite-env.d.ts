/// <reference types="vite/client" />

// Vite's own `ImportMetaEnv` carries an `[key: string]: any` index signature,
// so `import.meta.env.VITE_API_URL` would otherwise be `any` — an implicit
// `any` slipping in through a dependency rather than through our own code.
// Declaring the variable explicitly makes the named property win over the
// index signature. Every new VITE_* variable belongs here.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
