import type { Production } from '@/lib/types';

// All people, companies and places below are fictional and labelled DEMO.
export function makeSeed(): Production {
  return {
    id: 'jacket-campaign',
    slug: 'jacket-campaign',
    title: 'Jacket campaign (demo)',
    brand: 'Vėtra outerwear (demo brand)',
    dateISO: '2026-11-21',
    version: 1,
    studio: {
      name: 'Demo studio, Vilnius',
      address: 'Demo address, Vilnius',
      mapsUrl: 'https://maps.google.com/?q=Vilnius',
      opensMin: 420,
      closesMin: 1080,
      bookedUntilMin: 900,
      hourlyRate: 60,
    },
    people: [
      { id: 'producer', name: 'Producer (you)', role: 'producer', dayRate: 0, otRatePerHour: 0, local: true },
      { id: 'ieva', name: 'Ieva', role: 'model', agency: 'Milan agency (demo)', commissionPct: 20, dayRate: 600, otRatePerHour: 75, local: false },
      { id: 'marta', name: 'Marta', role: 'model', dayRate: 450, otRatePerHour: 55, local: true },
      { id: 'tomas', name: 'Tomas', role: 'photographer', dayRate: 900, otRatePerHour: 90, local: true },
      { id: 'greta', name: 'Greta', role: 'mua', dayRate: 350, otRatePerHour: 40, local: true },
      { id: 'lukas', name: 'Lukas', role: 'stylist', dayRate: 400, otRatePerHour: 45, local: true },
    ],
    shortlist: [
      { id: 'austeja', name: 'Austėja', role: 'model', dayRate: 500, otRatePerHour: 60, local: true },
    ],
    travel: [
      { personId: 'ieva', mode: 'flight', number: 'DA 641', from: 'MXP', to: 'VNO', departMin: 295, arriveMin: 460, transferMin: 30, source: 'seed' },
    ],
    late: [],
    looks: [
      { id: 'L1', name: 'Look 1', garment: 'Field jacket, olive' },
      { id: 'L2', name: 'Look 2', garment: 'Field jacket, sand' },
      { id: 'L3', name: 'Look 3', garment: 'Field jacket, black' },
      { id: 'L4', name: 'Look 4', garment: 'Field jacket, navy' },
    ],
    blocks: [
      { id: 'b-setup', kind: 'setup', startMin: 480, endMin: 540, personIds: ['producer', 'tomas', 'lukas'] },
      { id: 'b-hmu-a', kind: 'hmu', startMin: 540, endMin: 600, personIds: ['ieva', 'greta'] },
      { id: 'b-shoot-a', kind: 'shoot', startMin: 600, endMin: 720, personIds: ['ieva', 'tomas', 'lukas'], lookIds: ['L1', 'L2'] },
      { id: 'b-hmu-b', kind: 'hmu', startMin: 690, endMin: 750, personIds: ['marta', 'greta'] },
      { id: 'b-lunch', kind: 'lunch', startMin: 720, endMin: 750, personIds: ['producer', 'tomas', 'lukas'] },
      { id: 'b-shoot-b', kind: 'shoot', startMin: 750, endMin: 870, personIds: ['marta', 'tomas', 'lukas'], lookIds: ['L3', 'L4'] },
      { id: 'b-wrap', kind: 'wrap', startMin: 870, endMin: 900, personIds: ['producer', 'tomas', 'lukas'] },
    ],
    budget: {
      cap: 5000,
      contingencyPct: 10,
      items: [
        { id: 'i-ieva', category: 'talent', label: 'Ieva, model', qty: 1, unit: 'day', rate: 600, personId: 'ieva', source: 'rate_card' },
        { id: 'i-marta', category: 'talent', label: 'Marta, model', qty: 1, unit: 'day', rate: 450, personId: 'marta', source: 'rate_card' },
        { id: 'i-tomas', category: 'crew', label: 'Tomas, photographer', qty: 1, unit: 'day', rate: 900, personId: 'tomas', source: 'rate_card' },
        { id: 'i-greta', category: 'crew', label: 'Greta, hair and makeup', qty: 1, unit: 'day', rate: 350, personId: 'greta', source: 'rate_card' },
        { id: 'i-lukas', category: 'crew', label: 'Lukas, stylist', qty: 1, unit: 'day', rate: 400, personId: 'lukas', source: 'rate_card' },
        { id: 'i-studio', category: 'studio', label: 'Studio 08:00–15:00', qty: 7, unit: 'hour', rate: 60, source: 'quote' },
        { id: 'i-flight', category: 'travel', label: 'Flight MXP–VNO, Ieva', qty: 1, unit: 'flat', rate: 180, personId: 'ieva', source: 'quote' },
        { id: 'i-taxi', category: 'travel', label: 'Taxi airport → studio, Ieva', qty: 1, unit: 'flat', rate: 30, personId: 'ieva', source: 'estimate' },
        { id: 'i-retouch', category: 'post', label: 'Retouching', qty: 6, unit: 'item', rate: 40, source: 'estimate' },
        { id: 'i-usage-ieva', category: 'usage', label: 'Usage web + social 12 mo, Ieva', qty: 1, unit: 'flat', rate: 300, personId: 'ieva', source: 'estimate' },
        { id: 'i-usage-marta', category: 'usage', label: 'Usage web + social 12 mo, Marta', qty: 1, unit: 'flat', rate: 300, personId: 'marta', source: 'estimate' },
      ],
    },
    pending: null,
  };
}
