// ...existing code yok...
let sorular = [];
fetch('kedibotSorular.json')
  .then(res => res.json())
  .then(data => { sorular = data; });

const NASILSINLAR = [
  "nasılsın", "nasilsin", "Nasılsın", "Nasılsın?", "nasılsın?", "nasilsin?", "naber", "Naber", "naber?", "Naber?"
];
const TESSEKKURLER = [
  "teşekkür ederim", "teşekkürler", "teşekürler", "thanks", "thank you", "teşekkür", "tesekkur", "tesekkurler", "sağol", "sagol", "çok teşekkürler", "cok tesekkurler"
];

function normalize(str) {
  return str.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşöçıİ ]/gi, '').trim();
}

function isNasılsın(input) {
  const norm = normalize(input);
  return NASILSINLAR.some(n => normalize(n) === norm);
}
function isTesekkur(input) {
  const norm = normalize(input);
  return TESSEKKURLER.some(n => normalize(n) === norm) || norm.includes("teşekkür") || norm.includes("tesekkur") || norm.includes("thanks");
}

function findSoru(userInput) {
  const normInput = normalize(userInput);
  for (const s of sorular) {
    if (normalize(s.soru) === normInput) return { type: 'exact', soru: s.soru };
    for (const v of s.varyasyonlar) {
      if (normalize(v) === normInput) return { type: 'variation', soru: s.soru };
    }
  }
  // Benzerlik kontrolü (basit)
  for (const s of sorular) {
    for (const v of [s.soru, ...s.varyasyonlar]) {
      if (normInput.includes(normalize(v)) || normalize(v).includes(normInput)) {
        return { type: 'suggest', soru: s.soru };
      }
    }
  }
  return null;
}

let sonOnerilenSoru = null;

function botCevapla(input) {
  if (isNasılsın(input)) {
    return "Kedisel olarak iyiyim, sen nasılsın? 🐾";
  }
  if (isTesekkur(input)) {
    return "Rica ederim, miyavolojik olarak size miyavdımcı olmak için buradayım! 😺";
  }
  // Kullanıcı "evet" derse ve son önerilen soru varsa, cevabı göster
  if (sonOnerilenSoru && normalize(input) === "evet") {
    const s = sorular.find(s => normalize(s.soru) === normalize(sonOnerilenSoru));
    sonOnerilenSoru = null;
    return s && s.cevap ? s.cevap : "(Cevap bulunamadı)";
  }
  const sonuc = findSoru(input);
  if (!sonuc) {
    sonOnerilenSoru = null;
    return "Üzgünüm, bu konuda bilgim yok. Lütfen daha farklı bir şekilde sorabilir misiniz?";
  }
  if (sonuc.type === 'exact' || sonuc.type === 'variation') {
    sonOnerilenSoru = null;
    const s = sorular.find(s =>
      normalize(s.soru) === normalize(sonuc.soru)
    );
    return s && s.cevap ? s.cevap : "(Cevap bulunamadı)";
  }
  if (sonuc.type === 'suggest') {
    sonOnerilenSoru = sonuc.soru;
    // Soruya tıklanabilirlik ekle
    return `Bunu mu sormak istediniz: <b class="suggested-soru" style="cursor:pointer;text-decoration:underline;" data-soru="${sonuc.soru.replace(/"/g, '&quot;')}">${sonuc.soru}</b>?<br><span class="suggestion-tip">(<i>Soruya tıklayarak otomatik kopyalayabilirsiniz.</i>)</span>`;
  }
}

const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = 'message ' + who;
  if (who === 'bot') {
    div.innerHTML = `<span class="profile-pic">😸</span><span class="bubble">${text}</span>`;
  } else {
    div.innerHTML = `<span class="bubble">${text}</span>`;
  }
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Soru önerisine tıklama desteği
  if (who === 'bot') {
    setTimeout(() => {
      const el = div.querySelector('.suggested-soru');
      if (el) {
        el.addEventListener('click', function() {
          userInput.value = el.getAttribute('data-soru');
          userInput.focus();
        });
      }
    }, 10);
  }
}

chatForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const input = userInput.value.trim();
  if (!input) return;
  addMessage(input, 'user');
  const cevap = botCevapla(input);
  setTimeout(() => addMessage(cevap, 'bot'), 400);
  userInput.value = '';
});

// Açılış mesajı otomatik gönder
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    addMessage("Ben kedisel anlamda bilinen ilk yapay zekayım.<br>Size nasıl miyavdımcı olabilirim? 😺", 'bot');
  }, 400);
});
