/* ============ NAVBAR ============ */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

/* ============ REVEAL ON SCROLL ============ */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============ CAROUSEL ============ */
function buildCarousel(root){
  const track = root.querySelector('.carousel__track');
  const allSlides = Array.from(track.children);
  const prev = root.querySelector('.carousel__btn--prev');
  const next = root.querySelector('.carousel__btn--next');
  const dotsWrap = root.querySelector('.carousel__dots');

  const dDesktop = parseInt(root.dataset.desktop || '3', 10);
  const dTablet  = parseInt(root.dataset.tablet  || '2', 10);
  const dMobile  = parseInt(root.dataset.mobile  || '2', 10);

  let perView = dDesktop;
  let gap = 24;
  let index = 0;
  let maxIndex = 0;

  function visibleSlides(){ return allSlides.filter(s => s.style.display !== 'none'); }

  function computePerView(count){
    const w = window.innerWidth;
    if (w < 768) { perView = dMobile; gap = 16; }
    else if (w < 1024) { perView = dTablet; gap = 20; }
    else { perView = dDesktop; gap = 24; }
    perView = Math.min(perView, Math.max(1, count));
  }

  function slideW(){
    const vpWidth = track.parentElement.clientWidth;
    return (vpWidth - gap * (perView - 1)) / perView;
  }

  function layout(){
    const vis = visibleSlides();
    computePerView(vis.length);
    const sw = slideW();
    track.style.gap = gap + 'px';
    allSlides.forEach(s => { s.style.width = sw + 'px'; });
    maxIndex = Math.max(0, vis.length - perView);
    if (index > maxIndex) index = maxIndex;
    buildDots();
    update();
  }

  function buildDots(){
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (let i = 0; i <= maxIndex; i++){
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => { index = i; update(); });
      dotsWrap.appendChild(b);
    }
  }

  function update(){
    track.style.transform = `translateX(${-(slideW() + gap) * index}px)`;
    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= maxIndex;
    if (dotsWrap){
      Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === index));
    }
  }

  prev && prev.addEventListener('click', () => { if (index > 0){ index--; update(); } });
  next && next.addEventListener('click', () => { if (index < maxIndex){ index++; update(); } });

  /* touch / drag swipe */
  let startX = 0, dragging = false;
  const vp = root.querySelector('.carousel__viewport');
  vp.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dragging = true; }, { passive:true });
  vp.addEventListener('touchend', e => {
    if (!dragging) return;
    dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40){
      if (dx < 0 && index < maxIndex) index++;
      else if (dx > 0 && index > 0) index--;
      update();
    }
  }, { passive:true });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
  window.addEventListener('load', layout);
  root.__carousel = { layout, reset(){ index = 0; } };
  layout();
}
document.querySelectorAll('.carousel').forEach(buildCarousel);

/* ============ PROJECT CATEGORY FILTER ============ */
const projCarousel = document.getElementById('projektaiCarousel');
const filters = document.querySelectorAll('.filter');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  const cat = btn.dataset.filter;
  projCarousel.querySelectorAll('.card--project').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
  if (projCarousel.__carousel){ projCarousel.__carousel.reset(); projCarousel.__carousel.layout(); }
}));

/* ============ LIGHTBOX ============ */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('.card--project').forEach(card => {
  card.addEventListener('click', () => {
    const src = card.dataset.img;
    if (!src) return;
    lightboxImg.src = src;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => { lightboxImg.src = ''; }, 300);
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });

/* ============ PARALLAX BACKGROUNDS ============ */
const parallaxSecs = Array.from(document.querySelectorAll('.parallax-bg'))
  .map(bg => ({ sec: bg.parentElement, bg }))
  .filter(o => o.sec);
function runParallax(){
  const vh = window.innerHeight;
  for (const { sec, bg } of parallaxSecs){
    const r = sec.getBoundingClientRect();
    if (r.bottom < -80 || r.top > vh + 80) continue;
    const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1 across viewport
    const shift = p * sec.offsetHeight * 0.12;
    bg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
  }
}
let pTicking = false;
window.addEventListener('scroll', () => {
  if (!pTicking){ requestAnimationFrame(() => { runParallax(); pTicking = false; }); pTicking = true; }
}, { passive:true });
window.addEventListener('resize', runParallax);
window.addEventListener('load', runParallax);
runParallax();

/* ============ CONTACT FORM ============ */
const fileInput = document.getElementById('fileInput');
const fileText = document.getElementById('fileText');
if (fileInput){
  fileInput.addEventListener('change', () => {
    const n = fileInput.files.length;
    if (n === 0) fileText.textContent = 'Pasirinkite failus (planai, nuotraukos)';
    else if (n === 1) fileText.textContent = fileInput.files[0].name;
    else fileText.textContent = n + ' failai pasirinkti';
  });
}

const contactForm = document.getElementById('contactForm');
if (contactForm){
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!contactForm.checkValidity()){ contactForm.reportValidity(); return; }
    const note = document.getElementById('formNote');
    note.hidden = false;
    contactForm.querySelector('.form-submit').textContent = 'Užklausa paruošta';
    setTimeout(() => {
      contactForm.reset();
      if (fileText) fileText.textContent = 'Pasirinkite failus (planai, nuotraukos)';
    }, 400);
  });
}

/* ============ SUPPORT CHATBOT (žinių bazė) ============ */
(function(){
  const chat = document.getElementById('chat');
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const body = document.getElementById('chatBody');
  const chips = document.getElementById('chatChips');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatText');
  if (!chat || !fab || !panel) return;

  // strip Lithuanian diacritics + lowercase for matching
  const norm = s => s.toLowerCase()
    .replace(/ą/g,'a').replace(/č/g,'c').replace(/ę/g,'e').replace(/ė/g,'e')
    .replace(/į/g,'i').replace(/š/g,'s').replace(/ų/g,'u').replace(/ū/g,'u').replace(/ž/g,'z');

  // Knowledge base derived from the site content
  const KB = [
    { keys:['labas','sveiki','sveik','hello','hi','laba diena','gero'],
      a:'Sveiki! Esu Tarytum asistentas. Galiu papasakoti apie mūsų paslaugas, procesą, kainas, projektus ir kontaktus. Ko norėtumėte sužinoti?' },
    { keys:['paslaug','ka siulot','ka darot','ka teikiat','ka galit','veikla'],
      a:'Teikiame šias paslaugas:\n• Interjero projektavimas\n• Erdvės planavimas\n• 3D vizualizacijos\n• Baldų projektavimas\n• Medžiagų parinkimas\n• Projekto priežiūra\n\nDaugiau rasite skiltyje „Paslaugos“.' },
    { keys:['kain','kiek kainuoja','kiek kastu','biudzet','kainoras','ikainiai','kaina'],
      a:'Projekto kaina priklauso nuo erdvės ploto ir darbų apimties. Tiksliai įvertiname po pirmos konsultacijos. Parašykite mums el. paštu home@tarytum.com arba paskambinkite +370 639 55105 ir pasiūlysime sprendimą.' },
    { keys:['proces','etapai','kaip dirbat','kaip vyksta','zingsni','eiga'],
      a:'Dirbame penkiais žingsniais:\n1. Susipažinimas ir poreikiai\n2. Planavimas ir koncepcija\n3. 3D vizualizacijos\n4. Techninė dokumentacija\n5. Įgyvendinimas ir priežiūra\n\nDaugiau skiltyje „Procesas“.' },
    { keys:['kiek trunk','kiek uztrunk','laik','termin','greit','kada baig','trukme'],
      a:'Projekto trukmė priklauso nuo apimties. Paprastai pilnas interjero projektas trunka nuo kelių savaičių iki poros mėnesių. Tikslų terminą suderiname individualiai.' },
    { keys:['konsultac','susitik','pradeti','noriu projekt','uzsakyt','rezervuot'],
      a:'Mielai pasikalbėsime! Susisiekite: home@tarytum.com arba +370 639 55105, taip pat galite užpildyti formą skiltyje „Kontaktai“ ir mes atsakysime.' },
    { keys:['kontakt','telefon','numeris','pasta','email','el pasta','susisiek','parasyt'],
      a:'Mūsų kontaktai:\n• El. paštas: home@tarytum.com\n• Telefonas: +370 639 55105\n• Adresas: Pilies tak. 1, Raudondvaris, Kauno r.\n• Instagram: @tarytum.studio, Facebook: /tarytum' },
    { keys:['adres','kur esat','kur jus','kur dirbat','vietov','miest','nuotoli','regionas','kur rasti'],
      a:'Esame Raudondvaryje (Pilies tak. 1, Kauno r.), tačiau dirbame visoje Lietuvoje ir užsienyje.' },
    { keys:['projekt','darbai','portfolio','pavyzd','realizac','galerij'],
      a:'Įgyvendintus darbus rasite skiltyje „Projektai“: Kaunas, Vilnius, Trakai, Klaipėda, Ukmergė, taip pat Gentas (Belgija). Spustelėkite bet kurią kortelę ir pamatysite nuotrauką didesnę.' },
    { keys:['vizualizac','3d','render','kaip atrodys'],
      a:'Taip, kuriame realistiškas 3D vizualizacijas, kad galutinį rezultatą pamatytumėte dar prieš darbų pradžią.' },
    { keys:['bald','virtuv','spint','baldu'],
      a:'Projektuojame individualius baldus ir rengiame jų brėžinius konkrečiai jūsų erdvei, įskaitant virtuves ir saugyklas.' },
    { keys:['apie','kas esat','kas jus','studij','patirt','kompanij'],
      a:'Tarytum yra interjero projektavimo studija iš Raudondvario. Kuriame jaukius ir funkcionalius interjerus su natūraliomis medžiagomis ir ramia spalvų gama. Įgyvendinome 20+ projektų Lietuvoje ir Belgijoje.' },
    { keys:['instagram','facebook','soc','tinkl','feisbuk'],
      a:'Mus rasite socialiniuose tinkluose: Instagram @tarytum.studio ir Facebook /tarytum.' },
    { keys:['aciu','dekoj','super','puiku','gerai'],
      a:'Prašom! Jei turite daugiau klausimų, klauskite drąsiai. 🙂' },
  ];
  const FALLBACK = 'Ačiū už klausimą! Tiksliausiai atsakysime tiesiogiai: home@tarytum.com arba +370 639 55105. Taip pat galiu papasakoti apie paslaugas, procesą, kainas, projektus ar kontaktus, tiesiog paklauskite.';

  function answer(text){
    const q = norm(text);
    let best = null, bestScore = 0;
    for (const item of KB){
      let score = 0;
      for (const k of item.keys){ if (q.includes(norm(k))) score += k.split(' ').length; }
      if (score > bestScore){ bestScore = score; best = item; }
    }
    return bestScore > 0 ? best.a : FALLBACK;
  }

  // turn emails/phones/urls into links, escape the rest
  function linkify(t){
    const esc = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return esc
      .replace(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi,'<a href="mailto:$1">$1</a>')
      .replace(/(\+370[\d\s]{7,})/g, m => `<a href="tel:${m.replace(/\s/g,'')}">${m.trim()}</a>`)
      .replace(/\n/g,'<br>');
  }

  function addMsg(text, who){
    const el = document.createElement('div');
    el.className = 'msg msg--' + who;
    el.innerHTML = who === 'bot' ? linkify(text) : text.replace(/</g,'&lt;');
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function botReply(text){
    const typing = document.createElement('div');
    typing.className = 'chat__typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => {
      typing.remove();
      addMsg(answer(text), 'bot');
    }, 500);
  }

  const QUICK = ['Kokios paslaugos?','Kiek kainuoja?','Kaip vyksta procesas?','Kontaktai'];
  function buildChips(){
    chips.innerHTML = '';
    QUICK.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = q;
      b.addEventListener('click', () => { send(q); });
      chips.appendChild(b);
    });
  }

  function send(text){
    text = text.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    botReply(text);
  }

  let started = false;
  function openChat(){
    chat.classList.add('chat--open');
    panel.hidden = false;
    fab.setAttribute('aria-label','Uždaryti pokalbį');
    if (!started){
      started = true;
      setTimeout(() => addMsg('Sveiki! 👋 Esu Tarytum asistentas. Galiu greitai atsakyti į klausimus apie mūsų paslaugas, procesą, kainas ir kontaktus.', 'bot'), 250);
      buildChips();
    }
    setTimeout(() => input.focus(), 300);
  }
  function closeChat(){
    chat.classList.remove('chat--open');
    panel.hidden = true;
    fab.setAttribute('aria-label','Atidaryti pokalbį');
  }
  fab.addEventListener('click', () => chat.classList.contains('chat--open') ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);
  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && chat.classList.contains('chat--open')) closeChat(); });
})();
