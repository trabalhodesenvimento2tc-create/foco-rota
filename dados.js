const SUPABASE_URL = "https://wboaqwpxnoghtzwbdygh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib2Fxd3B4bm9naHR6d2JkeWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTY2NzAsImV4cCI6MjEwOTEzMjY3MH0.F_T5HzdpxMAZfYfUm3ljMNQ67W4CLgKoeje2z9IHAdo";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const MATERIAS_INICIAIS = [
  { nome: "Português", cor: "#3b82f6" },
  { nome: "Matemática", cor: "#2563eb" },
  { nome: "História", cor: "#60a5fa" },
  { nome: "Geografia", cor: "#1d4ed8" },
  { nome: "Ciências", cor: "#93c5fd" },
  { nome: "Inglês", cor: "#38bdf8" }
];

function traduzirErro(error) {
  const msg = error?.message || "Erro desconhecido";
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (msg.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("invalid email")) return "Digite um e-mail válido.";
  if (msg.includes("Email not confirmed")) return "Confirme o e-mail antes de entrar.";
  return msg;
}

async function api(acao, dados = {}) {
  try {
    if (acao === "sessao") return await sb.auth.getSession();
    if (acao === "cadastrar") {
      const r = await sb.auth.signUp({ email: dados.email, password: dados.senha }); if (r.error) throw r.error; return r.data;
    }
    if (acao === "entrar") {
      const r = await sb.auth.signInWithPassword({ email: dados.email, password: dados.senha }); if (r.error) throw r.error; return r.data;
    }
    if (acao === "sair") { await sb.auth.signOut(); return { ok: true }; }
    const user = (await sb.auth.getUser()).data.user;
    if (!user) throw new Error("Você precisa entrar novamente.");
    const uid = { user_id: user.id };
    switch (acao) {
      case "iniciar_usuario": {
        const { data } = await sb.from("materias").select("id").eq("user_id", user.id).limit(1);
        if (!data?.length) await sb.from("materias").insert(MATERIAS_INICIAIS.map(materia => ({ ...uid, ...materia })));
        return {ok:true};
      }
      case "materias_listar": return (await sb.from("materias").select("*").order("created_at")).data || [];
      case "materias_criar": { const r=await sb.from("materias").insert({...uid,nome:dados.nome,cor:dados.cor||"#3b82f6"}).select(); if(r.error)throw r.error; return r.data; }
      case "materias_excluir": await sb.from("materias").delete().eq("id",dados.id); return {ok:true};
      case "sessao_salvar": { const r=await sb.from("sessoes").insert({...uid,minutos:dados.minutos,materia_id:dados.materia_id||null}); if(r.error)throw r.error; return r.data; }
      case "resumo": { const sessoes=(await sb.from("sessoes").select("minutos")).data||[]; return {pomodoros:sessoes.length,minutos:sessoes.reduce((n,s)=>n+s.minutos,0)}; }
      case "frase": { const {data}=await sb.from("frases").select("texto").limit(20); return {texto:data?.[(new Date()).getDate()% (data.length||1)]?.texto||"Um passo de cada vez."}; }
      case "anotacoes_listar": return (await sb.from("anotacoes").select("*").order("created_at",{ascending:false})).data || [];
      case "anotacoes_criar": { const r=await sb.from("anotacoes").insert({...uid,titulo:dados.titulo,texto:dados.texto,materia_id:dados.materia_id||null}).select(); if(r.error)throw r.error; return r.data; }
      case "anotacoes_excluir": await sb.from("anotacoes").delete().eq("id",dados.id); return {ok:true};
      default: throw new Error("Ação desconhecida: " + acao);
    }
  } catch(error) { throw new Error(traduzirErro(error)); }
}
