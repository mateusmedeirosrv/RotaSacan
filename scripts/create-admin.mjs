// Cria o primeiro usuário admin via Supabase Auth Admin API.
// Uso: node scripts/create-admin.mjs <email> <senha>

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Uso: node scripts/create-admin.mjs <email> <senha>");
  process.exit(1);
}

if (password.length < 6) {
  console.error("Senha deve ter ao menos 6 caracteres.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.");
  process.exit(1);
}

const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  },
  body: JSON.stringify({ email, password, email_confirm: true }),
});

const data = await res.json();

if (!res.ok) {
  console.error("Erro ao criar usuário:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`✓ Usuário criado: ${data.email} (id: ${data.id})`);
