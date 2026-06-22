// Atualiza senha de um usuário via Supabase Auth Admin API.
// Uso: node scripts/reset-password.mjs <email> <nova-senha>

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Uso: node scripts/reset-password.mjs <email> <nova-senha>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lista usuários e encontra pelo email
const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=50`, {
  headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
});
const { users } = await listRes.json();
const user = users?.find((u) => u.email === email);

if (!user) {
  console.error(`Usuário não encontrado: ${email}`);
  process.exit(1);
}

// Atualiza a senha
const res = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  },
  body: JSON.stringify({ password }),
});

const data = await res.json();

if (!res.ok) {
  console.error("Erro ao atualizar senha:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(`✓ Senha atualizada para o usuário: ${data.email}`);
