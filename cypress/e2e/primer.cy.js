const paths = [
  { name: "A-A-A güvenli", first: 0, second: 0, third: 0, ending: "08:25 · Sistem ayakta" },
  { name: "A-A-B veri riski", first: 0, second: 0, third: 1, ending: "Sistem ayakta, veri açığa çıktı" },
  { name: "A-B-A güvenli", first: 0, second: 1, third: 0, ending: "08:25 · Sistem ayakta" },
  { name: "A-B-B veri riski", first: 0, second: 1, third: 1, ending: "Sistem ayakta, veri açığa çıktı" },
  { name: "B-A-A güvenli", first: 1, second: 0, third: 0, ending: "08:25 · Sistem ayakta" },
  { name: "B-A-B veri riski", first: 1, second: 0, third: 1, ending: "Sistem ayakta, veri açığa çıktı" },
  { name: "B-B-A güvenli", first: 1, second: 1, third: 0, ending: "08:25 · Sistem ayakta" },
  { name: "B-B-B veri riski", first: 1, second: 1, third: 1, ending: "Sistem ayakta, veri açığa çıktı" },
];

function choose(index) {
  cy.get(`[data-cy="decision-option-${index}"]`).click();
  cy.get('[data-cy="decision-feedback"]').should("be.visible");
  cy.get('[data-cy="next-step"]').click();
}

function start() {
  cy.visit("/");
  cy.get('[data-cy="entry-screen"]').should("be.visible");
  cy.get('[data-cy="start-game"]').click();
}

describe("SE Primer karar yolları", () => {
  paths.forEach((path) => {
    it(`üç kararı tamamlar: ${path.name}`, () => {
      start();
      choose(path.first);
      choose(path.second);
      choose(path.third);
      cy.get('[data-cy="ending-screen"]').should("contain.text", path.ending);
      cy.get('[data-cy="ending-screen"] .recap-row').should("have.length", 3);
    });
  });

  it("başlangıç seviyesine ipucu gösterir ve tutor yanıtını ekranda sunar", () => {
    cy.intercept("POST", "/api/tutor", {
      statusCode: 200,
      body: { answer: "Geri almadan önce hangi şema değişikliğinin eski sürümle uyumsuz olabileceğini düşünüyorsun?", source: "test" },
    }).as("tutor");
    start();
    cy.get('[data-cy="hint-toggle"]').click();
    cy.get('[data-cy="hint"]').should("contain.text", "şema");
    cy.get('[data-cy="tutor-toggle"]').click();
    cy.get('[data-cy="tutor-input"]').type("Geri alma riskini merak ediyorum");
    cy.get('[data-cy="tutor-send"]').click();
    cy.wait("@tutor");
    cy.get('[data-cy="tutor-reply"]').should("contain.text", "hangi şema değişikliğinin");
    cy.get('[data-cy="tutor-reply"]').should("not.contain.text", "Doğru cevap");
  });

  it("çevrimdışı yedek tutor yanıtını etiketler", () => {
    cy.intercept("POST", "/api/tutor", {
      statusCode: 200,
      body: { answer: "Logu paylaşmadan önce kişiyi tanımlayabilecek alanları gözden geçir.", source: "offline-fallback" },
    }).as("offlineTutor");
    start();
    cy.get('[data-cy="tutor-toggle"]').click();
    cy.get('[data-cy="tutor-input"]').type("Logu nasıl güvenli paylaşabilirim?");
    cy.get('[data-cy="tutor-send"]').click();
    cy.wait("@offlineTutor");
    cy.get('[data-cy="tutor-reply"]').should("contain.text", "Çevrimdışı yedek ipucu");
    cy.get('[data-cy="tutor-reply"]').should("contain.text", "kişiyi tanımlayabilecek alanları");
  });

  it("deneyimli modda 60 saniye sonunda her kararda güvenli varsayılanı seçer", () => {
    cy.clock();
    cy.visit("/");
    cy.contains("Deneyimliyim").click();
    cy.get('[data-cy="start-game"]').click();
    for (let step = 0; step < 3; step += 1) {
      cy.tick(60000);
      cy.get('[data-cy="decision-feedback"]').should("contain.text", "Süre dolduğu için güvenli varsayılan seçildi");
      cy.get('[data-cy="next-step"]').click();
    }
    cy.get('[data-cy="ending-screen"]').should("contain.text", "08:25 · Sistem ayakta");
  });

  it("yeniden başlatınca başlangıç seçimlerine döner", () => {
    start();
    choose(0);
    choose(0);
    choose(0);
    cy.get('[data-cy="restart-game"]').click();
    cy.get('[data-cy="entry-screen"]').should("be.visible");
    cy.contains("Yeni başlıyorum").should("have.attr", "aria-pressed", "true");
  });
});
