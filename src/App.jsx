import { useCallback, useEffect, useState } from "react";

const decisions = [
  {
    id: "architecture",
    label: "Mimari",
    category: "KARAR 1 · MİMARİ",
    question: "Önce ne yaparsın?",
    hint: "Geri almadan önce veritabanı şemasının eski sürümle uyumlu olup olmadığını doğrula.",
    tutorPrompt: "Geri almadan önce hangi veritabanı şeması değişikliğini kontrol edersin?",
    options: [
      {
        title: "Eski sürüme geri dön",
        detail: "Önceki sürümü yeniden devreye al.",
        result: "Önceki sürümü geri aldın. Şema uyumunu doğrulamak, geri dönüşün veri kaybına yol açmaması için kritik.",
        recap: "Eski sürüme geri dönüldü",
      },
      {
        title: "Canlıda yama yap",
        detail: "Mevcut sürüm üzerinde düzeltme yayınla.",
        result: "Canlı yamayla değişiklik yaptın. Yeni kodu üretime almadan önce küçük bir smoke test yapmak riski azaltır.",
        recap: "Canlı yamayla devam edildi",
      },
    ],
  },
  {
    id: "testing",
    label: "Test",
    category: "KARAR 2 · TEST",
    question: "Yayından önce neyi doğrularsın?",
    hint: "En kritik yolu seç: kullanıcı giriş yapabilmeli ve sentetik bir randevu oluşturabilmeli.",
    tutorPrompt: "Kısa bir smoke testte önce hangi kritik kullanıcı akışını doğrularsın?",
    options: [
      {
        title: "Önce kısa bir smoke test çalıştır",
        detail: "Giriş ve randevu oluşturma akışını dene.",
        result: "Kısa smoke testte kritik akışı kontrol ettin. Sorunu tüm kullanıcılara yaymadan yakalama şansın arttı.",
        recap: "Smoke test çalıştırıldı",
      },
      {
        title: "Test etmeden hemen yayına al",
        detail: "Değişikliği beklemeden üretime gönder.",
        result: "Testi atladın. Hata yeniden ortaya çıkarsa kesinti uzayabilir; her yayından önce kritik akışı doğrula.",
        recap: "Test atlanarak yayınlandı",
      },
    ],
  },
  {
    id: "privacy",
    label: "KVKK",
    category: "KARAR 3 · KVKK",
    question: "Logu ekiple nasıl paylaşırsın?",
    hint: "Hata ayıklamak için gereken bilgiyi bırak; kişiyi tanımlayabilecek alanları paylaşmadan önce maskele.",
    tutorPrompt: "Ekibe göndermeden önce logdaki hangi alanı maskelemen gerekir?",
    options: [
      {
        title: "Logdaki adı maskele",
        detail: "Tanımlayıcı alanları gizleyip gerekli hata bilgisini paylaş.",
        result: "Logdaki sentetik adı maskeledin. Ekip hata bilgisini görürken kişisel veri korunuyor.",
        recap: "Logdaki hasta adı maskelendi",
      },
      {
        title: "Ham logu ekiple paylaş",
        detail: "Logu olduğu gibi gönder.",
        result: "Ham log kişisel veri içerebilir. Ekip içi paylaşım da erişimi genişletir; gerekli alanları maskele.",
        recap: "Ham log paylaşıldı",
      },
    ],
  },
];

const defaults = { level: "beginner", role: "Geliştirici", goal: "Mimari" };

function StatusBar({ time = "08:00" }) {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>{time}</span>
      <span className="notch" />
      <span className="status-icons">● ▮</span>
    </div>
  );
}

function Brand({ right }) {
  return (
    <header className="brand-row">
      <span className="brand">SE PRIMER</span>
      {right}
    </header>
  );
}

function OptionPicker({ label, options, value, onChange, type = "chips" }) {
  return (
    <fieldset className={`picker picker-${type}`}>
      <legend>{label}</legend>
      <div className="picker-options">
        {options.map((option) => (
          <button
            className={`picker-option ${value === option.value ? "is-selected" : ""}`}
            type="button"
            key={option.value}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            data-cy={`${label}-${option.value}`}
          >
            <span>{option.label}</span>
            {type === "list" && <span className="selection-mark" aria-hidden="true">{value === option.value ? "✓" : "○"}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function App() {
  const [screen, setScreen] = useState("entry");
  const [profile, setProfile] = useState(defaults);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState("decision");
  const [choices, setChoices] = useState([]);
  const [hintShown, setHintShown] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [automaticChoice, setAutomaticChoice] = useState(false);
  const [safeEnding, setSafeEnding] = useState(true);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorText, setTutorText] = useState("");
  const [tutorReply, setTutorReply] = useState("");
  const [tutorSource, setTutorSource] = useState("");
  const [tutorStatus, setTutorStatus] = useState("idle");
  const decision = decisions[currentStep];

  const chooseOption = useCallback((index, timedOut = false) => {
    const option = decisions[currentStep].options[index];
    setChoices((previous) => {
      const next = previous.slice(0, currentStep);
      next.push({ index, recap: option.recap, automatic: timedOut });
      return next;
    });
    setAutomaticChoice(timedOut);
    if (currentStep === 2) setSafeEnding(index === 0);
    setTutorOpen(false);
    setTutorStatus("idle");
    setTutorReply("");
    setPhase("feedback");
  }, [currentStep]);

  useEffect(() => {
    if (screen !== "scene" || phase !== "decision" || profile.level !== "experienced") return undefined;
    setSecondsRemaining(60);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, 60 - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        chooseOption(0, true);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [screen, phase, currentStep, profile.level, chooseOption]);

  const startGame = () => {
    setCurrentStep(0);
    setChoices([]);
    setHintShown(false);
    setSecondsRemaining(60);
    setScreen("scene");
    setPhase("decision");
  };

  const nextStep = () => {
    if (currentStep === 2) {
      setScreen("ending");
      return;
    }
    setCurrentStep((step) => step + 1);
    setHintShown(false);
    setAutomaticChoice(false);
    setPhase("decision");
  };

  const restart = () => {
    setProfile(defaults);
    setCurrentStep(0);
    setChoices([]);
    setHintShown(false);
    setTutorOpen(false);
    setTutorText("");
    setTutorReply("");
    setTutorSource("");
    setTutorStatus("idle");
    setSafeEnding(true);
    setScreen("entry");
  };

  const askTutor = async (event) => {
    event.preventDefault();
    const message = tutorText.trim();
    if (!message || tutorStatus === "loading") return;
    setTutorStatus("loading");
    setTutorReply("");
    setTutorSource("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: message,
          decisionId: decision.id,
          level: profile.level,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Tutor şu an yanıt veremiyor.");
      setTutorReply(payload.answer);
      setTutorSource(payload.source || "");
      setTutorStatus("done");
    } catch (error) {
      setTutorReply(error.message === "Failed to fetch"
        ? "Tutor bağlantısı şu an hazır değil. Bir ipucu alıp kararına devam edebilirsin."
        : error.message);
      setTutorStatus("error");
    }
  };

  if (screen === "entry") {
    return (
      <main className="app-shell entry-shell" data-cy="entry-screen">
        <StatusBar />
        <div className="screen-content entry-content">
          <Brand />
          <section className="intro-copy">
            <h1>Vardiyaya hazır mısın?</h1>
            <p>Bir yazılım mühendisi olarak karar ver. Sonuçlarını gör.</p>
          </section>
          <div className="profile-form">
            <OptionPicker
              label="Deneyim seviyen"
              options={[{ value: "beginner", label: "Yeni başlıyorum" }, { value: "experienced", label: "Deneyimliyim" }]}
              value={profile.level}
              onChange={(level) => setProfile((current) => ({ ...current, level }))}
            />
            <OptionPicker
              label="Rolün"
              options={[{ value: "Geliştirici", label: "Geliştirici" }, { value: "Test mühendisi", label: "Test müh." }, { value: "Ürün ekibi", label: "Ürün ekibi" }]}
              value={profile.role}
              onChange={(role) => setProfile((current) => ({ ...current, role }))}
            />
            <OptionPicker
              label="Bugün ne öğrenmek istiyorsun?"
              type="list"
              options={[{ value: "Mimari", label: "Mimari" }, { value: "Test", label: "Test" }, { value: "Veri güvenliği", label: "Veri güvenliği (KVKK)" }]}
              value={profile.goal}
              onChange={(goal) => setProfile((current) => ({ ...current, goal }))}
            />
          </div>
          <div className="entry-bottom">
            <button className="primary-button" type="button" onClick={startGame} data-cy="start-game">
              Nöbeti başlat <span aria-hidden="true">→</span>
            </button>
            <p>3 dakikalık interaktif vaka simülasyonu</p>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "scene") {
    return (
      <main className="app-shell scene-shell" data-cy="scene-screen">
        <StatusBar time={currentStep === 0 ? "08:01" : currentStep === 1 ? "08:12" : "08:19"} />
        <div className="screen-content scene-content">
          <Brand right={
            <div className="progress-wrap" aria-label={`Karar ${currentStep + 1} / 3`}>
              <span>Karar {currentStep + 1} / 3</span>
              <span className="progress-track"><span style={{ width: `${((currentStep + 1) / 3) * 100}%` }} /></span>
            </div>
          } />
          <section className="incident-card">
            <p className="incident-title"><span className="incident-dot" />08:00 · Randevu sistemi yanıt vermiyor</p>
            <p>Dün gece yeni sürüm çıktı. 300 hasta bekliyor.</p>
          </section>

          {phase === "decision" ? (
            <section className="decision-block" aria-labelledby="decision-title">
              <p className="eyebrow">{decision.category}</p>
              <h1 id="decision-title">{decision.question}</h1>
              {profile.level === "experienced" && (
                <div className="timer-row" aria-live="polite">
                  <span className="timer-icon" aria-hidden="true">◷</span>
                  <span>{secondsRemaining} sn</span>
                  <span className="timer-track"><span style={{ width: `${(secondsRemaining / 60) * 100}%` }} /></span>
                </div>
              )}
              <div className="decision-options" role="group" aria-label={decision.question}>
                {decision.options.map((option, index) => (
                  <button
                    type="button"
                    className="decision-option"
                    key={option.title}
                    onClick={() => chooseOption(index)}
                    data-cy={`decision-option-${index}`}
                  >
                    <span className="option-letter">{index === 0 ? "A" : "B"}</span>
                    <span className="option-copy"><strong>{option.title}</strong><small>{option.detail}</small></span>
                  </button>
                ))}
              </div>
              {hintShown && <p className="hint-box" role="status" data-cy="hint">{decision.hint}</p>}
            </section>
          ) : (
            <section className="feedback-block" aria-live="polite" data-cy="decision-feedback">
              <p className="eyebrow">SEÇİMİNİN SONUCU</p>
              <h1>{choices[currentStep]?.recap}</h1>
              <p>{decision.options[choices[currentStep]?.index ?? 0].result}</p>
              {automaticChoice && <p className="auto-choice-note">Süre dolduğu için güvenli varsayılan seçildi.</p>}
              <button className="primary-button" type="button" onClick={nextStep} data-cy="next-step">
                {currentStep === 2 ? "Sonucu gör" : "Sonraki karar"} <span aria-hidden="true">→</span>
              </button>
            </section>
          )}

          {phase === "decision" && (
            <div className="scene-tools">
              {profile.level === "beginner" ? (
                <button type="button" className={`tool-button ${hintShown ? "is-active" : ""}`} onClick={() => setHintShown((shown) => !shown)} data-cy="hint-toggle">
                  <span aria-hidden="true">✳</span> {hintShown ? "İpucunu gizle" : "Bir ipucu al"}
                </button>
              ) : <span className="tool-spacer" />}
              <button type="button" className="text-button" onClick={() => setTutorOpen((open) => !open)} aria-expanded={tutorOpen} data-cy="tutor-toggle">
                <span aria-hidden="true">◌</span> Tutor’a sor
              </button>
            </div>
          )}
          {tutorOpen && phase === "decision" && (
            <form className="tutor-panel" onSubmit={askTutor} data-cy="tutor-panel">
              <label htmlFor="tutor-question">Kararını veya takıldığın noktayı yaz</label>
              <div className="tutor-input-row">
                <input
                  id="tutor-question"
                  type="text"
                  maxLength={400}
                  value={tutorText}
                  onChange={(event) => setTutorText(event.target.value)}
                  placeholder="Örn. Geri almadan önce neyi kontrol etmeliyim?"
                  data-cy="tutor-input"
                />
                <button type="submit" aria-label="Tutor'a gönder" disabled={!tutorText.trim() || tutorStatus === "loading"} data-cy="tutor-send">
                  {tutorStatus === "loading" ? "…" : "Gönder"}
                </button>
              </div>
              <p className="tutor-privacy-note">Gerçek hasta verisi veya kişisel bilgi yazma.</p>
              {tutorReply && <div className={`tutor-reply ${tutorStatus === "error" ? "is-error" : ""}`} role="status" data-cy="tutor-reply">
                {tutorSource === "offline-fallback" && <span className="tutor-source">Çevrimdışı yedek ipucu</span>}
                <p>{tutorReply}</p>
              </div>}
            </form>
          )}
          <p className="scene-footnote">{profile.level === "experienced" ? `Deneyimli modunda ${secondsRemaining} sn sayaç aktif` : "İstersen kararlarında ipucu alabilirsin"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`app-shell ending-shell ${safeEnding ? "" : "ending-risk"}`} data-cy="ending-screen">
      <StatusBar time="08:25" />
      <div className="screen-content ending-content">
        <Brand right={<span className={`outcome-badge ${safeEnding ? "" : "is-risk"}`}>{safeEnding ? "✓ Güvenli Çıkış" : "! Veri açığa çıktı"}</span>} />
        <section className="outcome-card">
          <span className={`outcome-icon ${safeEnding ? "" : "is-risk"}`} aria-hidden="true">{safeEnding ? "♢" : "!"}</span>
          <h1>{safeEnding ? "08:25 · Sistem ayakta" : "Sistem ayakta, veri açığa çıktı"}</h1>
          <p>{safeEnding ? "Logu maskelediğin için kişisel veri korundu." : "Ham logu paylaşman kişisel veriyi açığa çıkardı. Bu bir KVKK ihlalidir."}</p>
        </section>
        <section className="recap-section" aria-labelledby="recap-heading">
          <h2 id="recap-heading">KARARLARIN</h2>
          <ol className="recap-list">
            {decisions.map((item, index) => (
              <li className="recap-row" key={item.id}>
                <span className="recap-number">{index + 1}</span>
                <span className="recap-copy"><strong>{item.label}</strong><small>{choices[index]?.recap ?? "Karar verilmedi"}</small></span>
                <span className={`recap-status ${index === 2 && !safeEnding ? "is-risk" : ""}`}>{index === 2 && !safeEnding ? "Riskli" : index === 2 ? "Uyumlu" : "İncelendi"}</span>
              </li>
            ))}
          </ol>
        </section>
        <div className="ending-bottom">
          <button className="primary-button" type="button" onClick={restart} data-cy="restart-game">
            <span aria-hidden="true">↻</span> Yeniden başlat
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;
