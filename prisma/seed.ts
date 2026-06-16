import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Default admin user
  await prisma.user.upsert({
    where: { phone: "11999999999" },
    update: {},
    create: { phone: "11999999999", name: "Admin", role: "admin", balance: 99999 },
  });

  // Default packs
  const packs = [
    { id:"bronze",    name:"Pacote Bronze",   badge:"BRONZE",   icon:"⚽", cards:3, price:50,  wCommon:80, wRare:16, wEpic:3,  wLegendary:1,  cssClass:"t-bronze"   },
    { id:"silver",    name:"Pacote Prata",    badge:"PRATA",    icon:"🌟", cards:5, price:150, wCommon:55, wRare:32, wEpic:10, wLegendary:3,  cssClass:"t-silver"   },
    { id:"gold",      name:"Pacote Ouro",     badge:"OURO",     icon:"🏅", cards:5, price:350, wCommon:20, wRare:40, wEpic:28, wLegendary:12, cssClass:"t-gold"     },
    { id:"legendary", name:"Pacote Lendário", badge:"LENDÁRIO", icon:"🏆", cards:5, price:700, wCommon:0,  wRare:20, wEpic:45, wLegendary:35, cssClass:"t-legendary"},
  ];

  for (const p of packs) {
    await prisma.pack.upsert({ where:{ id: p.id }, update: p, create: p });
  }

  // Default cards
  const cards = [
    { name:"Vinicius Jr",        country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:91, rarity:"legendary", value:1200 },
    { name:"Kylian Mbappé",      country:"França",     flag:"🇫🇷", position:"ATA", rating:93, rarity:"legendary", value:1500 },
    { name:"Erling Haaland",     country:"Noruega",    flag:"🇳🇴", position:"ATA", rating:93, rarity:"legendary", value:1400 },
    { name:"Lamine Yamal",       country:"Espanha",    flag:"🇪🇸", position:"ATA", rating:90, rarity:"legendary", value:1100 },
    { name:"Jude Bellingham",    country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"MEI", rating:91, rarity:"legendary", value:1250 },
    { name:"Lionel Messi",       country:"Argentina",  flag:"🇦🇷", position:"ATA", rating:92, rarity:"legendary", value:2000 },
    { name:"Florian Wirtz",      country:"Alemanha",   flag:"🇩🇪", position:"MEI", rating:90, rarity:"legendary", value:1050 },
    { name:"Pedri",              country:"Espanha",    flag:"🇪🇸", position:"MEI", rating:90, rarity:"legendary", value:1000 },
    { name:"R. Lewandowski",     country:"Polônia",    flag:"🇵🇱", position:"ATA", rating:89, rarity:"legendary", value:950  },
    { name:"Cristiano Ronaldo",  country:"Portugal",   flag:"🇵🇹", position:"ATA", rating:87, rarity:"legendary", value:880  },
    { name:"Rodrygo",            country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:87, rarity:"epic",      value:355  },
    { name:"Richarlison",        country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:85, rarity:"epic",      value:265  },
    { name:"Raphinha",           country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:86, rarity:"epic",      value:310  },
    { name:"Bruno Fernandes",    country:"Portugal",   flag:"🇵🇹", position:"MEI", rating:86, rarity:"epic",      value:315  },
    { name:"Rafael Leão",        country:"Portugal",   flag:"🇵🇹", position:"ATA", rating:87, rarity:"epic",      value:360  },
    { name:"Harry Kane",         country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"ATA", rating:88, rarity:"epic",      value:395  },
    { name:"Phil Foden",         country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"MEI", rating:88, rarity:"epic",      value:385  },
    { name:"Bukayo Saka",        country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"ATA", rating:87, rarity:"epic",      value:360  },
    { name:"Julián Álvarez",     country:"Argentina",  flag:"🇦🇷", position:"ATA", rating:86, rarity:"epic",      value:315  },
    { name:"Lautaro Martínez",   country:"Argentina",  flag:"🇦🇷", position:"ATA", rating:87, rarity:"epic",      value:355  },
    { name:"Jamal Musiala",      country:"Alemanha",   flag:"🇩🇪", position:"MEI", rating:88, rarity:"epic",      value:395  },
    { name:"Achraf Hakimi",      country:"Marrocos",   flag:"🇲🇦", position:"LAT", rating:86, rarity:"epic",      value:310  },
    { name:"Endrick",            country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:83, rarity:"epic",      value:260  },
    { name:"Casemiro",           country:"Brasil",     flag:"🇧🇷", position:"VOL", rating:83, rarity:"rare",      value:115  },
    { name:"Marquinhos",         country:"Brasil",     flag:"🇧🇷", position:"ZAG", rating:84, rarity:"rare",      value:130  },
    { name:"Rodrigo De Paul",    country:"Argentina",  flag:"🇦🇷", position:"VOL", rating:83, rarity:"rare",      value:112  },
    { name:"Theo Hernandez",     country:"França",     flag:"🇫🇷", position:"LAT", rating:83, rarity:"rare",      value:112  },
    { name:"Virgil van Dijk",    country:"Holanda",    flag:"🇳🇱", position:"ZAG", rating:85, rarity:"rare",      value:142  },
    { name:"Christian Pulisic",  country:"EUA",        flag:"🇺🇸", position:"ATA", rating:82, rarity:"rare",      value:102  },
    { name:"Gavi",               country:"Espanha",    flag:"🇪🇸", position:"VOL", rating:84, rarity:"rare",      value:128  },
    { name:"Fede Valverde",      country:"Uruguai",    flag:"🇺🇾", position:"MEI", rating:85, rarity:"rare",      value:145  },
    { name:"Darwin Núñez",       country:"Uruguai",    flag:"🇺🇾", position:"ATA", rating:83, rarity:"rare",      value:112  },
    { name:"Alisson Becker",     country:"Brasil",     flag:"🇧🇷", position:"GOL", rating:78, rarity:"common",    value:32   },
    { name:"Gabriel Magalhães",  country:"Brasil",     flag:"🇧🇷", position:"ZAG", rating:79, rarity:"common",    value:36   },
    { name:"G. Martinelli",      country:"Brasil",     flag:"🇧🇷", position:"ATA", rating:77, rarity:"common",    value:24   },
    { name:"Kai Havertz",        country:"Alemanha",   flag:"🇩🇪", position:"MEI", rating:80, rarity:"common",    value:40   },
    { name:"Ferran Torres",      country:"Espanha",    flag:"🇪🇸", position:"ATA", rating:78, rarity:"common",    value:28   },
    { name:"Diogo Jota",         country:"Portugal",   flag:"🇵🇹", position:"ATA", rating:79, rarity:"common",    value:32   },
    { name:"Marcus Rashford",    country:"Inglaterra", flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", position:"ATA", rating:79, rarity:"common",    value:32   },
    { name:"Sofyan Amrabat",     country:"Marrocos",   flag:"🇲🇦", position:"VOL", rating:76, rarity:"common",    value:22   },
  ];

  for (const c of cards) {
    const existing = await prisma.card.findFirst({ where: { name: c.name } });
    if (!existing) await prisma.card.create({ data: c });
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
    { key: "veopag_base_url",    value: "https://api.veopag.com.br" },
  ];

  for (const c of configs) {
    await prisma.siteConfig.upsert({ where:{ key: c.key }, update:{}, create: c });
  }

  console.log("✅ Seed concluído");
}

main().catch(console.error).finally(() => prisma.$disconnect());
