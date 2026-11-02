let tela="inicio", usuario=null, materias=[], timer=null, segundos=25*60, estudando=false;
const app=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const temaChave="foco-rota-tema";

function aplicarTema(tema){
 const escolha=tema==="claro"?"claro":"escuro";
 document.documentElement.dataset.tema=escolha;
 document.body.classList.toggle("light",escolha==="claro");
 localStorage.setItem(temaChave,escolha);
 const botao=document.getElementById("btn-tema");
 if(botao){
  botao.setAttribute("aria-label",escolha==="claro"?"Ativar tema escuro":"Ativar tema claro");
  botao.title=botao.getAttribute("aria-label");
 }
}

function configurarTema(){
 aplicarTema(localStorage.getItem(temaChave)||"escuro");
 const botao=document.getElementById("btn-tema");
 if(botao)botao.onclick=()=>{
  aplicarTema(document.documentElement.dataset.tema==="claro"?"escuro":"claro");
 };
}

async function inicio(){const s=await api("sessao");usuario=s.data.session?.user||null;if(!usuario)return login();await api("iniciar_usuario");mostrar("inicio")}
function login(){tela="login";app.innerHTML=`<div class="app login-app"><section class="card login-card"><h1>Foco & Rota</h1><div class="login-abas" role="tablist" aria-label="Opções de acesso"><button id="abaEntrar" class="aba ativa" role="tab" aria-selected="true">Entrar</button><button id="abaCriar" class="aba" role="tab" aria-selected="false">Criar conta</button></div><div id="formEntrar" role="tabpanel"><form class="form" id="formLogin"><label for="emailLogin">E-mail</label><input id="emailLogin" name="email" type="email" autocomplete="email" required><label for="senhaLogin">Senha</label><input id="senhaLogin" name="senha" type="password" autocomplete="current-password" minlength="6" required><button class="primary" type="submit">Entrar</button></form></div><div id="formCriar" role="tabpanel" hidden><form class="form" id="formCadastro"><label for="emailCriar">E-mail</label><input id="emailCriar" name="email" type="email" autocomplete="email" required><label for="senhaCriar">Senha</label><input id="senhaCriar" name="senha" type="password" autocomplete="new-password" minlength="6" required><label for="confirmarSenha">Confirmar senha</label><input id="confirmarSenha" name="confirmar" type="password" autocomplete="new-password" minlength="6" required><button class="primary" type="submit">Criar minha conta</button></form></div><p id="msg" class="aviso-login" role="alert" aria-live="polite"></p></section></div>`;
function escolher(opcao){const entrar=opcao==="entrar";formEntrar.hidden=!entrar;formCriar.hidden=entrar;abaEntrar.classList.toggle("ativa",entrar);abaCriar.classList.toggle("ativa",!entrar);abaEntrar.setAttribute("aria-selected",String(entrar));abaCriar.setAttribute("aria-selected",String(!entrar));msg.textContent="";(entrar?emailLogin:emailCriar).focus()}
abaEntrar.onclick=()=>escolher("entrar");abaCriar.onclick=()=>escolher("criar");
formLogin.onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);msg.textContent="Entrando...";try{await api("entrar",{email:f.get("email").trim(),senha:f.get("senha")});await inicio()}catch(x){msg.textContent=x.message==="E-mail ou senha incorretos."?"Senha ou e-mail incorretos. Confira os dados e tente novamente.":x.message}};
formCadastro.onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),senha=f.get("senha"),confirmar=f.get("confirmar");if(senha!==confirmar){msg.textContent="As duas senhas precisam ser iguais.";return}if(senha.length<6){msg.textContent="A senha precisa ter pelo menos 6 caracteres.";return}msg.textContent="Criando conta...";try{const cadastro=await api("cadastrar",{email:f.get("email").trim(),senha});if(cadastro.session){await inicio();return}msg.textContent="Conta criada. Verifique seu e-mail e confirme o cadastro antes de entrar.";e.target.reset();escolher("entrar")}catch(x){msg.textContent=x.message}};}

async function mostrar(nome){tela=nome;materias=await api("materias_listar").catch(()=>[]);if(nome==="inicio")return inicioTela();if(nome==="estudar")return estudarTela();if(nome==="materias")return materiasTela();if(nome==="plano")return planoTela();if(nome==="notas")return notasTela()}
async function base(conteudo){app.innerHTML=`<div class="app"><div class="top"><h1>Foco & Rota</h1></div>${conteudo}<nav class="nav">${["inicio","estudar","materias","plano","notas"].map(n=>`<button data-tela="${n}" class="${tela===n?"active":""}">${{inicio:"Início",estudar:"Estudar",materias:"Matérias",plano:"Plano",notas:"Anotações"}[n]}</button>`).join("")}<button id="sair">Sair</button></nav></div>`;document.querySelectorAll("[data-tela]").forEach(b=>b.onclick=()=>mostrar(b.dataset.tela));sair.onclick=async()=>{await api("sair");location.reload()}}

async function inicioTela(){const[resumo,frase,planos]=await Promise.all([api("resumo"),api("frase"),api("plano_listar").catch(()=>[])]);const hoje=(new Date().getDay()+6)%7;const hojePlanos=planos.filter(plano=>plano.dia===hoje);const mensagemHoje=hojePlanos.length?`Hoje você tem ${hojePlanos.length} bloco${hojePlanos.length===1?"":"s"} planejado${hojePlanos.length===1?"":"s"}.`:"Nenhum bloco planejado para hoje. Abra o Plano e organize seu dia.";await base(`<div class="card frase">${esc(frase.texto)}</div><div class="card"><div class="grid"><div class="stat"><strong>${resumo.pomodoros}</strong>Pomodoros</div><div class="stat"><strong>${resumo.minutos}</strong>Minutos</div></div></div><div class="card"><h2>Seu plano de hoje</h2><p>${mensagemHoje}</p></div><div class="card"><h3>Como usar</h3><p>Escolha uma matéria, estude por ciclos de foco e organize suas anotações.</p></div>`)}

async function estudarTela(){await base(`<div class="card"><h2>Estudar</h2><select id="materia"><option value="">Sem matéria</option>${materias.map(m=>`<option value="${m.id}">${esc(m.nome)}</option>`).join("")}</select><div class="timer" id="tempo">${Math.floor(segundos/60).toString().padStart(2,"0")}:${(segundos%60).toString().padStart(2,"0")}</div><div class="row"><button class="primary" id="iniciar">${estudando?"Pausar":"Iniciar"}</button><button id="pular">Pular</button></div></div><div class="card"><label>Minutos de foco: <b id="min">25</b></label><input id="ajuste" type="range" min="5" max="90" step="5" value="25"></div>`);ajuste.oninput=()=>{if(!estudando){min.textContent=ajuste.value;segundos=ajuste.value*60;tempo.textContent=`${String(ajuste.value).padStart(2,"0")}:00`}};iniciar.onclick=()=>{estudando=!estudando;iniciar.textContent=estudando?"Pausar":"Iniciar";if(estudando)timer=setInterval(tick,1000);else clearInterval(timer)};pular.onclick=concluir}
async function tick(){segundos--;tempo.textContent=`${String(Math.floor(segundos/60)).padStart(2,"0")}:${String(segundos%60).padStart(2,"0")}`;if(segundos<=0)concluir()}
async function concluir(){clearInterval(timer);estudando=false;await api("sessao_salvar",{minutos:Number(ajuste?.value||25),materia_id:materia?.value||null});segundos=25*60;tempo.textContent="25:00";alert("Sessão concluída!")}

async function materiasTela(){await base(`<div class="card"><h2>Matérias</h2><form class="form" id="novaMateria"><input name="nome" required placeholder="Nome da matéria"><input name="cor" type="color" value="#3b82f6"><button class="primary">Adicionar matéria</button></form><div id="lista"></div></div>`);renderMaterias();novaMateria.onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await api("materias_criar",{nome:f.get("nome"),cor:f.get("cor")});e.target.reset();renderMaterias()};
async function renderMaterias(){materias=await api("materias_listar");lista.innerHTML=materias.map(m=>`<div class="card item row" style="border-left-color:${esc(m.cor)}"><b>${esc(m.nome)}</b><button class="danger" data-delete="${m.id}">Excluir</button></div>`).join("");document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{await api("materias_excluir",{id:b.dataset.delete});renderMaterias()})}}

async function planoTela(){
 const dias=["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];
 const hoje=(new Date().getDay()+6)%7;
 const blocos=await api("plano_listar").catch(()=>[]);
 const concluidos=blocos.filter(bloco=>bloco.feito).length;
 const progresso=blocos.length?Math.round(concluidos/blocos.length*100):0;
 await base(`<div class="card"><h2>Plano semanal</h2><p class="muted">Organize o que você vai estudar em cada dia da semana.</p><div class="progresso"><span style="width:${progresso}%"></span></div><p>${concluidos} de ${blocos.length} blocos concluídos nesta semana.</p><form class="form plano-form" id="novoBloco"><label for="diaPlano">Dia da semana</label><select id="diaPlano" name="dia">${dias.map((dia,index)=>`<option value="${index}" ${index===hoje?"selected":""}>${dia}</option>`).join("")}</select><label for="materiaPlano">Matéria</label><select id="materiaPlano" name="materia"><option value="">Sem matéria</option>${materias.map(m=>`<option value="${m.id}">${esc(m.nome)}</option>`).join("")}</select><label for="minutosPlano">Minutos</label><input id="minutosPlano" name="minutos" type="number" min="5" max="240" step="5" value="30"><label for="observacaoPlano">Observação</label><input id="observacaoPlano" name="observacao" maxlength="120" placeholder="Ex.: revisar exercícios"><button class="primary" type="submit">Adicionar bloco</button></form></div><div class="plano-semana">${dias.map((dia,index)=>{const blocosDia=blocos.filter(bloco=>bloco.dia===index);return `<section class="card plano-dia ${index===hoje?"hoje":""}"><h3>${dia}${index===hoje?' <span class="hoje-label">Hoje</span>':""}</h3>${blocosDia.map(bloco=>{const materia=materias.find(item=>item.id===bloco.materia_id);return `<div class="plano-bloco ${bloco.feito?"feito":""}" data-dia="${index}"><div><b>${esc(materia?.nome||"Sem matéria")}</b><br><span>${bloco.minutos} minutos${bloco.observacao?` · ${esc(bloco.observacao)}`:""}</span></div><div class="plano-acoes"><button data-feito="${bloco.id}" data-valor="${!bloco.feito}" class="${bloco.feito?"":"primary"}">${bloco.feito?"Desfazer":"Feito"}</button><button class="danger" data-apagar-plano="${bloco.id}">Excluir</button></div></div>`}).join("")||'<p class="muted">Nenhum bloco neste dia.</p>'}</section>`}).join("")}</div>`);
 novoBloco.onsubmit=async e=>{
  e.preventDefault();
  const botao=e.submitter;
  botao.disabled=true;
  try{
   const f=new FormData(e.target);
   await api("plano_criar",{dia:Number(f.get("dia")),materia_id:f.get("materia")||null,minutos:Number(f.get("minutos")),observacao:f.get("observacao").trim()});
   planoTela();
  }catch(erro){
   alert(`Não foi possível adicionar o bloco: ${erro.message}`);
   botao.disabled=false;
  }
 };
 document.querySelectorAll("[data-feito]").forEach(botao=>botao.onclick=async()=>{await api("plano_marcar",{id:botao.dataset.feito,feito:botao.dataset.valor==="true"});planoTela()});
 document.querySelectorAll("[data-apagar-plano]").forEach(botao=>botao.onclick=async()=>{if(confirm("Excluir este bloco do plano?")){await api("plano_excluir",{id:botao.dataset.apagarPlano});planoTela()}});
}

async function notasTela(){const notas=await api("anotacoes_listar");await base(`<div class="card"><h2>Notas</h2><form class="form" id="novaNota"><input name="titulo" required placeholder="Título"><select name="materia"><option value="">Sem matéria</option>${materias.map(m=>`<option value="${m.id}">${esc(m.nome)}</option>`).join("")}</select><textarea name="texto" rows="5" required placeholder="Escreva sua anotação"></textarea><button class="primary">Salvar nota</button></form></div>${notas.map(n=>`<details><summary>${esc(n.titulo)}</summary><p>${esc(n.texto)}</p><button class="danger" data-nota="${n.id}">Excluir</button></details>`).join("")}`);novaNota.onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await api("anotacoes_criar",{titulo:f.get("titulo"),texto:f.get("texto"),materia_id:f.get("materia")});notasTela()};document.querySelectorAll("[data-nota]").forEach(b=>b.onclick=async()=>{await api("anotacoes_excluir",{id:b.dataset.nota});notasTela()})}
document.addEventListener("DOMContentLoaded",()=>{configurarTema();login()});
