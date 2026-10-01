export interface MailTemplateInput {
  bedrijfsnaam: string;
  aanhef: string;
  zoekterm: string;
  positie: string;
  ondertekening: string;
}

export function standaardOnderwerp(i: MailTemplateInput): string {
  return `Vindbaarheidsrapport ${i.bedrijfsnaam}`;
}

export function standaardTekst(i: MailTemplateInput): string {
  const aanhef = i.aanhef?.trim() ? `Beste ${i.aanhef.trim()},` : "Beste,";
  return `${aanhef}

Zoals besproken stuur ik u hierbij het vindbaarheidsrapport voor ${i.bedrijfsnaam}.

In het rapport ziet u waar u nu staat bij de zoekopdracht "${i.zoekterm}", wat de bedrijven in de top 3 anders doen en drie punten die u direct kunt oppakken.

Heeft u vragen of wilt u weten hoe we u naar de top 3 brengen? Reageer dan gerust op deze mail, dan plannen we een kort gesprek van 15 minuten in.

Met vriendelijke groet,

${i.ondertekening}
RK Results`;
}
