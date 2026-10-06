import { createServer } from 'vite';

async function main() {
  const server = await createServer({
    server: { middlewareMode: true }
  });
  try {
    await server.ssrLoadModule('./test_e2e.ts');
  } finally {
    await server.close();
  }
}

main().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
