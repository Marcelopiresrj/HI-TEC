/**
 * Helper to generate and download a vCard (.vcf) file for Hi-Tech Eletrônicos
 */
export function downloadVCard(): void {
  const vcardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Hi-Tech Eletrônicos',
    'ORG:Hi-Tech Eletrônicos',
    'TITLE:Montagem e Manutenção de Celulares e Tablets, Venda de Games',
    'TEL;TYPE=CELL,VOICE,WHATSAPP:+5522998706841',
    'ADR;TYPE=WORK:;;Av. Jane Maria Martins Figueira, 12;Rio das Ostras;RJ;28896-052;Brasil',
    'LABEL;TYPE=WORK:Av. Jane Maria Martins Figueira, 12 - Jardim Marileia, Rio das Ostras - RJ, 28896-052',
    'URL:https://www.instagram.com/hitecheletronicos/',
    'NOTE:Hi-Tech Eletrônicos - Montagem e Manutenção de Celulares e Tablets, Venda de Games e Acessórios. Tel: (22) 99870-6841. Endereço: Av. Jane Maria Martins Figueira, 12 - Jardim Marileia, Rio das Ostras - RJ. Horário: Seg a Sex 09:00-18:30 | Sáb 09:00-14:30.',
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Hi-Tech-Eletronicos.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
