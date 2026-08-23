/**
 * Offline per-country spectrum allocation dataset (SAMPLE - public knowledge).
 * Band keys use CellScope notation: "B1".."B71+" (LTE), "n1".."n262" (NR).
 * Fully offline. To refresh with live data, export from spectrum-tracker.com
 * (or any source) into this JSON shape and import it in Settings > Spectrum data.
 * Imported data is persisted on-device and survives restarts.
 */

export interface SpectrumAlloc {
  band: string;
  ops: string[];
  /** Rich fields from the full spectrum-tracker.com dataset */
  op?: string;
  layer?: string | null;
  duplex?: string | null;
  ul?: [number | null, number | null];
  dl?: [number | null, number | null];
  total?: number | null;
  scope?: string | null;
}

export interface CountrySpectrum {
  iso: string;
  name: string;
  slug?: string;
  allocs: SpectrumAlloc[];
  source?: string;
  updated?: string;
}

/** Shape of assets/data/spectrum-full.json produced by tools/scrape-spectrum.mjs */
export interface FullSpectrumFile {
  kind: 'cellscope-spectrum';
  version: number;
  fetchedAt: string;
  countries: CountrySpectrum[];
}

export async function fetchFullSpectrum(): Promise<CountrySpectrum[] | null> {
  try {
    const res = await fetch('assets/data/spectrum-full.json');
    if (!res.ok) return null;
    const f = await res.json() as FullSpectrumFile;
    if (f.kind !== 'cellscope-spectrum' || !Array.isArray(f.countries)) return null;
    return f.countries;
  } catch {
    return null;
  }
}

type Row = [string, string]; // [bandKey, "Op1|Op2"]

const RAW: { iso: string; name: string; rows: Row[] }[] = [
  {
    iso: 'US', name: 'United States',
    rows: [
      ['B2', 'AT&T|Verizon'], ['B4', 'AT&T'], ['B5', 'AT&T|Verizon'],
      ['B12', 'AT&T|Verizon'], ['B13', 'Verizon'], ['B14', 'FirstNet(AT&T)'],
      ['B25', 'T-Mobile'], ['B26', 'T-Mobile'], ['B29', 'AT&T'],
      ['B30', 'AT&T'], ['B41', 'T-Mobile'], ['B48', 'CBRS shared'],
      ['B66', 'AT&T|T-Mobile'], ['B71', 'T-Mobile'],
      ['n41', 'T-Mobile'], ['n71', 'T-Mobile'], ['n77', 'AT&T|Verizon'],
      ['n78', 'US Cellular'], ['n257', 'AT&T|Verizon'], ['n260', 'AT&T|Verizon|T-Mobile']
    ]
  },
  {
    iso: 'CA', name: 'Canada',
    rows: [
      ['B2', 'Bell|Rogers'], ['B7', 'Videotron'], ['B12', 'Bell|Telus'],
      ['B13', 'Videotron'], ['B17', 'SaskTel'], ['B26', 'Rogers'],
      ['B41', 'SaskTel'], ['B66', 'Bell|Rogers|Telus'], ['B71', 'Xplore'],
      ['n41', 'Rogers|SaskTel'], ['n66', 'Bell|Telus'], ['n71', 'Telus|Bell'],
      ['n77', 'Bell|Rogers|Telus'], ['n78', 'Videotron|Freedom']
    ]
  },
  {
    iso: 'MX', name: 'Mexico',
    rows: [['B2', 'AT&T MX'], ['B4', 'AT&T MX'], ['B5', 'AT&T MX'], ['B28', 'Altán|Telcel'], ['B66', 'Movistar'], ['n71', 'AT&T MX']]
  },
  {
    iso: 'BR', name: 'Brazil',
    rows: [['B1', 'Vivo|TIM'], ['B3', 'Claro|TIM'], ['B5', 'Claro'], ['B7', 'Vivo|TIM|Claro'], ['B28', 'Oi|TIM|Claro|Vivo'], ['n78', 'TIM|Claro|Vivo'], ['n40', 'Sereduc? regional']]
  },
  {
    iso: 'AR', name: 'Argentina',
    rows: [['B2', 'Personal|Movistar'], ['B4', 'Movistar'], ['B7', 'Personal'], ['B28', 'Claro'], ['n78', 'Personal|Claro|Movistar']]
  },
  {
    iso: 'CL', name: 'Chile',
    rows: [['B2', 'Entel|Movistar'], ['B4', 'WOM|Claro'], ['B5', 'Claro'], ['B28', 'Movistar|WOM'], ['n78', 'Entel|Movistar|WOM'], ['n70', 'WOM']]
  },
  {
    iso: 'CO', name: 'Colombia',
    rows: [['B2', 'Claro'], ['B4', 'Movistar|Tigo'], ['B5', 'Claro'], ['B7', 'Claro'], ['B28', 'Tigo'], ['n78', 'Claro|Movistar']]
  },
  {
    iso: 'PE', name: 'Peru',
    rows: [['B2', 'Claro'], ['B4', 'Bitel'], ['B5', 'Claro'], ['B28', 'Movistar|Bitel'], ['n78', 'Movistar']]
  },
  {
    iso: 'GB', name: 'United Kingdom',
    rows: [
      ['B1', 'Vodafone'], ['B3', 'EE|Three'], ['B7', 'All MNOs'], ['B8', 'O2|Vodafone'],
      ['B20', 'O2|Three|EE|Vodafone'], ['B28', 'EE|O2|Vodafone'], ['B32', 'Vodafone(SDL)'],
      ['B38', 'Three'], ['B40', 'Three'], ['n78', 'EE|Vodafone|O2|Three'], ['n258', 'Vodafone|Three|EE|O2']
    ]
  },
  {
    iso: 'IE', name: 'Ireland',
    rows: [['B1', 'Vodafone'], ['B3', 'Eir|Three'], ['B7', 'Eir|Three'], ['B8', 'Eir'], ['B20', 'Vodafone|Eir'], ['B28', 'Vodafone|Three'], ['n78', 'Eir|Vodafone']]
  },
  {
    iso: 'FR', name: 'France',
    rows: [
      ['B1', 'Orange|Free'], ['B3', 'Orange'], ['B7', 'Orange|SFR|Bouygues|Free'],
      ['B20', 'Orange|SFR|Bouygues|Free'], ['B28', 'Orange|Free'], ['B38', 'Free'],
      ['n78', 'Orange|SFR|Bouygues|Free'], ['n258', 'Orange|SFR|Bouygues|Free'], ['n53' , '-']
    ]
  },
  {
    iso: 'DE', name: 'Germany',
    rows: [
      ['B1', 'Telekom|O2'], ['B3', 'Telekom'], ['B7', 'Telekom|Vodafone|O2|1&1'],
      ['B8', 'Telekom|O2'], ['B20', 'Vodafone|O2'], ['B28', '1&1|Telekom'],
      ['B38', 'Telekom'], ['n78', 'Telekom|O2|Vodafone|1&1'], ['n258', 'Vodafone|O2|1&1']
    ]
  },
  {
    iso: 'NL', name: 'Netherlands',
    rows: [['B1', 'KPN|Vodafone'], ['B3', 'KPN'], ['B7', 'KPN|Vodafone|T-Mobile'], ['B8', 'KPN'], ['B20', 'Vodafone|T-Mobile'], ['B28', 'T-Mobile'], ['n78', 'KPN|Vodafone|T-Mobile']]
  },
  {
    iso: 'BE', name: 'Belgium',
    rows: [['B1', 'Proximus'], ['B3', 'Proximus'], ['B7', 'Proximus|Orange|BASE'], ['B20', 'Proximus|BASE'], ['n78', 'Proximus|Orange|BASE'], ['n28', 'Telenet']]
  },
  {
    iso: 'CH', name: 'Switzerland',
    rows: [['B1', 'Sunrise|Salt'], ['B3', 'Sunrise'], ['B7', 'Swisscom|Sunrise|Salt'], ['B20', 'Swisscom|Sunrise'], ['n78', 'Swisscom|Sunrise|Salt']]
  },
  {
    iso: 'AT', name: 'Austria',
    rows: [['B1', 'A1'], ['B3', 'A1|Magenta'], ['B7', 'A1|Magenta|Drei'], ['B20', 'A1|Magenta'], ['B38', 'A1'], ['n78', 'A1|Magenta|Drei'], ['n28', 'Drei']]
  },
  {
    iso: 'IT', name: 'Italy',
    rows: [['B1', 'TIM|WindTre'], ['B3', 'TIM|Fastweb'], ['B7', 'TIM|Vodafone|WindTre'], ['B8', 'TIM|WindTre'], ['B20', 'Vodafone|WindTre'], ['B28', 'Iliad|Fastweb'], ['B38', 'TIM'], ['n78', 'TIM|Vodafone|WindTre|Iliad']]
  },
  {
    iso: 'ES', name: 'Spain',
    rows: [['B1', 'Vodafone'], ['B3', 'Movistar'], ['B7', 'Movistar|Vodafone|Orange'], ['B8', 'Movistar'], ['B20', 'Movistar|Vodafone'], ['B28', 'Orange'], ['n78', 'Movistar|Vodafone|Orange'], ['n28', 'Orange']]
  },
  {
    iso: 'PT', name: 'Portugal',
    rows: [['B1', 'NOS|MEO'], ['B3', 'MEO|NOS'], ['B7', 'MEO|NOS|Vodafone'], ['B8', 'MEO'], ['B20', 'Vodafone'], ['n78', 'MEO|NOS|Vodafone']]
  },
  {
    iso: 'DK', name: 'Denmark',
    rows: [['B3', 'TDC'], ['B7', 'TDC|Telenor|Telia'], ['B20', 'Telenor|Telia'], ['n78', 'TDC|3 DK']]
  },
  {
    iso: 'SE', name: 'Sweden',
    rows: [['B3', 'Telia'], ['B7', 'Telia|Tele2|Telenor'], ['B20', 'Telia|Tele2'], ['n78', 'Tele2|Telenor|Hi3G'], ['n79', 'Hi3G']]
  },
  {
    iso: 'NO', name: 'Norway',
    rows: [['B3', 'Telenor|Telia'], ['B7', 'Telenor|Telia|Ice'], ['B20', 'Telenor|Ice'], ['B28', 'Ice'], ['n78', 'Telenor|Telia|Ice']]
  },
  {
    iso: 'FI', name: 'Finland',
    rows: [['B1', 'Elisa'], ['B3', 'Telia'], ['B7', 'Elisa|DNA|Telia'], ['B20', 'Telia|DNA'], ['n78', 'Elisa|DNA|Telia']]
  },
  {
    iso: 'PL', name: 'Poland',
    rows: [['B1', 'Plus'], ['B3', 'Plus|Orange'], ['B7', 'Plus|T-Mobile|Play'], ['B20', 'Orange|T-Mobile'], ['n78', 'Plus|Orange|Play|T-Mobile'], ['n38', 'Orange']]
  },
  {
    iso: 'CZ', name: 'Czechia',
    rows: [['B1', 'T-Mobile'], ['B3', 'T-Mobile|Vodafone'], ['B7', 'T-Mobile|O2|Vodafone'], ['B20', 'O2|Vodafone'], ['n78', 'O2|T-Mobile|Vodafone']]
  },
  {
    iso: 'HU', name: 'Hungary',
    rows: [['B1', 'Yettel'], ['B3', 'Magyar Telekom'], ['B7', 'Telekom|Yettel|One'], ['B20', 'Yettel|One'], ['n78', 'Telekom|Yettel']]
  },
  {
    iso: 'RO', name: 'Romania',
    rows: [['B1', 'Orange|Vodafone'], ['B3', 'Orange'], ['B7', 'Orange|Vodafone|Telekom'], ['B20', 'Vodafone|Telekom'], ['n78', 'Orange|Vodafone|Digi']]
  },
  {
    iso: 'GR', name: 'Greece',
    rows: [['B1', 'Cosmote'], ['B3', 'Cosmote'], ['B7', 'Cosmote|Vodafone|Nova'], ['B20', 'Nova'], ['n78', 'Cosmote|Vodafone|Nova']]
  },
  {
    iso: 'TR', name: 'Türkiye',
    rows: [['B1', 'Turkcell'], ['B3', 'Turkcell|TT'], ['B7', 'Turkcell|Vodafone|TT'], ['B8', 'TT'], ['B20', 'Turkcell'], ['n78', 'Turkcell|Vodafone|TT']]
  },
  {
    iso: 'RU', name: 'Russia',
    rows: [['B1', 'MTS'], ['B3', 'MTS|Megafon'], ['B7', 'MTS|Megafon|Tele2'], ['B8', 'Tele2'], ['B20', 'MTS|Beeline'], ['B38', 'MTS'], ['n78', 'MTS|Megafon|Beeline']]
  },
  {
    iso: 'UA', name: 'Ukraine',
    rows: [['B1', 'Kyivstar'], ['B3', 'Kyivstar|lifecell'], ['B7', 'Kyivstar|Vodafone'], ['B8', 'Kyivstar|lifecell'], ['B20', 'Kyivstar|Vodafone|lifecell']]
  },
  {
    iso: 'IL', name: 'Israel',
    rows: [['B1', 'Cellcom'], ['B3', 'Partner'], ['B7', 'Partner|Cellcom|HOT'], ['B8', 'Pelephone'], ['n78', 'Partner|Cellcom|Pelephone']]
  },
  {
    iso: 'SA', name: 'Saudi Arabia',
    rows: [['B1', 'Mobily|Zain'], ['B3', 'STC|Mobily'], ['B7', 'STC|Mobily|Zain'], ['B8', 'STC'], ['B20', 'STC'], ['n78', 'STC|Mobily|Zain']]
  },
  {
    iso: 'AE', name: 'United Arab Emirates',
    rows: [['B1', 'Etisalat'], ['B3', 'Etisalat|Du'], ['B7', 'Etisalat|Du'], ['B8', 'Etisalat'], ['B20', 'Du'], ['n78', 'Etisalat|Du']]
  },
  {
    iso: 'QA', name: 'Qatar',
    rows: [['B1', 'Ooredoo'], ['B3', 'Ooredoo|Vodafone'], ['B7', 'Ooredoo|Vodafone'], ['B8', 'Ooredoo'], ['n78', 'Ooredoo|Vodafone']]
  },
  {
    iso: 'EG', name: 'Egypt',
    rows: [['B1', 'Etisalat EG'], ['B3', 'Orange EG'], ['B7', 'Vodafone|WE'], ['B8', 'Vodafone|Orange'], ['n78', 'Vodafone|Etisalat|WE']]
  },
  {
    iso: 'ZA', name: 'South Africa',
    rows: [['B1', 'Vodacom'], ['B3', 'Telkom'], ['B7', 'Vodacom|MTN'], ['B8', 'Cell C'], ['B20', 'MTN'], ['B40', 'Vodacom|MTN'], ['n78', 'Rain|Vodacom|MTN']]
  },
  {
    iso: 'NG', name: 'Nigeria',
    rows: [['B3', '9mobile'], ['B7', 'MTN|Airtel|Glo'], ['B8', 'MTN|Airtel|Glo|9mobile'], ['B20', 'MTN'], ['B28', 'Airtel|MTN']]
  },
  {
    iso: 'KE', name: 'Kenya',
    rows: [['B1', 'Faiba'], ['B3', 'Safaricom'], ['B7', 'Safaricom|Airtel'], ['B8', 'Safaricom|Airtel|Telkom'], ['B20', 'Safaricom'], ['B28', 'Airtel']]
  },
  {
    iso: 'IN', name: 'India',
    rows: [
      ['B1', 'Jio'], ['B3', 'Jio|Vi|Airtel'], ['B5', 'Jio|BSNL'],
      ['B8', 'Airtel|Vi|BSNL'], ['B40', 'Jio|Airtel|Vi'], ['B41', 'Jio|Airtel|Vi'],
      ['n28', 'Jio'], ['n78', 'Jio|Airtel|Vi'], ['n258', 'Jio']
    ]
  },
  {
    iso: 'PK', name: 'Pakistan',
    rows: [['B1', 'Zong'], ['B3', 'Jazz'], ['B8', 'Jazz|Ufone|Warid'], ['B41', 'Zong|Telenor'], ['n41', 'Zong|Jazz']]
  },
  {
    iso: 'ID', name: 'Indonesia',
    rows: [['B1', 'Telkomsel'], ['B3', 'XL|Tri'], ['B8', 'XL|Telkomsel'], ['B40', 'Smartfren'], ['n41', 'Smartfren|Telkomsel'], ['n40', 'Telkomsel|XL']]
  },
  {
    iso: 'TH', name: 'Thailand',
    rows: [['B1', 'AIS'], ['B3', 'True'], ['B8', 'AIS|True|NT'], ['B40', 'AIS|True|NT'], ['n41', 'NT|AIS|True'], ['n78', 'NT|AIS']]
  },
  {
    iso: 'VN', name: 'Vietnam',
    rows: [['B1', 'Viettel'], ['B3', 'Vinaphone'], ['B7', 'Viettel|Vinaphone|MobiFone'], ['B8', 'MobiFone'], ['B40', 'Viettel'], ['n78', 'Viettel|VNPT']]
  },
  {
    iso: 'MY', name: 'Malaysia',
    rows: [['B1', 'Celcom'], ['B3', 'Maxis|DiGi'], ['B7', 'Maxis|Celcom'], ['B8', 'DiGi|U Mobile'], ['n78', 'DNB(shared)|Maxis|Celcom|YTL']]
  },
  {
    iso: 'SG', name: 'Singapore',
    rows: [['B1', 'Singtel'], ['B3', 'Singtel|StarHub'], ['B7', 'Singtel|StarHub|M1'], ['B8', 'StarHub|M1'], ['n78', 'Singtel|StarHub|M1'], ['n38', 'SIMBA']]
  },
  {
    iso: 'PH', name: 'Philippines',
    rows: [['B1', 'Globe'], ['B3', 'Smart'], ['B5', 'Smart'], ['B7', 'Smart|Globe|DITO'], ['B28', 'Globe'], ['n78', 'DITO|Globe|Smart']]
  },
  {
    iso: 'JP', name: 'Japan',
    rows: [
      ['B1', 'Docomo|SoftBank'], ['B3', 'Docomo|au'], ['B8', 'SoftBank'],
      ['B11', 'Docomo'], ['B18', 'au'], ['B19', 'Docomo'], ['B21', 'Docomo'],
      ['B26', 'au'], ['B28', 'Docomo|au|SoftBank|Rakuten'], ['B41', 'Docomo|au|SoftBank|Rakuten'],
      ['B42', 'Docomo|K-DDI'], ['n77', 'Docomo|au|SoftBank|Rakuten|KDDI'], ['n78', 'Rakuten'], ['n79', 'SoftBank'],
      ['n257', 'Docomo|au|SoftBank|Rakuten']
    ]
  },
  {
    iso: 'KR', name: 'South Korea',
    rows: [['B1', 'KT|LG U+'], ['B3', 'SKT'], ['B5', 'SKT|KT'], ['B7', 'LG U+'], ['B8', 'KT|SKT'], ['n78', 'SKT|KT|LG U+'], ['n258', 'KT|LG U+']]
  },
  {
    iso: 'CN', name: 'China',
    rows: [
      ['B1', 'China Telecom'], ['B3', 'China Unicom|Telecom'], ['B5', 'China Telecom'],
      ['B8', 'China Mobile|Unicom'], ['B34', 'China Mobile (TD)'], ['B38', 'China Mobile'],
      ['B39', 'China Mobile'], ['B40', 'China Mobile'], ['B41', 'China Mobile|Unicom|Broadcast'],
      ['n41', 'China Mobile|China Broadcast'], ['n78', 'China Telecom|Unicom|Broadcast'], ['n79', 'China Mobile'],
      ['n1', 'China Telecom'], ['n28', 'regional']
    ]
  },
  {
    iso: 'TW', name: 'Taiwan',
    rows: [['B1', 'Chunghwa'], ['B3', 'Chunghwa|Taiwan Mobile'], ['B7', 'Taiwan Star'], ['B8', 'Taiwan Mobile'], ['B28', 'APT shared'], ['n78', 'Chunghwa|FarEasTone|Taiwan Mobile']]
  },
  {
    iso: 'HK', name: 'Hong Kong',
    rows: [['B1', 'CSL'], ['B3', 'CSL|CMCC HK'], ['B7', '3HK|SmarTone|CSL'], ['B8', 'SmarTone|China Unicom HK'], ['B38', '3HK'], ['n78', 'CSL|3HK|SmarTone'], ['n79', 'CMCC HK']]
  },
  {
    iso: 'AU', name: 'Australia',
    rows: [
      ['B1', 'Optus|Vodafone'], ['B3', 'Telstra|Optus'], ['B5', 'Optus|Vodafone'],
      ['B7', 'Optus|Vodafone|TPG'], ['B8', 'Telstra'], ['B28', 'Telstra|Optus|TPG'],
      ['B40', 'Optus|TPG'], ['n78', 'Telstra|Optus|TPG'], ['n40', 'Optus|TPG'], ['n5', 'Telstra|Optus']
    ]
  },
  {
    iso: 'NZ', name: 'New Zealand',
    rows: [['B1', 'One NZ'], ['B3', 'Spark'], ['B7', 'Spark|One NZ|2degrees'], ['B8', '2degrees'], ['B28', 'Spark|One NZ|2degrees'], ['n78', 'Spark|One NZ|2degrees|NZTA']]
  }
];

function expand(rows: Row[]): SpectrumAlloc[] {
  return rows
    .filter(r => r[0] && r[0].startsWith('B') || r[0].startsWith('n'))
    .map(r => ({ band: r[0], ops: r[1].split('|').map(s => s.trim()).filter(s => s && s !== '-') }));
}

export const BUNDLED_SPECTRUM: CountrySpectrum[] = RAW.map(c => ({
  iso: c.iso,
  name: c.name,
  allocs: expand(c.rows),
  source: 'bundled sample (public knowledge)',
  updated: '2025'
}));

export function spectrumForCountry(list: CountrySpectrum[], iso: string | null | undefined): CountrySpectrum | null {
  if (!iso) return null;
  const s = iso.toUpperCase();
  return list.find(c => c.iso === s) || list.find(c => c.iso.slice(0, 2) === s) || null;
}

/** Merge an imported dataset over bundled/imported entries by ISO code. */
export function mergeSpectrum(current: CountrySpectrum[], incoming: CountrySpectrum[]): CountrySpectrum[] {
  const out = current.filter(c => !incoming.some(i => i.iso === c.iso));
  return [...out, ...incoming];
}
