/**
 * Starlink / non-terrestrial-network (NTN) detection heuristics.
 * Works fully offline using device signals:
 *  1. Android ServiceState.isUsingNonTerrestrialNetwork() flag (API 34+) - passed in via native bridge.
 *  2. Operator/SPN names containing starlink/spacex markers.
 *  3. Known Direct-to-Cell partner PLMNs (public partnerships).
 *  4. Wi-Fi SSID / BSSID OUI patterns of Starlink routers & dish APs.
 */

export const STARLINK_SSID_RE = /starlink|spacex|^spx[-_ ]|stinky/i;

/** Known SpaceX MAC OUI prefixes (router/dish). Extend as you discover more. */
export const SPACEX_OUIS = ['F0:9F:C2', 'D8:3A:DD'];

/**
 * Public Starlink Direct-to-Cell partner networks (PLMN -> partner label).
 * When the phone camps on these networks AND shows satellite/NTN indicators,
 * odds are high the serving layer is a Starlink payload.
 */
export const DTC_PARTNER_PLMNS: { [plmn: string]: string } = {
  '310260': 'T-Mobile US',
  '310250': 'T-Mobile US (legacy)',
  '53001': 'One NZ',
  '302720': 'Rogers CA',
  '44050': 'au KDDI JP',
  '44051': 'au KDDI JP',
  '50502': 'Optus AU',
  '50501': 'Telstra AU',
  '22803': 'Salt CH',
  '25503': 'Kyivstar UA',
  '73001': 'Entel CL',
  '71606': 'Entel PE',
  '21401': 'Vodafone ES (announced)',
  '23415': 'Vodafone UK (announced)',
  '20404': 'Vodafone NL (announced)',
  '22210': 'Vodafone IT (announced)',
  '26202': 'Vodafone DE (announced)',
  '45601': 'Smart Cambodia? (regional)'
};

const NAME_MARKERS = /(starlink|spacex|xlink|\bsat\b|satellite)/i;

export interface StarlinkInput {
  ntnFlag?: boolean | null;          // native NTN API result
  operatorNumeric?: string | null;   // e.g. "310260"
  operatorName?: string | null;
  spnName?: string | null;
  wifiSsid?: string | null;
  wifiBssid?: string | null;
  gatewayMac?: string | null;
}

export interface StarlinkVerdict {
  level: 'none' | 'possible' | 'likely' | 'confirmed';
  score: number;
  ntnFlag: boolean;
  nameMatch: boolean;
  dtcPartner: string | null;
  ssidMatch: boolean;
  ouiMatch: boolean;
  reasons: string[];
}

export function bssidToOui(bssid: string | null | undefined): string | null {
  if (!bssid) return null;
  const clean = bssid.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (clean.length < 6) return null;
  return `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(4, 6)}`;
}

export function detectStarlink(inp: StarlinkInput): StarlinkVerdict {
  const reasons: string[] = [];
  let score = 0;

  const ntnFlag = !!inp.ntnFlag;
  if (ntnFlag) {
    score += 60;
    reasons.push('Android reports non-terrestrial network in use');
  }

  const nameHit =
    NAME_MARKERS.test(inp.operatorName || '') || NAME_MARKERS.test(inp.spnName || '');
  if (nameHit) {
    score += 35;
    reasons.push(`Operator name contains satellite marker (${inp.operatorName || inp.spnName})`);
  }

  let dtcPartner: string | null = null;
  const num = (inp.operatorNumeric || '').replace(/\D/g, '');
  if (num) {
    for (const k of Object.keys(DTC_PARTNER_PLMNS)) {
      if (num.startsWith(k) || k.startsWith(num)) {
        dtcPartner = DTC_PARTNER_PLMNS[k];
        break;
      }
    }
  }
  if (dtcPartner) {
    score += 20;
    reasons.push(`Camped on known Direct-to-Cell partner network (${dtcPartner})`);
  }

  const ssidMatch = STARLINK_SSID_RE.test((inp.wifiSsid || '').trim());
  if (ssidMatch) {
    score += 45;
    reasons.push(`Wi-Fi SSID matches Starlink pattern ("${inp.wifiSsid}")`);
  }

  const oui = bssidToOui(inp.wifiBssid) || bssidToOui(inp.gatewayMac);
  const ouiMatch = !!oui && SPACEX_OUIS.includes(oui);
  if (ouiMatch) {
    score += 45;
    reasons.push(`MAC OUI ${oui} registered to SpaceX hardware`);
  }

  let level: StarlinkVerdict['level'] = 'none';
  if (score >= 90) level = 'confirmed';
  else if (score >= 45) level = 'likely';
  else if (score >= 20) level = 'possible';

  return { level, score, ntnFlag, nameMatch: nameHit, dtcPartner, ssidMatch, ouiMatch, reasons };
}
