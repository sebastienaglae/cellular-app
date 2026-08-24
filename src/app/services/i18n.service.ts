import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'fr' | 'jp';

/** French + Japanese translations keyed by the English source string. */
const FR: Record<string, string> = {
  'Signal': 'Signal', 'Cells': 'Cellules', 'Bands': 'Bands', 'Speed': 'Vitesse', 'More': 'Plus',
  'Tools': 'Outils', 'Data': 'Données',
  'Network, SIM & virtual-operator analysis': 'Réseau, SIM et analyse MVNO',
  'Who owns your IP — offline ASN database': 'À qui appartient votre IP — base ASN hors ligne',
  'Native ICMP latency & jitter': 'Latence et gigue ICMP natives',
  'Open speedtest.net in a protected tab': 'Ouvrir speedtest.net dans un onglet protégé',
  'Saved tests on the offline OSM map': 'Tests enregistrés sur la carte OSM hors ligne',
  'Dev mode, endpoints, permissions': 'Mode dev, points de terminaison, permissions',
  '100% offline core · OSM tiles z0–4 · spectrum: spectrum-tracker.com · IP data: iptoasn.com':
    'Cœur 100% hors ligne · tuiles OSM z0–4 · spectre : spectrum-tracker.com · IP : iptoasn.com',
  'Permissions needed': 'Permissions requises',
  'CellScope reads everything directly from your phone — no cloud, nothing leaves the device.':
    'CellScope lit tout directement depuis votre téléphone — aucun cloud, rien ne quitte l’appareil.',
  'Location': 'Localisation', 'Phone': 'Téléphone', 'Nearby devices': 'Appareils à proximité',
  'required by Android to scan nearby cells and place you on the map.': 'requise par Android pour scanner les cellules proches et vous placer sur la carte.',
  'operator name, PLMN codes and SIM details (MVNO detection).': 'nom de l’opérateur, codes PLMN et détails SIM (détection MVNO).',
  'Wi-Fi name and signal of the network you use.': 'nom et signal du réseau Wi-Fi utilisé.',
  'Grant access': 'Accorder', 'Later': 'Plus tard', 'Asking…': 'Demande…',
  'Serving cell': 'Cellule servie', 'Band': 'Bande', 'DL freq': 'Fréq. DL', 'UL freq': 'Fréq. UL',
  'RSRP trend': 'Tendance RSRP', 'Operator': 'Opérateur', 'Data tech': 'Techno. données', 'Country': 'Pays',
  'Position': 'Position', 'Latitude': 'Latitude', 'Longitude': 'Longitude', 'Accuracy': 'Précision',
  'Altitude': 'Altitude', 'Heading': 'Cap',
  'Live position · offline OSM basemap': 'Position live · fond OSM hors ligne',
  'All cells': 'Toutes les cellules', 'Speed test': 'Test de vitesse',
  'No cell info.': 'Aucune info cellule.', 'Grant location & phone permissions in Settings.': 'Accordez les permissions dans Réglages.',
  'Reading modem…': 'Lecture du modem…', 'Waiting for GPS fix…': 'En attente du GPS…',
  'GPS unavailable (permission denied?)': 'GPS indisponible (permission refusée ?)',
  'serving': 'servie', 'DL frequency': 'Fréquence DL', 'UL frequency': 'Fréquence UL',
  'Channel (ARFCN)': 'Canal (ARFCN)', 'Bandwidth': 'Bande passante', 'Timing advance': 'Timing advance',
  'Serving + neighbor cells reported by the modem. Neighbors let you see what else is on air nearby.':
    'Cellule servie + voisines rapportées par le modem. Les voisines montrent ce qui émet à proximité.',
  'No cells reported yet.': 'Aucune cellule rapportée.',
  'On Android 10+ a location permission (and location services ON) is required to read cell info.':
    'Sur Android 10+, la permission localisation (et services ON) est requise.',
  'Bands & Spectrum': 'Bandes & Spectre', 'Current cell frequency': 'Fréquence actuelle',
  'Technology': 'Technologie', 'Downlink': 'Downlink', 'Uplink': 'Uplink', 'Channel': 'Canal',
  'Carrier BW': 'Bande porteuse', 'Country spectrum allocation': 'Attribution du spectre pays',
  'auto-detected': 'auto-détecté', 'allocations': 'attributions',
  'Filter operator or band…': 'Filtrer opérateur ou bande…', 'Browse all bands': 'Parcourir toutes les bandes',
  'No country detected. Set one above or connect to a network.': 'Aucun pays détecté. Choisissez-en un ou connectez-vous.',
  'Speed Test': 'Test de vitesse', 'Last result': 'Dernier résultat', 'Down': 'Descendant', 'Up': 'Montant',
  'Latency': 'Latence', 'Mbps down': 'Mbps descendant', 'Ready': 'Prêt', 'tap start': 'appuyez sur démarrer',
  'Run again': 'Relancer', 'Start test': 'Démarrer le test', 'Stop': 'Arrêter',
  'DOWN': 'DESC.', 'UP': 'MONT.',
  'Continuous monitoring': 'Surveillance continue',
  'every {n} min, geo-tagged, saved on device': 'toutes les {n} min, géolocalisé, sauvegardé sur l’appareil',
  'History': 'Historique', 'No saved tests yet': 'Aucun test enregistré',
  'Saved': 'Enregistré', 'Test failed — check connectivity and endpoint URL': 'Échec — vérifiez connexion et URL',
  'Measured at': 'Mesuré à', 'Network': 'Réseau',
  'same spot as previous': 'même endroit que le précédent',
  'same location as previous test': 'même lieu que le test précédent',
  'start point': 'point de départ',
  'Live': 'Live', 'Host / IP': 'Hôte / IP', 'Start live ping': 'Démarrer le ping live',
  'not running': 'arrêté', 'probes sent': 'sondes envoyées', 'AVG': 'MOY', 'JITTER': 'GIGUE',
  'ms · live session': 'ms · session live', 'Saved sessions': 'Sessions enregistrées',
  'Clear': 'Effacer', 'No ping sessions yet — run one in the Live tab': 'Aucune session — lancez-en une dans Live',
  'probes': 'sondes', 'Session saved — {n} probes to {host}': 'Session enregistrée — {n} sondes vers {host}',
  'Continuous 1-packet probes while running. Sessions are saved to History automatically.':
    'Sondes 1 paquet en continu. Sessions sauvegardées automatiquement.',
  'Tests': 'Tests', 'Map': 'Carte', 'No geo-tagged tests yet': 'Aucun test géolocalisé',
  'locations · offline OSM basemap · pinch to zoom': 'lieux · fond OSM hors ligne · pincez pour zoomer',
  'Run a speed test to start building history': 'Lancez un test de vitesse pour créer l’historique',
  'latency': 'latence', 'History cleared': 'Historique effacé',
  'Your connection': 'Votre connexion', 'Detecting public IP…': 'Détection de l’IP publique…',
  'Offline — public IP unavailable right now.': 'Hors ligne — IP publique indisponible.',
  'Detection needs internet; the lookup itself is fully offline.': 'Détection : internet. Recherche : 100% hors ligne.',
  'Organisation': 'Organisation', 'STARLINK RANGE — AS14593': 'PLAGE STARLINK — AS14593',
  'Lookup': 'Recherche', 'Any IP': 'N’importe quelle IP', 'Resolve': 'Résoudre', 'Public': 'Public',
  'No match in database (private or reserved range)': 'Aucun résultat (plage privée ou réservée)',
  'Starlink public ranges': 'Plages publiques Starlink',
  'AS14593 SPACEX-STARLINK blocks present in the loaded DB:': 'Blocs AS14593 SPACEX-STARLINK dans la base :',
  'Operators & MVNO': 'Opérateurs & MVNO', 'SIM / subscriptions': 'SIM / abonnements',
  'Carrier': 'Opérateur', 'Display name': 'Nom affiché', 'Slot / eSIM': 'Slot / eSIM',
  'physical': 'physique', 'Network registration': 'Enregistrement réseau', 'Network PLMN': 'PLMN réseau',
  'Resolved name': 'Nom résolu',
  'Neighbor operators (what the modem exposes)': 'Opérateurs voisins (exposés par le modem)',
  'Android does not expose other operators’ PLMNs over-the-air. What IS visible: neighbor cells on other bands/frequencies below — useful for mapping competing coverage.':
    'Android n’expose pas les PLMN des autres opérateurs. Visible : les cellules voisines sur d’autres bandes/fréquences.',
  'PLMN database lookup': 'Recherche base PLMN', 'Operator or MCC-MNC…': 'Opérateur ou MCC-MNC…',
  'MVNO on': 'MVNO sur', 'Settings': 'Réglages', 'Developer': 'Développeur', 'Unlock code': 'Code de déblocage',
  'type \'dev\' to unlock fake-data mode': 'tapez \'dev\' pour le mode fake-data',
  'Dev mode replaces all modem/Wi-Fi/ping/speed data with realistic synthetic values.':
    'Le mode dev remplace toutes les données par des valeurs synthétiques réalistes.',
  'Cell info needs Location + Phone permissions on Android. Wi-Fi SSID also needs location services ON.':
    'Les infos cellules nécessitent Localisation + Téléphone. Le SSID Wi-Fi nécessite la localisation.',
  'Request permissions': 'Demander les permissions', 'Monitoring': 'Surveillance',
  'Dev / fake-data mode': 'Mode dev / fake-data', 'Country for spectrum': 'Pays du spectre',
  '(auto)': '(auto)', 'Language': 'Langue',
  'Speed endpoints (used online only)': 'Points de terminaison (en ligne uniquement)',
  'Download URL': 'URL téléchargement', 'Upload URL': 'URL téléchargement', 'Ookla page URL': 'URL page Ookla',
  'Default: Cloudflare speed endpoints. Replace with any HTTP endpoint that streams bytes.':
    'Par défaut : Cloudflare. Remplacez par tout point HTTP diffusant des octets.',
  'About': 'À propos', 'App': 'App', 'Core features': 'Fonctions cœur', 'fully offline': '100% hors ligne',
  'Band/freq engine': 'Moteur bandes/fréq.', 'bundled 3GPP tables (36.101 / 38.104)': 'tables 3GPP intégrées (36.101 / 38.104)',
  'Spectrum': 'Spectre', 'spectrum-tracker.com · bundled snapshot': 'spectrum-tracker.com · instantané intégré',
  'IP database': 'Base IP',
  'Run the official Ookla test': 'Lancez le test Ookla officiel',
  'speedtest.net refuses to be embedded inside other apps (ERR_BLOCKED_BY_RESPONSE), so CellScope opens it in a secure in-app browser tab instead. Results stay between you and Ookla.':
    'speedtest.net refuse l’intégration dans les apps, CellScope l’ouvre donc dans un onglet sécurisé. Les résultats restent entre vous et Ookla.',
  'Open speedtest.net': 'Ouvrir speedtest.net', 'fast.com (Netflix) alternative': 'Alternative fast.com (Netflix)',
  'For fully offline-logged tests use the built-in Speed tab — it saves results with GPS, band and operator on this device.':
    'Pour des tests journalisés hors ligne, utilisez l’onglet Speed intégré.',
  'DEV MODE — SIMULATED RESULTS': 'MODE DEV — RÉSULTATS SIMULÉS',
  'ms — live': 'ms — live',
  'Satellite / Starlink': 'Satellite / Starlink',
  'Starlink link detected': 'Liaison Starlink détectée',
  'Possible satellite connection': 'Connexion satellite possible',
  'Roaming': 'Itinérance',
  'Link': 'Liaison'
};

const JP: Record<string, string> = {
  'Signal': '信号', 'Cells': 'セル', 'Bands': 'バンド', 'Speed': '速度', 'More': 'その他',
  'Tools': 'ツール', 'Data': 'データ',
  'Network, SIM & virtual-operator analysis': 'ネットワーク・SIM・MVNO分析',
  'Who owns your IP — offline ASN database': 'あなたのIPの所有者 — オフラインASNデータベース',
  'Native ICMP latency & jitter': 'ネイティブICMP遅延とジッタ',
  'Open speedtest.net in a protected tab': 'speedtest.netを保護されたタブで開く',
  'Saved tests on the offline OSM map': 'オフラインOSM地図上の保存済みテスト',
  'Dev mode, endpoints, permissions': '開発モード、エンドポイント、権限',
  'Permissions needed': '権限が必要です',
  'CellScope reads everything directly from your phone — no cloud, nothing leaves the device.':
    'CellScopeは端末から直接すべてを読み取ります。クラウド不要、外部送信なし。',
  'Location': '位置情報', 'Phone': '電話', 'Nearby devices': '近くのデバイス',
  'required by Android to scan nearby cells and place you on the map.': '近くの基地局スキャンと地図表示に必要です。',
  'operator name, PLMN codes and SIM details (MVNO detection).': '运营商名、PLMNコード、SIM詳細（MVNO検出）。',
  'Wi-Fi name and signal of the network you use.': '使用中のWi-Fiの名前と信号。',
  'Grant access': '許可する', 'Later': '後で', 'Asking…': '確認中…',
  'Serving cell': 'サービングセル', 'Band': 'バンド', 'DL freq': 'DL周波数', 'UL freq': 'UL周波数',
  'RSRP trend': 'RSRP推移', 'Operator': '运营商', 'Data tech': 'データ方式', 'Country': '国',
  'Position': '位置', 'Latitude': '緯度', 'Longitude': '経度', 'Accuracy': '精度',
  'Altitude': '高度', 'Heading': '方位',
  'Live position · offline OSM basemap': '現在位置 · オフラインOSM地図',
  'All cells': '全セル', 'Speed test': '速度テスト',
  'No cell info.': 'セル情報がありません。', 'Grant location & phone permissions in Settings.': '設定で権限を付与してください。',
  'Reading modem…': 'モデム読み取り中…', 'Waiting for GPS fix…': 'GPS取得中…',
  'GPS unavailable (permission denied?)': 'GPS利用不可（権限拒否？）',
  'serving': 'サービング', 'DL frequency': 'DL周波数', 'UL frequency': 'UL周波数',
  'Channel (ARFCN)': 'チャネル (ARFCN)', 'Bandwidth': '帯域幅', 'Timing advance': 'タイミングアドバンス',
  'Serving + neighbor cells reported by the modem. Neighbors let you see what else is on air nearby.':
    'モデムが報告するサービング＋隣接セル。近隣の電波を確認できます。',
  'No cells reported yet.': 'セルが報告されていません。',
  'On Android 10+ a location permission (and location services ON) is required to read cell info.':
    'Android 10以降では位置情報権限が必要です。',
  'Bands & Spectrum': 'バンドとスペクトラム', 'Current cell frequency': '現在のセル周波数',
  'Technology': '技術', 'Downlink': 'ダウンリンク', 'Uplink': 'アップリンク', 'Channel': 'チャネル',
  'Carrier BW': 'キャリア帯域', 'Country spectrum allocation': '国別スペクトラム割り当て',
  'auto-detected': '自動検出', 'allocations': '割り当て',
  'Filter operator or band…': '絞り込み…', 'Browse all bands': '全バンド一覧',
  'No country detected. Set one above or connect to a network.': '国が未検出です。上で選択するか接続してください。',
  'Speed Test': '速度テスト', 'Last result': '前回の結果', 'Down': 'ダウンロード', 'Up': 'アップロード',
  'Latency': 'レイテンシ', 'Mbps down': 'Mbps ダウンロード', 'Ready': '準備完了', 'tap start': 'スタートを押してください',
  'Run again': '再テスト', 'Start test': 'テスト開始', 'Stop': '停止',
  'Continuous monitoring': '連続モニタリング',
  'every {n} min, geo-tagged, saved on device': '{n}分ごと、位置情報付き、端末に保存',
  'History': '履歴', 'No saved tests yet': '保存されたテストはありません',
  'Saved': '保存しました', 'Test failed — check connectivity and endpoint URL': 'テスト失敗 — 接続とURLを確認',
  'Measured at': '測定地点', 'Network': 'ネットワーク',
  'same spot as previous': '前回と同じ地点', 'same location as previous test': '前回のテストと同じ地点',
  'start point': '開始地点',
  'Live': 'ライブ', 'Host / IP': 'ホスト / IP', 'Start live ping': 'ライブping開始',
  'not running': '停止中', 'probes sent': 'プローブ送信', 'AVG': '平均', 'JITTER': 'ジッタ',
  'ms · live session': 'ms · ライブセッション', 'Saved sessions': '保存済みセッション',
  'Clear': 'クリア', 'No ping sessions yet — run one in the Live tab': 'セッションなし — Liveタブで実行',
  'probes': 'プローブ', 'Session saved — {n} probes to {host}': 'セッション保存 — {host}へ{n}プローブ',
  'Continuous 1-packet probes while running. Sessions are saved to History automatically.':
    '実行中は1パケットの連続プローブ。セッションは自動保存。',
  'Tests': 'テスト', 'Map': '地図', 'No geo-tagged tests yet': '位置情報付きテストはなし',
  'locations · offline OSM basemap · pinch to zoom': '地点 · オフラインOSM地図 · ピンチでズーム',
  'Run a speed test to start building history': '速度テストで履歴を作りましょう',
  'latency': 'レイテンシ', 'History cleared': '履歴を消去しました',
  'Your connection': '接続情報', 'Detecting public IP…': '公開IPを検出中…',
  'Offline — public IP unavailable right now.': 'オフライン — 公開IPを取得できません。',
  'Detection needs internet; the lookup itself is fully offline.': '検出にはインターネット。検索は完全オフライン。',
  'Organisation': '組織', 'STARLINK RANGE — AS14593': 'スターリンク範囲 — AS14593',
  'Lookup': '検索', 'Any IP': '任意のIP', 'Resolve': '解決', 'Public': '公開',
  'No match in database (private or reserved range)': '該当なし（プライベート/予約範囲）',
  'Starlink public ranges': 'スターリンク公開範囲',
  'AS14593 SPACEX-STARLINK blocks present in the loaded DB:': 'DB内のAS14593 SPACEX-STARLINKブロック:',
  'Operators & MVNO': '运营商 & MVNO', 'SIM / subscriptions': 'SIM / 契約',
  'Carrier': 'キャリア', 'Display name': '表示名', 'Slot / eSIM': 'スロット / eSIM',
  'physical': '物理', 'Network registration': 'ネットワーク登録', 'Network PLMN': 'ネットワークPLMN',
  'Resolved name': '解決された名前',
  'Neighbor operators (what the modem exposes)': '隣接运营商（モデムの報告）',
  'Android does not expose other operators’ PLMNs over-the-air. What IS visible: neighbor cells on other bands/frequencies below — useful for mapping competing coverage.':
    'Androidは他运营商のPLMNを公開しません。表示されるのは隣接セルのみ。',
  'PLMN database lookup': 'PLMNデータベース検索', 'Operator or MCC-MNC…': '运营商やMCC-MNC…',
  'MVNO on': 'MVNO →', 'Settings': '設定', 'Developer': '開発', 'Unlock code': 'ロック解除コード',
  'type \'dev\' to unlock fake-data mode': '\'dev\'入力でフェイクモード',
  'Dev mode replaces all modem/Wi-Fi/ping/speed data with realistic synthetic values.':
    '開発モードはすべてのデータをリアルな合成値に置き換えます。',
  'Cell info needs Location + Phone permissions on Android. Wi-Fi SSID also needs location services ON.':
    'セル情報には位置情報+電話権限が必要です。',
  'Request permissions': '権限を要求', 'Monitoring': 'モニタリング',
  'Dev / fake-data mode': '開発 / フェイクモード', 'Country for spectrum': 'スペクトラムの国',
  '(auto)': '(自動)', 'Language': '言語',
  'Speed endpoints (used online only)': '速度エンドポイント（オンライン）',
  'Download URL': 'ダウンロードURL', 'Upload URL': 'アップロードURL', 'Ookla page URL': 'OoklaページURL',
  'Default: Cloudflare speed endpoints. Replace with any HTTP endpoint that streams bytes.':
    '既定: Cloudflare。任意のHTTPエンドポイントに変更可能。',
  'About': '情報', 'App': 'アプリ', 'Core features': 'コア機能', 'fully offline': '完全オフライン',
  'Band/freq engine': 'バンド/周波数エンジン', 'bundled 3GPP tables (36.101 / 38.104)': '内蔵3GPPテーブル',
  'Spectrum': 'スペクトラム', 'spectrum-tracker.com · bundled snapshot': 'spectrum-tracker.com · 同梱',
  'IP database': 'IPデータベース',
  'Run the official Ookla test': '公式Ooklaテストを実行',
  'speedtest.net refuses to be embedded inside other apps (ERR_BLOCKED_BY_RESPONSE), so CellScope opens it in a secure in-app browser tab instead. Results stay between you and Ookla.':
    'speedtest.netは埋め込みを拒否するため、安全なアプリ内タブで開きます。結果はあなたとOokla間のみ。',
  'Open speedtest.net': 'speedtest.netを開く', 'fast.com (Netflix) alternative': 'fast.com（Netflix）代替',
  'For fully offline-logged tests use the built-in Speed tab — it saves results with GPS, band and operator on this device.':
    'オフライン記録には内蔵Speedタブをご利用ください。',
  'DEV MODE — SIMULATED RESULTS': '開発モード — 模擬結果',
  'you': 'あなた',
  'Satellite / Starlink': '衛星 / スターリンク',
  'Starlink link detected': 'スターリンク接続を検出',
  'Possible satellite connection': '衛星接続の可能性',
  'Roaming': 'ローミング',
  'Link': 'リンク'
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>('en');

  setLang(l: Lang): void {
    this.lang.set(l);
  }

  autoDetect(): Lang {
    const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
    const l: Lang = nav.toLowerCase().startsWith('fr') ? 'fr' : nav.toLowerCase().startsWith('ja') ? 'jp' : 'en';
    this.lang.set(l);
    return l;
  }

  t(text: string, params?: Record<string, string | number>): string {
    if (this.lang() === 'en') return this.interpolate(text, params);
    const map = this.lang() === 'fr' ? FR : JP;
    return this.interpolate(map[text] ?? text, params);
  }

  private interpolate(s: string, params?: Record<string, string | number>): string {
    if (!params) return s;
    let out = s;
    for (const k of Object.keys(params)) out = out.replace(`{${k}}`, String(params[k]));
    return out;
  }
}
