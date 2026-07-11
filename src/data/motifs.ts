import type { Stitch } from '../lib/pattern'

// Un motivo se dibuja con una rejilla de caracteres y una leyenda char -> código Delica.
// El carácter '.' es el fondo (usa el código `background`, o vacío si es null).

export interface Motif {
  id: string
  name: string
  keywords: string[]
  stitch: Stitch
  legend: Record<string, string> // char -> código Delica
  background: string | null // código Delica del fondo, o null = sin cuenta
  rows: string[] // rejilla completa, todas las filas del mismo ancho
}

/** Refleja la mitad izquierda (incluida la columna central) para formar la fila completa. */
function mir(half: string): string {
  const body = half.slice(0, -1)
  return half + body.split('').reverse().join('')
}

/** Normaliza a igual ancho (repitiendo la última columna) y refleja en espejo. */
function symmetric(halfRows: string[]): string[] {
  const w = Math.max(...halfRows.map((r) => r.length))
  return halfRows.map((r) => {
    let row = r
    while (row.length < w) row += row[row.length - 1]
    return mir(row.slice(0, w))
  })
}

// --- GATO SIAMÉS (media cara, se refleja a 25 de ancho) --------------------
const CAT_HALF = [
  '.............', '....kk.......', '...kbbk......', '...kbbbk.....', '..kkbbbk.....',
  '..kbbbtk.....', '..kbbttkk....', '..kbbttck....', '.kkbtttcck...', '.kcbttccck...',
  '.kccttccckk..', '.kcctccccck..', '.kcccccccck..', '.kccccccckkk', '.kcckkkcckkk',
  '.kckeeekckkk', '.kckeeekckkk', '.kcckkkcckkk', '.kccccccckkk', '.kcctttckkkk',
  '..kcttckkkkk', '..kcctckkgkk', '..kccccckggg', '...kcccckkkk', '...kkcccckk.',
  '....kcccck..', '....kkcck...', '.....kkk....',
]

// --- CORAZÓN (rejilla completa) --------------------------------------------
const HEART = [
  '...........', '..kk...kk..', '.krrrkrrrk.', 'krrrrrrrrrk', 'krrrrrrrrrk',
  'krrrrrrrrrk', '.krrrrrrrk.', '..krrrrrk..', '...krrrk...', '....krk....', '.....k.....',
]

// --- ROMBO / DIAMANTE (rejilla completa) -----------------------------------
const ROMBO = [
  '.....k.....', '....krk....', '...krrrk...', '..krrrrrk..', '.krrrrrrrk.',
  'krrrrrrrrrk', '.krrrrrrrk.', '..krrrrrk..', '...krrrk...', '....krk....', '.....k.....',
]

// --- ESTRELLA (media, se refleja) ------------------------------------------
const STAR_HALF = [
  '......k', '......k', '.....kyk', '.....kyk', '..kkkkyyk', '..kyyyyyk',
  '...kyyyyk', '....kyyyy', '...kyyyyk', '..kyyykyy', '..kyk..ky', '.kk.....k',
]

// --- MARIPOSA (media, se refleja) ------------------------------------------
const BUTTERFLY_HALF = [
  '.........', '.kkk...k.', 'kpppk.kbk', 'kppppkkbk', 'kppppppbk', 'kppoppppk',
  'kppppppbk', '.kppppkbk', '.kppppkbk', '..kppkkbk', '...kkppk.', '...kppppk',
  '...kppppk', '....kppk.', '.....kk..',
]

export const MOTIFS: Motif[] = [
  {
    id: 'gato-siames',
    name: 'Gato siamés',
    keywords: ['gato', 'siames', 'siamés', 'cat', 'gatito', 'michi', 'felino', 'minino'],
    stitch: 'loom',
    background: 'DB-252', // gris perla
    legend: {
      k: 'DB-10', b: 'DB-734', t: 'DB-1131', c: 'DB-1490', e: 'DB-628', g: 'DB-731',
    },
    rows: symmetric(CAT_HALF),
  },
  {
    id: 'corazon',
    name: 'Corazón',
    keywords: ['corazon', 'corazón', 'heart', 'amor', 'love', 'san valentin'],
    stitch: 'loom',
    background: 'DB-201',
    legend: { k: 'DB-10', r: 'DB-723' }, // negro + rojo
    rows: HEART,
  },
  {
    id: 'rombo',
    name: 'Rombo',
    keywords: ['rombo', 'diamante', 'diamond', 'geometrico', 'geométrico', 'losange'],
    stitch: 'loom',
    background: 'DB-201',
    legend: { k: 'DB-10', r: 'DB-729' }, // negro + turquesa
    rows: ROMBO,
  },
  {
    id: 'estrella',
    name: 'Estrella',
    keywords: ['estrella', 'star', 'brillo', 'noche'],
    stitch: 'loom',
    background: 'DB-361', // azul cobalto mate
    legend: { k: 'DB-10', y: 'DB-721' }, // negro + amarillo
    rows: symmetric(STAR_HALF),
  },
  {
    id: 'mariposa',
    name: 'Mariposa',
    keywords: ['mariposa', 'butterfly', 'insecto', 'primavera'],
    stitch: 'loom',
    background: 'DB-201',
    legend: { k: 'DB-10', p: 'DB-1310', o: 'DB-722', b: 'DB-661' },
    rows: symmetric(BUTTERFLY_HALF),
  },
]
