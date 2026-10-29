# SE Primer — Design System

## Purpose
A short, mobile-first software engineering learning game. The interface should make a production incident feel clear and consequential without turning healthcare into a frightening visual theme. The player makes one decision at a time, sees its technical effect, and reaches one of two endings.

## Design principles
- **Readable under pressure:** short sentences, one clear question per decision, a visible step count, and generous spacing.
- **Calm and credible:** use a light neutral canvas, deep navy text, and restrained mint/coral accents. Avoid hospital clichés, alarm-red screens, gradients, glass effects, and decorative dashboards.
- **Consequences are explicit:** explain the operational result after each choice; reserve red for a privacy incident, not ordinary emphasis.
- **Accessible:** high contrast, visible focus, semantic labels, and touch targets at least 44 × 44 CSS px. Do not rely on color alone to signal a choice or outcome.

## Screen inventory
Deliver exactly three primary mobile screens in Stitch: `Giriş`, `Sahne`, and `Son`. The scene screen is a reusable state: change the progress and decision copy for decisions 1–3 without creating separate screen layouts. The ending screen is also reusable for both ending variants.

### 1. Giriş
- Brand label: `SE PRIMER`.
- Heading: `Vardiyaya hazır mısın?`
- Supporting copy: `Bir yazılım mühendisi olarak karar ver. Sonuçlarını gör.`
- Intro selects, in order:
  - `Deneyim seviyen` — `Yeni başlıyorum` / `Deneyimliyim`.
  - `Rolün` — `Geliştirici` / `Test mühendisi` / `Ürün ekibi`.
  - `Bugün ne öğrenmek istiyorsun?` — `Mimari` / `Test` / `Veri güvenliği`.
- Primary action: `Nöbeti başlat`.
- Selected values must be visible, but the form should not feel like a settings page. Choices may be compact segmented controls or native-looking selectors.

### 2. Sahne
- Top row: `SE PRIMER`, progress `Karar 1 / 3`; show a small timer only for experienced mode.
- Scene heading: `08:00 · Randevu sistemi yanıt vermiyor`.
- Context: `Dün gece yeni sürüm çıktı. 300 hasta bekliyor.`
- Decision label and question: `KARAR 1 · MİMARİ` / `Önce ne yaparsın?`
- Two selectable answer rows:
  - `Eski sürüme geri dön` — `Önceki sürümü yeniden devreye al.`
  - `Canlıda yama yap` — `Mevcut sürüm üzerinde düzeltme yayınla.`
- Hint action for beginners: `Bir ipucu al`. Tutor action: `Tutor'a sor`.
- Show one decision at a time. Reuse this layout with exact copy below for the other two decisions:
  - `Karar 2 · Test`: `Önce kısa bir smoke test çalıştır` / `Test etmeden hemen yayına al`.
  - `Karar 3 · KVKK`: `Logdaki adı maskele` / `Ham logu ekiple paylaş`.
- After a choice, replace the choice area with a concise feedback state before advancing. Keep the selected action and progress visible.

### 3. Son
- Primary sample shown in Stitch: safe ending.
- Safe ending heading: `08:25 · Sistem ayakta`.
- Safe ending summary: `Logu maskelediğin için kişisel veri korundu.`
- Show a short `Kararların` recap for the three decisions, plus `Yeniden başlat`.
- Annotate an alternate state on the same screen, not as a fourth screen:
  - Heading: `Sistem ayakta, veri açığa çıktı`.
  - Summary: `Ham logu paylaşman kişisel veriyi açığa çıkardı. Bu bir KVKK ihlalidir.`
  - Use a restrained coral warning icon and explicit text; preserve readable contrast and the same layout.

## Visual system
- **Viewport target:** 390 × 844 px; support 320 px width without horizontal scrolling.
- **Spacing:** 8 px base scale; 16–24 px between content groups; 24 px screen gutters.
- **Type:** system sans-serif such as Inter or Google Sans. Screen heading 28–32 px, body 16–18 px, labels 12–14 px. Avoid all-caps body copy.
- **Color tokens:**
  - `canvas`: `#F7F8F5`
  - `surface`: `#FFFFFF`
  - `ink`: `#18242E`
  - `muted`: `#586873`
  - `border`: `#D8E0DC`
  - `primary`: `#146B5A`
  - `primary-soft`: `#E7F3EF`
  - `warning`: `#A33F35`
  - `warning-soft`: `#FBEDEA`
- **Shape:** 12–16 px corner radius for controls and content surfaces; thin borders instead of heavy shadows.
- **Icons:** simple line icons only when they clarify meaning; no decorative medical imagery or generated people.

## Interaction and responsive behavior
- One decision is active at a time; a selection cannot be changed after the next step opens.
- Beginner mode displays one optional hint at each decision. Experienced mode starts a 60-second countdown per decision.
- When the timer ends, select the documented safe default and state that it was selected automatically.
- Tutor help uses a compact inline disclosure or bottom sheet and must not reveal the correct answer.
- Keep primary actions reachable on a phone; do not place required choices in hover-only interactions.
- Respect reduced motion. Provide a visible focus ring and keyboard operation for every control.

## Content and privacy
- Use fictional scenario details only. Never show real patient names, records, or identifiers.
- For the log example, display an obviously synthetic token such as `hasta_***` when masked and `hasta_042` only as a clearly fictional demonstration.
- Use Turkish UI copy. Keep `KVKK` in the decision label and explain the consequence in plain Turkish.

## Handoff checklist
- Three primary designs exist: entry, scene, ending.
- Screen widths are phone-sized and text fits at 320 px.
- Scene states cover all three decisions; ending state covers both outcomes.
- Primary and alternate endings remain understandable without color.
- Stitch share link and screenshots are added to the repository README after creation.
