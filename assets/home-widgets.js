/* Home: laterais (gadgets) + vídeos aleatórios com o mais recente fixo */
(function () {
  var N_VIDEOS = 3; /* total exibido: 1 mais recente + (N-1) aleatórios */
  var YT_CANAL = 'https://www.youtube.com/@djaguia1?sub_confirmation=1';
  var NEWSLETTER_ACTION = 'https://formspree.io/f/SEU_ID'; /* TROQUE pelo seu formulário */

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function limpa(t) { return String(t || '').replace(/\s+-\s*$/, '').trim(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lista(itens) {
    return '<ul>' + itens.map(function (x) {
      return '<li><a href="' + esc(x.u) + '">' + esc(limpa(x.t)) + '<small>' + esc(x.d) + '</small></a></li>';
    }).join('') + '</ul>';
  }
  function widget(titulo, html) { return '<section class="hw"><h3>' + esc(titulo) + '</h3>' + html + '</section>'; }

  /* ---- 1. Estrutura: [lateral esq] [conteúdo] [lateral dir] ---- */
  var page = document.querySelector('main.page');
  if (!page) return;
  var wrap = document.createElement('div'); wrap.className = 'home-3col';
  var esq = document.createElement('aside'); esq.className = 'lateral'; esq.id = 'lateralEsq';
  var dir = document.createElement('aside'); dir.className = 'lateral'; dir.id = 'lateralDir';
  page.parentNode.insertBefore(wrap, page);
  wrap.appendChild(esq); wrap.appendChild(page); wrap.appendChild(dir);

  /* ---- 2. Partes fixas (não dependem de dados) ---- */
  var esqFixo = widget('Inscreva-se', '<p>Receba os novos louvores do canal.</p><a class="hw-btn yt" href="' + YT_CANAL + '" target="_blank" rel="noopener">Inscrever-se no YouTube</a>');
  esq.innerHTML = '<div id="hwNoticias"></div><div id="hwTop5"></div>' + esqFixo + '<div id="hwHtml"></div>';

  dir.innerHTML =
    widget('Tempo em Capão da Canoa', '<div id="hwTempo"><span class="hw-desc">Carregando…</span></div>') +
    widget('Compartilhe',
      '<div class="hw-share">' +
      '<button class="hw-btn" type="button" onclick="shareVia(\'whatsapp\')">WhatsApp</button>' +
      '<button class="hw-btn" type="button" onclick="shareVia(\'facebook\')">Facebook</button>' +
      '<button class="hw-btn" type="button" onclick="shareVia(\'twitter\')">X</button>' +
      '<button class="hw-btn" type="button" onclick="shareVia(\'telegram\')">Telegram</button>' +
      '<button class="hw-btn full" type="button" onclick="copyLink()">Copiar link</button></div>') +
    widget('Newsletter',
      '<p>Receba novidades por e-mail.</p>' +
      '<form class="hw-form" action="' + NEWSLETTER_ACTION + '" method="POST">' +
      '<input type="email" name="email" placeholder="Seu e-mail" required>' +
      '<button class="hw-btn" type="submit">Quero receber</button></form>') +
    widget('Acesso rápido',
      '<ul><li><a href="estudio-ao-vivo.html">Ao Vivo</a></li><li><a href="noticias/videos/">Vídeos</a></li><li><a href="noticias/fotos/">Fotos</a></li><li><a href="contato.html">Contato</a></li><li><a href="sobre.html">Sobre</a></li></ul>');

  /* Código HTML livre: coloque <div id="codigo-html" hidden>SEU CÓDIGO</div> em qualquer lugar do index.html */
  var livre = document.getElementById('codigo-html');
  if (livre) {
    livre.hidden = false;
    var box = document.createElement('section'); box.className = 'hw';
    box.innerHTML = '<h3>Destaque</h3>'; box.appendChild(livre);
    document.getElementById('hwHtml').appendChild(box);
  }

  /* ---- 3. Tempo (Open-Meteo, sem chave) ---- */
  var nomes = {0:'Céu limpo',1:'Poucas nuvens',2:'Parcialmente nublado',3:'Nublado',45:'Neblina',48:'Neblina',51:'Garoa',53:'Garoa',55:'Garoa',61:'Chuva fraca',63:'Chuva',65:'Chuva forte',80:'Pancadas de chuva',81:'Pancadas de chuva',82:'Pancadas fortes',95:'Tempestade',96:'Tempestade',99:'Tempestade'};
  fetch('https://api.open-meteo.com/v1/forecast?latitude=-29.75&longitude=-50.01&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      document.getElementById('hwTempo').innerHTML =
        '<div class="hw-temp">' + Math.round(d.current.temperature_2m) + '°C</div>' +
        '<div class="hw-desc">' + esc(nomes[d.current.weather_code] || '—') + ' · máx ' + Math.round(d.daily.temperature_2m_max[0]) + '° / mín ' + Math.round(d.daily.temperature_2m_min[0]) + '°</div>';
    })
    .catch(function () { document.getElementById('hwTempo').textContent = 'Tempo indisponível no momento.'; });

  /* ---- 4. Dados do site (notícias, top5, vídeos) ---- */
  function cardVideo(v, primeiro) {
    var img = v.i || (v.y ? 'https://img.youtube.com/vi/' + v.y + '/hqdefault.jpg' : '');
    return '<article class="vd-card">' +
      (primeiro ? '<span class="vd-badge">Mais recente</span>' : '') +
      (img ? '<img class="vd-img" loading="lazy" alt="' + esc(limpa(v.t)) + '" src="' + esc(img) + '">' : '<div class="vd-img"></div>') +
      '<div class="vd-body"><h4><a href="' + esc(v.u) + '">' + esc(limpa(v.t)) + '</a></h4>' +
      '<p>' + esc(v.d) + (v.r ? ' · ' + esc(v.r) : '') + '</p><span class="vd-mais">Continuar lendo</span></div></article>';
  }

  fetch('noticias/dados.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.posts && d.posts.length) document.getElementById('hwNoticias').innerHTML = widget('Últimas notícias', lista(d.posts.slice(0, 5)));
      if (d.top5 && d.top5.length) document.getElementById('hwTop5').innerHTML = widget('Top 5', lista(d.top5.slice(0, 4)));

      /* Vídeos: [0] = mais recente (fixo), o resto sorteado */
      var antigo = document.querySelector('.continue-card');
      if (antigo && d.videos && d.videos.length) {
        var maisRecente = d.videos[0];
        var sorteados = shuffle(d.videos.slice(1)).slice(0, N_VIDEOS - 1);
        var bloco = document.createElement('div'); bloco.className = 'video-destaque';
        bloco.innerHTML = '<h4 class="vd-titulo">Vídeos</h4><div class="vd-grid">' +
          cardVideo(maisRecente, true) + sorteados.map(function (v) { return cardVideo(v, false); }).join('') + '</div>';
        antigo.parentNode.replaceChild(bloco, antigo);
      }
    })
    .catch(function () { /* sem dados: mantém o card antigo e as partes fixas */ });
})();

