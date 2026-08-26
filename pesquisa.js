(() => {
  "use strict";

  const STORAGE_KEY = "nexaraPesquisaNacional2026v6";
  const params = new URLSearchParams(location.search);
  const origin = params.get("origem") || "direto";
  const endpoint = window.NEXARA_SURVEY_ENDPOINT || "";
  const testMode = ["127.0.0.1", "localhost"].includes(location.hostname) && params.get("modo_teste") === "1";
  const yesConversation = "Sim, quero agendar a conversa";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const states = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  const installedOptions = ["Existe e está em uso", "Está em construção", "Não existe", "Não sei informar"];
  const likertOptions = [["1","Discordo totalmente"],["2","Discordo"],["3","Nem concordo nem discordo"],["4","Concordo"],["5","Concordo totalmente"],["Não sei","Não sei"]];

  const questions = {
    2: [
      { id:"P1", label:"Estado onde a escola está localizada.", type:"select", options:states, required:true },
      { id:"P2", label:"Número aproximado de alunos matriculados.", type:"radio", options:["Até 300","301 a 600","601 a 1.000","1.001 a 2.000","Mais de 2.000"], required:true },
      { id:"P3", label:"Número de unidades.", type:"radio", options:["1","2 a 3","4 a 5","6 ou mais"], required:true },
      { id:"P4", label:"Nos últimos dois anos, o número de alunos matriculados na escola:", type:"radio", options:["Cresceu de forma significativa","Cresceu de forma moderada","Permaneceu estável","Reduziu de forma moderada","Reduziu de forma significativa","Não sei informar"], required:true },
      { id:"P5", label:"Sua principal função na escola.", type:"radio", options:["Mantenedor ou proprietário","Diretor geral","Diretor pedagógico","Diretor administrativo-financeiro","Coordenador","RH ou Gestão de Pessoas","Outra posição de liderança"], required:true },
      { id:"P6", label:"Seu nível de participação nas decisões da escola.", type:"radio", options:["Tomo decisões diretamente","Participo das decisões","Sou consultado, mas não decido","Recebo decisões já tomadas"], required:true },
    ],
    3: [
      { id:"P7", label:"Como está organizada a área de pessoas na sua escola?", type:"radio", options:["RH estruturado, com atuação além da rotina trabalhista","Departamento pessoal, com foco em folha, admissão e desligamento","A função é acumulada por alguém de outra área","Não existe função formal de pessoas","Não sei informar"], required:true },
      { id:"P8-P15", type:"matrix", required:true, options:installedOptions, rows:[
        ["P8","A gestão de pessoas acompanha periodicamente a rotatividade (turnover) de professores"],
        ["P9","A liderança ouve os professores de forma periódica, com registro do que foi dito e retorno sobre os encaminhamentos"],
        ["P10","Existe avaliação de fatores de risco psicossocial incorporada ao inventário de riscos do PGR, conforme a NR-1"],
        ["P11","Depois da avaliação de risco psicossocial, existe um plano de ação escrito, com prazo e responsável por cada ação"],
        ["P12","Os cargos têm descrição clara do que fazem, e existe um critério definido de como e quando alguém progride para um cargo ou nível salarial superior"],
        ["P13","A direção realiza pesquisa periódica sobre a satisfação das famílias"],
        ["P14","Existe um canal formal para relatos, conflitos e denúncias"],
        ["P15","A liderança tem reuniões fixas, com pauta e registro de decisões, que conectam mantenedor/direção, coordenação e professores"],
      ]},
    ],
    4: [
      ["P16","Os professores têm clareza sobre o que a escola espera do trabalho deles."],
      ["P17","A liderança direta dos professores está preparada para conduzir as equipes."],
      ["P18","Ao definir carga de trabalho, rotina e prazos, a liderança leva em conta o efeito sobre o bem-estar psicológico dos professores."],
      ["P19","Ao definir carga de trabalho, rotina e prazos, a liderança leva em conta o efeito sobre o bem-estar psicológico dos demais colaboradores."],
      ["P20","As pessoas que trabalham na escola sentem que fazem parte da construção dela."],
      ["P21","A escola comunica às famílias sempre da mesma forma e com a mesma mensagem, independente de quem fala."],
      ["P22","As famílias percebem coerência entre o que a escola promete e o que entrega."],
      ["P23","Os alunos encontram na escola condições para desenvolver pertencimento."],
      ["P24","A escola consegue manter os professores que considera essenciais para sua operação."],
      ["P25","As famílias recomendariam a escola para outra família."],
    ].map(([id,label]) => ({ id,label,type:"likert",required:true })),
    5: [
      ["P26","Existe coerência entre os valores que a escola declara e aquilo que ela pratica."],
      ["P27","Decisões importantes são comunicadas sem que a equipe compreenda com clareza os critérios que levaram a elas."],
      ["P28","A escola tem clareza sobre suas prioridades para os próximos dois anos."],
      ["P29","Antes de decidir crescer, a escola avalia se as pessoas atuais conseguem sustentar esse crescimento."],
      ["P30","Boa parte das prioridades definidas no ano passado não saiu do papel."],
      ["P31","Quem toma uma decisão importante na escola também é quem responde pelo resultado dela."],
      ["P32","Assuntos que poderiam ser resolvidos por outras pessoas chegam à direção com frequência."],
    ].map(([id,label]) => ({ id,label,type:"likert",required:true })),
    6: [{ id:"P33", type:"matrix", required:true, label:"Pense em como você avaliou a escola até aqui: a forma como ela trata as pessoas, comunica, decide e conduz conflitos. Se esses grupos avaliassem a escola considerando esses aspectos, como você imagina que eles responderiam?", options:["Mais positivas que as minhas","Semelhantes às minhas","Mais críticas que as minhas","Não sei dizer"], rows:[["professores","Os professores"],["colaboradores","Os demais colaboradores"],["familias","As famílias"],["alunos","Os alunos"]] }],
    7: [
      { id:"P34", label:"Quando surge um problema relevante na escola, o que normalmente acontece primeiro?", type:"radio", options:["A liderança decide rapidamente","A equipe envolvida é chamada para discutir","O problema é analisado antes da decisão","Cada área tenta resolver a própria parte","O problema circula entre várias pessoas antes de alguém decidir","A decisão costuma ser adiada"], required:true },
      { id:"P35", label:"Quando surge um conflito entre pessoas ou áreas, o que normalmente acontece?", type:"radio", options:["Os envolvidos tratam diretamente","A liderança intervém","O conflito é discutido coletivamente","É encaminhado para RH ou gestão de pessoas","O conflito é evitado","Costuma permanecer sem solução"], required:true },
      { id:"P36", label:"Quando a escola enfrenta um problema de gestão de pessoas que ninguém internamente sabe como resolver, o que costuma acontecer?", type:"radio", options:["Resolvemos internamente, por tentativa e ajuste","Buscamos conteúdo, cursos ou material de referência e conduzimos por conta própria","Consultamos colegas de outras escolas ou a rede de contatos","Contratamos apoio externo pontual, para aquele problema específico","Contratamos apoio externo estruturado, com acompanhamento ao longo do tempo","O problema costuma ficar sem solução até que se torne urgente"], required:true },
      { id:"P37", label:"Quais são hoje os dois principais desafios da sua escola?", help:"Selecione até 2.", type:"checkbox", max:2, options:["Crescimento e expansão","Retenção de alunos","Relacionamento com famílias","Atração e retenção de professores","Liderança","Comunicação interna","Conflitos internos","Saúde e bem-estar das equipes","Clareza de papéis","Tomada de decisão","Execução da estratégia","Cultura e valores","Sustentabilidade financeira","Outro"], required:true },
      { id:"P38", label:"Se você pudesse resolver um único problema de gestão de pessoas nos próximos doze meses, qual seria?", type:"textarea", required:false },
    ],
    8: [
      { id:"P39", label:"Nome.", type:"text", autocomplete:"name", required:true },
      { id:"P40", label:"E-mail.", type:"email", autocomplete:"email", required:true },
      { id:"P41", label:"Nome da escola.", type:"text", autocomplete:"organization", required:true },
      { id:"P42", label:"Você gostaria de receber o relatório do estudo antes da publicação aberta?", type:"radio", options:["Sim","Não"], required:true },
      { id:"P43", label:"Indique até duas pessoas da liderança da sua escola que também poderiam responder.", help:"Quando mais de uma liderança da mesma escola responde, é possível comparar as diferentes percepções sobre a mesma instituição. Escolas com mais de uma resposta têm prioridade na devolutiva individual.", type:"emails", required:false },
      { id:"P44", label:"Você gostaria que eu lesse os números da sua escola com você?", help:"São 45 minutos, online, sobre os dados da sua escola. Não é apresentação de serviços. Agenda limitada a 15 escolas até 30 de setembro, com prioridade para as que tiverem mais de uma resposta.", type:"radio", options:[yesConversation,"Não, quero apenas o relatório do estudo"], required:true },
      { id:"P45", label:"WhatsApp para combinarmos a conversa.", help:"Usado apenas para agendar a conversa. Não entra em lista de disparo.", type:"tel", autocomplete:"tel", required:true, conditional:true },
    ],
  };

  function newId() {
    return crypto.randomUUID ? crypto.randomUUID() : `resp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } })();
  const state = {
    userId: saved.userId || newId(),
    screen: Number(saved.screen) || 1,
    responses: saved.responses || {},
    startedAt: saved.startedAt || new Date().toISOString(),
    timing: saved.timing || {},
    focusStarted: {},
  };

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  }

  function labelHtml(q) {
    return `<label class="question-label"><span class="question-number">${esc(q.id.replace(/-.*/, ""))}.</span>${esc(q.label || "")}${q.required ? ' <span class="required" aria-label="obrigatória">*</span>' : ""}${q.help ? `<small>${esc(q.help)}</small>` : ""}</label>`;
  }

  function choicesHtml(q, type = "radio") {
    return `<div class="choice-list">${q.options.map((option, index) => `<label class="choice"><input type="${type}" name="${esc(q.id)}" value="${esc(option)}" data-question="${esc(q.id)}" ${type === "radio" ? "" : `data-max="${q.max || ""}"`} /><span>${esc(option)}</span></label>`).join("")}</div>${q.max ? `<div class="max-count" data-count-for="${q.id}">0 de ${q.max} selecionados</div>` : ""}`;
  }

  function renderQuestion(q) {
    if (q.type === "likert") {
      return `<article class="likert-card" data-card="${q.id}"><p class="likert-question"><span class="question-number">${q.id}.</span>${esc(q.label)} <span class="required">*</span></p><div class="likert-options">${likertOptions.map(([value,label], index) => `<label class="likert-option ${index === 5 ? "unknown" : ""}" title="${esc(label)}"><input type="radio" name="${q.id}" value="${esc(value)}" data-question="${q.id}" /><span>${index === 5 ? "Não sei" : value}</span></label>`).join("")}</div></article>`;
    }
    if (q.type === "matrix") {
      return `<article class="question-card full" data-card="${q.id}">${q.label ? labelHtml(q) : `<p class="question-label"><span class="question-number">8–15.</span>Marque a situação atual de cada item. <span class="required">*</span></p>`}<div class="matrix-list">${q.rows.map(([key,label]) => `<div class="matrix-row" data-matrix-row="${esc(key)}"><strong>${/^P/.test(key) ? `${key}. ` : ""}${esc(label)}</strong><div class="choice-list">${q.options.map(option => `<label class="choice"><input type="radio" name="${esc(q.id)}_${esc(key)}" value="${esc(option)}" data-question="${esc(key)}" data-matrix="${esc(q.id)}" /><span>${esc(option)}</span></label>`).join("")}</div></div>`).join("")}</div></article>`;
    }
    let control = "";
    if (q.type === "select") control = `<select class="field-control" name="${q.id}" data-question="${q.id}"><option value="">Selecione</option>${q.options.map(v => `<option>${esc(v)}</option>`).join("")}</select>`;
    else if (q.type === "radio") control = choicesHtml(q);
    else if (q.type === "checkbox") control = choicesHtml(q, "checkbox");
    else if (q.type === "textarea") control = `<textarea class="field-control" name="${q.id}" data-question="${q.id}" maxlength="600"></textarea>`;
    else if (q.type === "emails") control = `<div class="subfields"><input class="field-control" type="email" name="P43_1" data-question="P43" placeholder="E-mail 1 (opcional)" /><input class="field-control" type="email" name="P43_2" data-question="P43" placeholder="E-mail 2 (opcional)" /></div>`;
    else control = `<input class="field-control" type="${q.type}" name="${q.id}" data-question="${q.id}" autocomplete="${q.autocomplete || "off"}" ${q.type === "tel" ? 'inputmode="tel"' : ""} />`;
    return `<article class="question-card ${q.conditional ? "conditional-field" : ""}" data-card="${q.id}" ${q.conditional ? "hidden" : ""}>${labelHtml(q)}${control}</article>`;
  }

  for (const screen of [2,3,4,5,6,7,8]) {
    const host = $(`#screen${screen}Questions`);
    if (screen === 2 || screen === 8) host.classList.add("two-columns");
    host.innerHTML = questions[screen].map(renderQuestion).join("");
  }

  function restoreInputs() {
    Object.entries(state.responses).forEach(([id,value]) => {
      if (id === "P33" && value && typeof value === "object") {
        Object.entries(value).forEach(([key,answer]) => { const input = $(`input[name="P33_${CSS.escape(key)}"][value="${CSS.escape(answer)}"]`); if (input) input.checked = true; });
      } else if (id === "P43" && Array.isArray(value)) {
        const fields = $$('input[data-question="P43"]'); fields.forEach((field,index) => field.value = value[index] || "");
      } else if (Array.isArray(value)) {
        value.forEach(answer => { const input = $(`input[name="${CSS.escape(id)}"][value="${CSS.escape(answer)}"]`); if (input) input.checked = true; });
      } else {
        const input = $(`[name="${CSS.escape(id)}"]`);
        if (!input) return;
        if (input.type === "radio") { const checked = $(`input[name="${CSS.escape(id)}"][value="${CSS.escape(String(value))}"]`); if (checked) checked.checked = true; }
        else input.value = value ?? "";
      }
    });
    for (let p = 8; p <= 15; p += 1) {
      const value = state.responses[`P${p}`];
      if (value) { const input = $(`input[data-question="P${p}"][value="${CSS.escape(String(value))}"]`); if (input) input.checked = true; }
    }
    updateConditional(); updateCounts();
  }

  function collect() {
    $$('[data-question]').forEach(input => {
      const id = input.dataset.question;
      if (/^P(?:[8-9]|1[0-5])$/.test(id) && input.checked) state.responses[id] = input.value;
      else if (input.dataset.matrix === "P33" && input.checked) state.responses.P33 = { ...(state.responses.P33 || {}), [id]: input.value };
      else if (id === "P43") state.responses.P43 = $$('input[data-question="P43"]').map(i => i.value.trim()).filter(Boolean);
      else if (input.type === "checkbox") state.responses[id] = $$(`input[name="${CSS.escape(id)}"]:checked`).map(i => i.value);
      else if (input.type === "radio") { if (input.checked) state.responses[id] = input.value; }
      else state.responses[id] = input.value.trim();
    });
    if (state.responses.P44 !== yesConversation) delete state.responses.P45;
  }

  function persist(showStatus = true) {
    collect();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId:state.userId, screen:state.screen, responses:state.responses, startedAt:state.startedAt, timing:state.timing }));
    if (showStatus) setStatus("Salvo neste dispositivo", "success");
  }

  function setStatus(message, kind = "") {
    const status = $("#saveStatus"); status.textContent = message; status.dataset.state = kind;
  }

  function backendPayload(complete) {
    return { action:"survey_save", version:"v6", timestamp:new Date().toISOString(), origem:origin, user_id:state.userId, completo:Boolean(complete), current_screen:state.screen, started_at:state.startedAt, elapsed_seconds:Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000), item_timing_seconds:state.timing, responses:state.responses, page_url:location.href };
  }

  async function saveToBackend(complete = false) {
    persist();
    if (testMode) { await new Promise(resolve => setTimeout(resolve, 80)); setStatus("Gravação de teste confirmada", "success"); return { ok:true, test:true }; }
    if (!endpoint) { setStatus("Planilha ainda não conectada", "error"); return { ok:false, reason:"not_configured" }; }
    setStatus("Gravando na planilha…");
    try {
      const response = await fetch(endpoint, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(backendPayload(complete)), redirect:"follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || "Falha de gravação");
      setStatus(complete ? "Resposta registrada" : "Gravação confirmada", "success");
      return data;
    } catch (error) {
      setStatus("Sem confirmação da planilha", "error");
      return { ok:false, reason:"network", error:String(error) };
    }
  }

  function updateConditional() {
    const show = state.responses.P44 === yesConversation || $(`input[name="P44"][value="${CSS.escape(yesConversation)}"]`)?.checked;
    const card = $('[data-card="P45"]');
    card.hidden = !show;
    const input = $('[name="P45"]'); if (input) input.required = show;
  }

  function updateCounts() {
    $$('[data-count-for]').forEach(label => { const id = label.dataset.countFor; const count = $$(`input[name="${CSS.escape(id)}"]:checked`).length; const max = Number($(`input[name="${CSS.escape(id)}"]`)?.dataset.max || 0); label.textContent = `${count} de ${max} selecionados`; label.classList.toggle("limit", count === max); });
  }

  function questionDefs(screen) {
    return questions[screen] || [];
  }

  function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
  function validateScreen(screen) {
    collect();
    $$('.invalid').forEach(el => el.classList.remove("invalid"));
    const invalid = [];
    questionDefs(screen).forEach(q => {
      if (q.conditional && state.responses.P44 !== yesConversation) return;
      let valid = true;
      if (q.type === "matrix") {
        if (q.id === "P33") valid = q.rows.every(([key]) => state.responses.P33?.[key]);
        else valid = q.rows.every(([key]) => state.responses[key]);
      } else if (q.required) {
        const value = state.responses[q.id];
        valid = Array.isArray(value) ? value.length > 0 : Boolean(value);
      }
      if (q.id === "P37" && (state.responses.P37 || []).length > 2) valid = false;
      if (q.id === "P40" && state.responses.P40) valid = validEmail(state.responses.P40);
      if (q.id === "P43" && (state.responses.P43 || []).some(v => !validEmail(v))) valid = false;
      if (!valid) { invalid.push(q.id); $(`[data-card="${CSS.escape(q.id)}"]`)?.classList.add("invalid"); }
    });
    const message = $("#validationMessage");
    message.textContent = invalid.length ? "Confira os campos destacados antes de continuar." : "";
    if (invalid.length) $(`[data-card="${CSS.escape(invalid[0])}"]`)?.scrollIntoView({ behavior:"smooth", block:"center" });
    return invalid.length === 0;
  }

  function showScreen(screen) {
    state.screen = Math.max(1, Math.min(9, screen));
    $$(".survey-screen").forEach(el => el.classList.toggle("active", Number(el.dataset.screen) === state.screen));
    const withinForm = state.screen >= 2 && state.screen <= 8;
    $("#progressShell").hidden = !withinForm;
    $("#surveyActions").hidden = !withinForm;
    if (withinForm) {
      const step = state.screen - 1;
      $("#progressLabel").textContent = `Etapa ${step} de 7`;
      $("#progressBar").style.width = `${step / 7 * 100}%`;
      $("#backButton").style.visibility = state.screen === 2 ? "hidden" : "visible";
      $("#nextButton").textContent = state.screen === 8 ? "Enviar respostas" : "Continuar";
    }
    $("#validationMessage").textContent = "";
    scrollTo({ top:0, behavior:"auto" });
    if (state.screen !== 9) persist(false);
  }

  $("#startSurvey").addEventListener("click", () => showScreen(2));
  $("#backButton").addEventListener("click", () => showScreen(state.screen - 1));
  $("#nextButton").addEventListener("click", async () => {
    if (!validateScreen(state.screen)) return;
    const button = $("#nextButton"); button.disabled = true;
    const final = state.screen === 8;
    const result = await saveToBackend(final);
    button.disabled = false;
    if (final && !result.ok) {
      $("#validationMessage").textContent = result.reason === "not_configured" ? "A planilha da pesquisa ainda não foi conectada. Suas respostas continuam salvas neste dispositivo." : "Não foi possível confirmar o envio. Confira sua conexão e tente novamente.";
      return;
    }
    if (final) { localStorage.removeItem(STORAGE_KEY); showScreen(9); }
    else showScreen(state.screen + 1);
  });

  $("#copyLink").addEventListener("click", async () => {
    const clean = `${location.origin}${location.pathname.replace(/pesquisa\.html$/, "pesquisa.html")}${origin !== "direto" ? `?origem=${encodeURIComponent(origin)}` : ""}`;
    try { await navigator.clipboard.writeText(clean); $("#copyStatus").textContent = "Link copiado."; }
    catch { $("#copyStatus").textContent = clean; }
  });

  $("#surveyForm").addEventListener("change", event => {
    if (event.target.type === "checkbox" && event.target.dataset.max) {
      const checked = $$(`input[name="${CSS.escape(event.target.name)}"]:checked`);
      if (checked.length > Number(event.target.dataset.max)) { event.target.checked = false; $("#validationMessage").textContent = "Selecione no máximo duas opções."; }
    }
    collect(); updateConditional(); updateCounts(); persist();
    const id = event.target.dataset.question;
    if (id && state.focusStarted[id]) { state.timing[id] = Math.round(((state.timing[id] || 0) + (performance.now() - state.focusStarted[id]) / 1000) * 10) / 10; delete state.focusStarted[id]; }
  });
  $("#surveyForm").addEventListener("focusin", event => { const id = event.target.dataset.question; if (id && !state.focusStarted[id]) state.focusStarted[id] = performance.now(); });
  $("#surveyForm").addEventListener("input", event => { if (["text","email","tel","textarea"].includes(event.target.type) || event.target.tagName === "TEXTAREA") persist(); });

  addEventListener("beforeunload", () => {
    persist();
    if (endpoint && state.screen > 1 && state.screen < 9) navigator.sendBeacon?.(endpoint, JSON.stringify({ ...backendPayload(false), action:"survey_abandon" }));
  });

  restoreInputs();
  showScreen(state.screen === 9 ? 1 : state.screen);
})();
