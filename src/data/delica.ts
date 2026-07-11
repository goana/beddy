// Miyuki Delica 11/0 — paleta curada de colores reales.
// code = referencia oficial Miyuki (DB-XXX), name = nombre comercial,
// hex = aproximación del color de la cuenta para pintar en pantalla.
// Es un subconjunto representativo (~120 colores) que cubre bien el espectro;
// puedes ampliarlo añadiendo entradas a este array.

export interface DelicaColor {
  code: string // p.ej. "DB-010"
  name: string
  hex: string
}

export const DELICA_COLORS: DelicaColor[] = [
  // --- Blancos / cremas / beiges ---
  { code: 'DB-200', name: 'White Pearl', hex: '#f7f5ee' },
  { code: 'DB-201', name: 'White Ceylon', hex: '#f4efe3' },
  { code: 'DB-1490', name: 'Opaque Bisque White', hex: '#efe9db' },
  { code: 'DB-1510', name: 'Opaque Bone White', hex: '#e9e2cf' },
  { code: 'DB-353', name: 'Matte Cream', hex: '#efe6cf' },
  { code: 'DB-621', name: 'Silver Lined Cream', hex: '#f0e4c2' },
  { code: 'DB-1131', name: 'Opaque Beige', hex: '#d9c39d' },
  { code: 'DB-388', name: 'Matte Op Sand Dune', hex: '#cdb488' },
  { code: 'DB-763', name: 'Matte Op Beige', hex: '#c9b48f' },
  { code: 'DB-1461', name: 'Silver Lined Pale Cream', hex: '#f5eccf' },

  // --- Amarillos / dorados ---
  { code: 'DB-721', name: 'Opaque Yellow', hex: '#f5c400' },
  { code: 'DB-751', name: 'Matte Opaque Yellow', hex: '#e8be16' },
  { code: 'DB-1132', name: 'Op Canary Yellow', hex: '#f4cf1f' },
  { code: 'DB-233', name: 'Lined Crystal Yellow', hex: '#f2df6a' },
  { code: 'DB-160', name: 'Op Yellow AB', hex: '#f6cd2c' },
  { code: 'DB-651', name: 'Dyed Op Squash', hex: '#e9a721' },
  { code: 'DB-1102', name: 'Op Golden Yellow', hex: '#f0b217' },
  { code: 'DB-31', name: '24kt Gold Plated', hex: '#d4af37' },
  { code: 'DB-410', name: 'Galv Gold', hex: '#c9a233' },
  { code: 'DB-1832', name: 'Duracoat Galv Gold', hex: '#c79a2b' },

  // --- Naranjas ---
  { code: 'DB-722', name: 'Opaque Orange', hex: '#e8621a' },
  { code: 'DB-752', name: 'Matte Op Orange', hex: '#d9591b' },
  { code: 'DB-1133', name: 'Op Tangerine', hex: '#ef7420' },
  { code: 'DB-703', name: 'Transp Orange', hex: '#e86a2a' },
  { code: 'DB-682', name: 'Dyed SL Squash', hex: '#e78a2f' },
  { code: 'DB-855', name: 'Matte Tr Orange AB', hex: '#e2712b' },

  // --- Rojos / corales ---
  { code: 'DB-723', name: 'Opaque Red', hex: '#c8262c' },
  { code: 'DB-753', name: 'Matte Op Red', hex: '#b52a2c' },
  { code: 'DB-727', name: 'Op Cranberry', hex: '#9e2836' },
  { code: 'DB-791', name: 'Dyed Op Dk Cranberry', hex: '#8f2333' },
  { code: 'DB-602', name: 'SL Red', hex: '#c21f3a' },
  { code: 'DB-874', name: 'Matte Tr Ruby AB', hex: '#a51f34' },
  { code: 'DB-2117', name: 'Duracoat Op Coral', hex: '#e05a50' },
  { code: 'DB-1363', name: 'Dyed Op Salmon', hex: '#e08476' },

  // --- Rosas / fucsias ---
  { code: 'DB-1371', name: 'Dyed Op Pink', hex: '#e59bb4' },
  { code: 'DB-207', name: 'Ceylon Pink', hex: '#eabfc6' },
  { code: 'DB-1345', name: 'Dyed SL Pink', hex: '#e56d97' },
  { code: 'DB-1310', name: 'Dyed Tr Rose', hex: '#d05283' },
  { code: 'DB-1840', name: 'Duracoat Galv Hot Pink', hex: '#d6297e' },
  { code: 'DB-1379', name: 'Dyed Op Dk Rose', hex: '#c74b7c' },
  { code: 'DB-874b', name: 'Matte Tr Magenta', hex: '#a83271' },
  { code: 'DB-1361', name: 'Dyed Op Fuchsia', hex: '#b62b6b' },

  // --- Morados / lilas ---
  { code: 'DB-661', name: 'Dyed Op Purple', hex: '#6a3b8f' },
  { code: 'DB-1364', name: 'Dyed Op Lavender', hex: '#a790c4' },
  { code: 'DB-249', name: 'Ceylon Lilac', hex: '#c3b0d1' },
  { code: 'DB-1345p', name: 'Dyed SL Violet', hex: '#7a53a3' },
  { code: 'DB-783', name: 'Dyed Matte Tr Purple', hex: '#5e3a86' },
  { code: 'DB-1315', name: 'Dyed Tr Amethyst', hex: '#7d5aa0' },
  { code: 'DB-134', name: 'Op Grape Luster', hex: '#54346f' },

  // --- Azules ---
  { code: 'DB-726', name: 'Opaque Blue', hex: '#1f4e9c' },
  { code: 'DB-756', name: 'Matte Op Blue', hex: '#22467f' },
  { code: 'DB-165', name: 'Op Turquoise Blue AB', hex: '#178faf' },
  { code: 'DB-2135', name: 'Duracoat Op Delph Blue', hex: '#2c5aa8' },
  { code: 'DB-361', name: 'Matte Op Cobalt', hex: '#1c3a86' },
  { code: 'DB-216', name: 'Op Capri Blue', hex: '#2a6ba8' },
  { code: 'DB-730', name: 'Op Cobalt', hex: '#173a86' },
  { code: 'DB-864', name: 'Matte Tr Capri Blue AB', hex: '#2e78a6' },
  { code: 'DB-243', name: 'Lt Sky Blue Ceylon', hex: '#a9cfe0' },
  { code: 'DB-628', name: 'SL Dusk Blue', hex: '#4a86b8' },
  { code: 'DB-2131', name: 'Duracoat Op Blue Sky', hex: '#6fb3d6' },
  { code: 'DB-79', name: 'Lined Aqua Luster', hex: '#4fb0c4' },

  // --- Turquesas / verdeazulados ---
  { code: 'DB-729', name: 'Op Turquoise Green', hex: '#0f9d8f' },
  { code: 'DB-759', name: 'Matte Op Turquoise Green', hex: '#159286' },
  { code: 'DB-2106', name: 'Duracoat Op Underwater Blue', hex: '#0e8fa0' },
  { code: 'DB-2128', name: 'Duracoat Op Sea Opal', hex: '#7ec5bd' },
  { code: 'DB-1567', name: 'Op Sea Foam Luster', hex: '#8fc9bf' },

  // --- Verdes ---
  { code: 'DB-724', name: 'Opaque Green', hex: '#1f7a3d' },
  { code: 'DB-754', name: 'Matte Op Green', hex: '#237040' },
  { code: 'DB-663', name: 'Dyed Op Kelly Green', hex: '#2a8f4f' },
  { code: 'DB-655', name: 'Dyed Op Green', hex: '#3aa35a' },
  { code: 'DB-274', name: 'Lined Green AB', hex: '#4faa5f' },
  { code: 'DB-1156', name: 'Op Lima Green', hex: '#8bbf52' },
  { code: 'DB-733', name: 'Op Dk Green', hex: '#1c5a34' },
  { code: 'DB-877', name: 'Matte Tr Olive AB', hex: '#6f7530' },
  { code: 'DB-1155', name: 'Op Pistachio', hex: '#a8c37a' },
  { code: 'DB-237', name: 'Ceylon Celery', hex: '#cbd6a4' },

  // --- Marrones / tierras ---
  { code: 'DB-734', name: 'Op Chocolate Brown', hex: '#5a3a26' },
  { code: 'DB-764', name: 'Matte Op Brown', hex: '#52362a' },
  { code: 'DB-1584', name: 'Op Cinnamon Luster', hex: '#7a4a30' },
  { code: 'DB-2141', name: 'Duracoat Op Cognac', hex: '#8a5a34' },
  { code: 'DB-2106b', name: 'Op Terracotta', hex: '#a15a3e' },
  { code: 'DB-769', name: 'Matte Op Taupe', hex: '#8a7460' },
  { code: 'DB-388b', name: 'Op Toast', hex: '#a98a63' },

  // --- Grises / plata ---
  { code: 'DB-731', name: 'Op Grey', hex: '#8c8c8c' },
  { code: 'DB-761', name: 'Matte Op Grey', hex: '#7f7f7f' },
  { code: 'DB-252', name: 'Op Grey Pearl', hex: '#b9b7b0' },
  { code: 'DB-336', name: 'Matte Op Slate', hex: '#5b6068' },
  { code: 'DB-1179', name: 'Galv Semi-Matte Silver', hex: '#c0c2c4' },
  { code: 'DB-38', name: 'Palladium Plated', hex: '#b6b8bb' },
  { code: 'DB-1174', name: 'Galv Semi-Frost Graphite', hex: '#5c5e63' },

  // --- Negros ---
  { code: 'DB-10', name: 'Black', hex: '#1a1a1a' },
  { code: 'DB-310', name: 'Matte Black', hex: '#222222' },
  { code: 'DB-001', name: 'Metallic Gunmetal', hex: '#2b2d30' },
  { code: 'DB-002', name: 'Metallic Dk Blue Iris', hex: '#2a3040' },
]
