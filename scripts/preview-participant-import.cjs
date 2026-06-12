/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const participants = [
  { name: 'Hector Huertas', groups: [['MEXICO','REP. CHECA','SUDAFRICA'],['CANADA','SUIZA','BOSNIA HERZEG.'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','AUSTRALIA','PARAGUAY'],['ALEMANIA','ECUADOR'],['PAISES BAJOS','SUECIA','TUNEZ'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','ARGELIA','JORDANIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','PANAMA']] },
  { name: 'Jackeline Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA','BOSNIA HERZEG.'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['COSTA de MARFIL','ALEMANIA','ECUADOR'],['SUECIA','JAPON','PAISES BAJOS'],['BELGICA','NUEVA ZELANDIA'],['ESPAÑA','ARABIA SAUDITA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA']] },
  { name: 'ISABELLA HERNÁNDEZ HUERTAS', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','ARGELIA'],['PORTUGAL','COLOMBIA','UZBEKISTAN'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'JOHN ALBERTO HERNÁNDEZ LADINO', groups: [['MEXICO','REP. CHECA','COREA DEL SUR'],['CANADA','SUIZA','BOSNIA HERZEG.'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Simón Hernández', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA','BOSNIA HERZEG.'],['BRASIL','MARRUECOS'],['ESTADOS UNIDOS','TURQUIA','PARAGUAY'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRALIA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Wilmer Huertas', groups: [['COREA DEL SUR','REP. CHECA','MEXICO'],['CANADA','SUIZA','CATAR'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','AUSTRALIA'],['ALEMANIA','ECUADOR'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY','ARABIA SAUDITA'],['FRANCIA','NORUEGA'],['ARGENTINA','ARGELIA','AUSTRALIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Jesus Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','BOSNIA HERZEG.','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRALIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Oscar Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','BOSNIA HERZEG.','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','TURQUIA','PARAGUAY'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','SUECIA','JAPON'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','AUSTRALIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Zenón Huertas', groups: [['MEXICO','COREA DEL SUR'],['CANADA','CATAR','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY'],['ECUADOR','ALEMANIA','COSTA de MARFIL'],['JAPON','PAISES BAJOS','SUECIA'],['NUEVA ZELANDIA','BELGICA','EGIPTO'],['ESPAÑA','URUGUAY','ARABIA SAUDITA'],['FRANCIA','NORUEGA','IRAK'],['ARGENTINA','AUSTRALIA','ARGELIA'],['COLOMBIA','PORTUGAL'],['INGLATERRA','CROASIA']] },
  { name: 'Diego Fernando huertas Suárez', groups: [['MEXICO','COREA DEL SUR','SUDAFRICA'],['CANADA','SUIZA'],['BRASIL','MARRUECOS'],['PARAGUAY','AUSTRALIA','ESTADOS UNIDOS'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['JAPON','PAISES BAJOS','SUECIA'],['BELGICA','EGIPTO','IRAN'],['ESPAÑA','URUGUAY','ARABIA SAUDITA'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRALIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'AndresHuertas', groups: [['MEXICO','COREA DEL SUR','SUDAFRICA'],['CANADA','CATAR','SUIZA'],['BRASIL','ESCOSIA','MARRUECOS'],['TURQUIA','ESTADOS UNIDOS','AUSTRALIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','NUEVA ZELANDIA','IRAN'],['ESPAÑA','ARABIA SAUDITA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRALIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Daniel Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA'],['BRASIL','MARRUECOS'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Iván Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','TURQUIA','AUSTRALIA'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRALIA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Vanessa Ramirez', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','BOSNIA HERZEG.','SUIZA'],['BRASIL','MARRUECOS'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRIA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Daniel Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA','BOSNIA HERZEG.'],['BRASIL','MARRUECOS'],['ESTADOS UNIDOS','PARAGUAY','TURQUIA'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['PAISES BAJOS','SUECIA','JAPON'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','ARGELIA','AUSTRIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Silvino Huertas', groups: [['MEXICO','COREA DEL SUR','SUDAFRICA'],['CANADA','BOSNIA HERZEG.','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','TURQUIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','TUNEZ'],['BELGICA','NUEVA ZELANDIA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','PANAMA']] },
  { name: 'Edisson Huertas', groups: [['REP. CHECA','MEXICO','COREA DEL SUR'],['SUIZA','BOSNIA HERZEG.'],['BRASIL','MARRUECOS','ESCOSIA'],['TURQUIA','AUSTRALIA','PARAGUAY'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','SUECIA','JAPON'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','AUSTRIA'],['PORTUGAL','COLOMBIA','UZBEKISTAN'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Estefanía Triana', groups: [['COREA DEL SUR','REP. CHECA','MEXICO'],['CANADA','CATAR','BOSNIA HERZEG.'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','AUSTRALIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','TUNEZ'],['BELGICA','EGIPTO','NUEVA ZELANDIA'],['ESPAÑA','ARABIA SAUDITA','URUGUAY'],['FRANCIA','SENEGAL'],['ARGENTINA','AUSTRIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA']] },
  { name: 'Nubia Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['CANADA','SUIZA','CATAR'],['BRASIL','MARRUECOS','HAITI'],['ESTADOS UNIDOS','PARAGUAY','AUSTRALIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','TUNEZ'],['BELGICA','EGIPTO','IRAN'],['ESPAÑA','ARABIA SAUDITA','URUGUAY'],['FRANCIA','SENEGAL'],['ARGENTINA','AUSTRIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA']] },
  { name: 'Fabian Triana', groups: [['MEXICO','REP. CHECA','COREA DEL SUR'],['CANADA','BOSNIA HERZEG.','SUIZA'],['BRASIL','MARRUECOS','ESCOSIA'],['ESTADOS UNIDOS','PARAGUAY','AUSTRALIA'],['ALEMANIA','COSTA de MARFIL','ECUADOR'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO'],['ESPAÑA','URUGUAY'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
  { name: 'Lina huertas', groups: [['MEXICO','COREA DEL SUR','SUDAFRICA'],['SUIZA','CANADA'],['MARRUECOS','BRASIL','ESCOSIA'],['TURQUIA','ESTADOS UNIDOS','AUSTRALIA'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['JAPON','PAISES BAJOS','SUECIA'],['BELGICA','EGIPTO','IRAN'],['ESPAÑA','URUGUAY','ARABIA SAUDITA'],['FRANCIA','SENEGAL','NORUEGA'],['ARGENTINA','AUSTRIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA']] },
  { name: 'David Huertas', groups: [['MEXICO','COREA DEL SUR','REP. CHECA'],['SUIZA','CANADA'],['BRASIL','MARRUECOS'],['ESTADOS UNIDOS','TURQUIA','PARAGUAY'],['ALEMANIA','ECUADOR','COSTA de MARFIL'],['PAISES BAJOS','JAPON','SUECIA'],['BELGICA','EGIPTO','IRAN'],['ESPAÑA','URUGUAY'],['FRANCIA','NORUEGA','SENEGAL'],['ARGENTINA','AUSTRIA','ARGELIA'],['PORTUGAL','COLOMBIA'],['INGLATERRA','CROASIA','GHANA']] },
];

const aliases = new Map(Object.entries({
  'MEXICO': 'Mexico','REP. CHECA': 'Czech Republic','SUDAFRICA': 'South Africa','COREA DEL SUR': 'South Korea',
  'CANADA': 'Canada','SUIZA': 'Switzerland','BOSNIA HERZEG.': 'Bosnia and Herzegovina','CATAR': 'Qatar',
  'BRASIL': 'Brazil','MARRUECOS': 'Morocco','ESCOSIA': 'Scotland','HAITI': 'Haiti',
  'ESTADOS UNIDOS': 'United States','AUSTRALIA': 'Australia','PARAGUAY': 'Paraguay','TURQUIA': 'Turkey',
  'ALEMANIA': 'Germany','ECUADOR': 'Ecuador','COSTA DE MARFIL': 'Ivory Coast','COSTA de MARFIL': 'Ivory Coast',
  'PAISES BAJOS': 'Netherlands','SUECIA': 'Sweden','TUNEZ': 'Tunisia','JAPON': 'Japan',
  'BELGICA': 'Belgium','EGIPTO': 'Egypt','NUEVA ZELANDIA': 'New Zealand','IRAN': 'Iran',
  'ESPAÑA': 'Spain','URUGUAY': 'Uruguay','ARABIA SAUDITA': 'Saudi Arabia',
  'FRANCIA': 'France','NORUEGA': 'Norway','SENEGAL': 'Senegal','IRAK': 'Iraq',
  'ARGENTINA': 'Argentina','ARGELIA': 'Algeria','JORDANIA': 'Jordan','AUSTRIA': 'Austria',
  'PORTUGAL': 'Portugal','COLOMBIA': 'Colombia','UZBEKISTAN': 'Uzbekistan',
  'INGLATERRA': 'England','CROASIA': 'Croatia','PANAMA': 'Panama','GHANA': 'Ghana',
}));

function norm(s){return s.replace(/\u00a0/g,' ').trim();}
function password(name){return name.toLocaleLowerCase('es');}

async function main(){
  const teams = await prisma.team.findMany();
  const byName = new Map(teams.map(t => [t.name, t]));
  const nameCounts = new Map();
  let out = '# Preview import participantes\n\n';
  out += 'Suposición usada: en cada grupo, los primeros 2 equipos son TOP_TWO y el 3º, si existe, es BEST_THIRD. Password = nombre en minúsculas.\n\n';
  out += '| # | Participante | Password | Top 2 | Mejores terceros | Alertas |\n|---:|---|---|---:|---:|---|\n';
  participants.forEach((p,i)=>{
    nameCounts.set(p.name,(nameCounts.get(p.name)||0)+1);
    const top=[]; const third=[]; const alerts=[]; const seen=new Set();
    for(const g of p.groups){
      g.forEach((raw,idx)=>{
        const canonical=aliases.get(norm(raw).toUpperCase()) || aliases.get(norm(raw)) || norm(raw);
        const team=byName.get(canonical);
        if(!team) alerts.push(`No encontrado: ${raw}`);
        if(seen.has(canonical)) alerts.push(`Duplicado equipo: ${canonical}`);
        seen.add(canonical);
        if(idx<2) top.push(canonical); else third.push(canonical);
      });
    }
    if(top.length!==24) alerts.push(`TOP_TWO=${top.length}, esperado 24`);
    if(third.length!==8) alerts.push(`BEST_THIRD=${third.length}, esperado 8`);
    out += `| ${i+1} | ${p.name} | ${password(p.name)} | ${top.length} | ${third.length} | ${alerts.join('; ') || 'OK'} |\n`;
  });
  const dupNames=[...nameCounts].filter(([,c])=>c>1).map(([n,c])=>`${n} (${c})`);
  out += `\n## Duplicados de nombre\n${dupNames.length?dupNames.map(x=>`- ${x}`).join('\n'):'Ninguno'}\n`;
  out += '\n## Detalle por participante\n';
  participants.forEach((p)=>{
    const top=[]; const third=[];
    for(const g of p.groups){g.forEach((raw,idx)=>{const canonical=aliases.get(norm(raw).toUpperCase()) || aliases.get(norm(raw)) || norm(raw); if(idx<2) top.push(canonical); else third.push(canonical);});}
    out += `\n### ${p.name}\n- Password: \`${password(p.name)}\`\n- TOP_TWO (${top.length}): ${top.join(', ')}\n- BEST_THIRD (${third.length}): ${third.join(', ')}\n`;
  });
  console.log(out);
}
main().finally(()=>prisma.$disconnect());
