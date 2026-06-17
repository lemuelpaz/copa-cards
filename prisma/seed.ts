import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Default packs
  const packs = [
    { id:"bronze",    name:"Pacote Bronze",   badge:"BRONZE",   icon:"⚽", cards:3, price:50,  wCommon:80, wRare:16, wEpic:3,  wLegendary:1,  cssClass:"t-bronze"   },
    { id:"gold",      name:"Pacote Ouro",     badge:"OURO",     icon:"🏅", cards:5, price:350, wCommon:20, wRare:40, wEpic:28, wLegendary:12, cssClass:"t-gold"     },
    { id:"legendary", name:"Pacote Lendário", badge:"LENDÁRIO", icon:"🏆", cards:5, price:700, wCommon:0,  wRare:20, wEpic:45, wLegendary:35, cssClass:"t-legendary"},
  ];

  for (const p of packs) {
    await prisma.pack.upsert({ where:{ id: p.id }, update: p, create: p });
  }

  // Default cards
  const cards = [
    { name:"Vinicius Jr",        country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:91, rarity:"legendary", value:12.00 },
    { name:"Kylian Mbappé",      country:"França",     flag:"🇫🇷", position:"ATA", rating:93, rarity:"legendary", value:14.50 },
    { name:"Erling Haaland",     country:"Noruega",    flag:"🇳🇴", position:"ATA", rating:93, rarity:"legendary", value:14.00 },
    { name:"Lamine Yamal",       country:"Espanha",    flag:"🇪🇸", position:"ATA", rating:90, rarity:"legendary", value:11.00 },
    { name:"Jude Bellingham",    country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"MEI", rating:91, rarity:"legendary", value:12.50 },
    { name:"Lionel Messi",       country:"Argentina",  flag:"🇦🇷", position:"ATA", rating:92, rarity:"legendary", value:15.00 },
    { name:"Florian Wirtz",      country:"Alemanha",   flag:"🇩🇪", position:"MEI", rating:90, rarity:"legendary", value:10.00 },
    { name:"Pedri",              country:"Espanha",    flag:"🇪🇸", position:"MEI", rating:90, rarity:"legendary", value:9.50  },
    { name:"R. Lewandowski",     country:"Polônia",    flag:"🇵🇱", position:"ATA", rating:89, rarity:"legendary", value:8.00  },
    { name:"Cristiano Ronaldo",  country:"Portugal",   flag:"🇵🇹", position:"ATA", rating:87, rarity:"legendary", value:6.00  },
    { name:"Rodrygo",            country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:87, rarity:"epic",      value:0.83  },
    { name:"Richarlison",        country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:85, rarity:"epic",      value:0.68  },
    { name:"Raphinha",           country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:86, rarity:"epic",      value:0.75  },
    { name:"Bruno Fernandes",    country:"Portugal",   flag:"🇵🇹", position:"MEI", rating:86, rarity:"epic",      value:0.80  },
    { name:"Rafael Leão",        country:"Portugal",   flag:"🇵🇹", position:"ATA", rating:87, rarity:"epic",      value:0.90  },
    { name:"Harry Kane",         country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"ATA", rating:88, rarity:"epic",      value:1.00  },
    { name:"Phil Foden",         country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"MEI", rating:88, rarity:"epic",      value:0.98  },
    { name:"Bukayo Saka",        country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"ATA", rating:87, rarity:"epic",      value:0.85  },
    { name:"Julián Álvarez",     country:"Argentina",  flag:"🇦🇷", position:"ATA", rating:86, rarity:"epic",      value:0.78  },
    { name:"Lautaro Martínez",   country:"Argentina",  flag:"🇦🇷", position:"ATA", rating:87, rarity:"epic",      value:0.88  },
    { name:"Jamal Musiala",      country:"Alemanha",   flag:"🇩🇪", position:"MEI", rating:88, rarity:"epic",      value:0.95  },
    { name:"Achraf Hakimi",      country:"Marrocos",   flag:"🇲🇦", position:"LAT", rating:86, rarity:"epic",      value:0.72  },
    { name:"Endrick",            country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:83, rarity:"epic",      value:0.62  },
    { name:"Casemiro",           country:"Brasil",     flag:"🇧🇷", position:"VOL", rating:83, rarity:"rare",      value:0.38  },
    { name:"Marquinhos",         country:"Brasil",     flag:"🇧🇷", position:"ZAG", rating:84, rarity:"rare",      value:0.44  },
    { name:"Rodrigo De Paul",    country:"Argentina",  flag:"🇦🇷", position:"VOL", rating:83, rarity:"rare",      value:0.34  },
    { name:"Theo Hernandez",     country:"França",     flag:"🇫🇷", position:"LAT", rating:83, rarity:"rare",      value:0.32  },
    { name:"Virgil van Dijk",    country:"Holanda",    flag:"🇳🇱", position:"ZAG", rating:85, rarity:"rare",      value:0.48  },
    { name:"Christian Pulisic",  country:"EUA",        flag:"🇺🇸", position:"ATA", rating:82, rarity:"rare",      value:0.28  },
    { name:"Gavi",               country:"Espanha",    flag:"🇪🇸", position:"VOL", rating:84, rarity:"rare",      value:0.42  },
    { name:"Fede Valverde",      country:"Uruguai",    flag:"🇺🇾", position:"MEI", rating:85, rarity:"rare",      value:0.46  },
    { name:"Darwin Núñez",       country:"Uruguai",    flag:"🇺🇾", position:"ATA", rating:83, rarity:"rare",      value:0.36  },
    { name:"Alisson Becker",     country:"Brasil",     flag:"🇧🇷", position:"GOL", rating:78, rarity:"common",    value:0.20  },
    { name:"Gabriel Magalhães",  country:"Brasil",     flag:"🇧🇷", position:"ZAG", rating:79, rarity:"common",    value:0.28  },
    { name:"G. Martinelli",      country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:77, rarity:"common",    value:0.18  },
    { name:"Kai Havertz",        country:"Alemanha",   flag:"🇩🇪", position:"MEI", rating:80, rarity:"common",    value:0.30  },
    { name:"Ferran Torres",      country:"Espanha",    flag:"🇪🇸", position:"ATA", rating:78, rarity:"common",    value:0.22  },
    { name:"Diogo Jota",         country:"Portugal",   flag:"🇵🇹", position:"ATA", rating:79, rarity:"common",    value:0.26  },
    { name:"Marcus Rashford",    country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"ATA", rating:79, rarity:"common",    value:0.24  },
    { name:"Sofyan Amrabat",     country:"Marrocos",   flag:"🇲🇦", position:"VOL", rating:76, rarity:"common",    value:0.14  },
  ];

  for (const c of cards) {
    const existing = await prisma.card.findFirst({ where: { name: c.name } });
    if (existing) {
      await prisma.card.update({ where: { id: existing.id }, data: { value: c.value } });
    } else {
      await prisma.card.create({ data: c });
    }
  }

  // Default site config
  const configs = [
    { key: "banner_title",       value: "COPA 2026" },
    { key: "banner_subtitle",    value: "Colecione os Craques do Mundo" },
    { key: "banner_eyebrow",     value: "iGaming • Edição Especial • 2026" },
    { key: "win_rate",           value: "50" },
    { key: "initial_balance",    value: "1000" },
    { key: "min_deposit",         value: "10" },
    { key: "min_withdrawal",     value: "50" },
    { key: "site_name",          value: "Copa 2026 iGaming" },
    { key: "maintenance_mode",   value: "false" },
    { key: "veopag_client_id",   value: "" },
    { key: "veopag_client_secret", value: "" },
    { key: "veopag_webhook_secret", value: "" },
    { key: "veopag_environment", value: "sandbox" },
    { key: "veopag_base_url",    value: "https://api.veopag.com" },
  ];

  for (const c of configs) {
    await prisma.siteConfig.upsert({ where:{ key: c.key }, update:{}, create: c });
  }

  console.log("✅ Seed concluído");
}

main().catch(console.error).finally(() => prisma.$disconnect());
