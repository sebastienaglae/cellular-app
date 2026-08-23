/**
 * Offline MCC/MNC database (starter set covering major operators + MVNOs worldwide).
 * Tuple: [mcc, mnc, brandName, hostNetworkBrand?]
 * hostNetworkBrand present => MVNO (rides on that host radio network).
 * Extend freely; import/export supported in Settings.
 */

export type PlmnEntry = [string, string, string, string?];

export const PLMN_DB: PlmnEntry[] = [
  // ---- United States (310-316) ----
  ['310', '260', 'T-Mobile US'],
  ['310', '250', 'T-Mobile US'], // legacy Sprint CDMA block
  ['310', '120', 'Sprint'],
  ['310', '410', 'AT&T'],
  ['310', '150', 'AT&T'],
  ['310', '030', 'AT&T'],
  ['310', '560', 'Verizon'], // legacy
  ['310', '004', 'Verizon'],
  ['310', '012', 'Verizon'],
  ['311', '480', 'Verizon'],
  ['310', '090', 'CTExcel / T-Mobile MVNO', 'T-Mobile US'],
  ['310', '160', 'Project Fi / Google Fi', 'T-Mobile US'],
  ['310', '170', 'Twilio', 'T-Mobile US'],
  ['310', '240', 'Ultra Mobile', 'T-Mobile US'],
  ['310', '280', 'Consumer Cellular', 'AT&T'],
  ['310', '290', 'Lyca US', 'T-Mobile US'],
  ['310', '350', 'Kajeet', 'T-Mobile US'],
  ['310', '420', 'Google Fi', 'T-Mobile US'],
  ['310', '660', 'TracFone', 'T-Mobile US'],
  ['310', '890', 'Straight Talk', 'T-Mobile US'],
  ['311', '660', 'Metro by T-Mobile', 'T-Mobile US'],
  ['311', '490', 'Visible', 'Verizon'],
  ['312', '530', 'Xfinity Mobile', 'Verizon'],
  ['310', '140', 'US Cellular MVNO?', null],
  ['311', '220', 'UScellular'],
  ['312', '250', 'Boost Mobile (Dish)'],
  ['316', '010', 'AT&T FirstNet'],
  // ---- Canada (302) ----
  ['302', '610', 'Bell'],
  ['302', '640', 'Telus'],
  ['302', '720', 'Rogers'],
  ['302', '370', 'Fido', 'Rogers'],
  ['302', '320', 'Chatr', 'Rogers'],
  ['302', '220', 'Koodo', 'Telus'],
  ['302', '221', 'Solo Mobile', 'Bell'],
  ['302', '500', 'Videotron'],
  ['302', '510', 'Freedom Mobile'],
  ['302', '760', 'Public Mobile', 'Telus'],
  // ---- Mexico (334) ----
  ['334', '020', 'Telcel'],
  ['334', '050', 'Movistar MX'],
  ['334', '030', 'AT&T Mexico'],
  ['334', '140', 'Oui Movil', 'AT&T Mexico'],
  // ---- Brazil (724) ----
  ['724', '05', 'Vivo BR'],
  ['724', '06', 'Vivo BR'],
  ['724', '03', 'TIM Brasil'],
  ['724', '31', 'Claro BR'],
  ['724', '02', 'Oi'],
  // ---- Argentina (722) ----
  ['722', '341', 'Personal AR'],
  ['722', '320', 'Movistar AR'],
  ['722', '70', 'Claro AR'],
  // ---- Chile (730) ----
  ['730', '01', 'Entel CL'],
  ['730', '02', 'Telefonica Chile'],
  ['730', '07', 'Movistar CL'],
  ['730', '10', 'WOM'],
  ['730', '03', 'Claro CL'],
  // ---- Colombia (732) ----
  ['732', '101', 'Claro CO'],
  ['732', '123', 'Movistar CO'],
  ['732', '103', 'Tigo Colombia'],
  // ---- Peru (716) ----
  ['716', '06', 'Claro PE'],
  ['716', '10', 'Movistar PE'],
  ['716', '15', 'Bitel'],
  ['716', '17', 'WOM Peru'],
  // ---- UK (234/235) ----
  ['234', '15', 'Vodafone UK'],
  ['234', '10', 'O2 UK'],
  ['234', '30', 'EE'],
  ['234', '20', 'Three UK'],
  ['234', '31', 'Virgin Media O2', 'O2 UK'],
  ['234', '32', 'Virgin Mobile', 'EE'],
  ['234', '33', 'Giffgaff', 'O2 UK'],
  ['234', '50', 'JT Jersey'],
  ['234', '86', 'Sky Mobile', 'O2 UK'],
  ['235', '94', 'Tesco Mobile', 'O2 UK'],
  ['235', '77', 'BT Mobile', 'EE'],
  ['234', '58', 'Palm / Wirex MVNO', null],
  ['234', '09', 'Lyca Mobile UK'],
  ['234', '26', 'Lebara UK'],
  ['234', '18', 'Smarty', 'Three UK'],
  ['234', '91', 'VOXI', 'Vodafone UK'],
  ['234', '38', '1pMobile', 'EE'],
  // ---- Ireland (272) ----
  ['272', '01', 'Vodafone IE'],
  ['272', '02', 'Three Ireland'],
  ['272', '05', 'Eir'],
  ['272', '13', '48 Months', 'Three Ireland'],
  // ---- France (208) ----
  ['208', '01', 'Orange FR'],
  ['208', '10', 'SFR'],
  ['208', '15', 'Free Mobile'],
  ['208', '20', 'Bouygues Telecom'],
  ['208', '26', 'Prixtel', 'SFR'],
  ['208', '22', 'CIC Mobile', 'Orange FR'],
  ['208', '29', 'La Poste Mobile', 'Bouygues Telecom'],
  // ---- Spain (214) ----
  ['214', '01', 'Vodafone ES'],
  ['214', '07', 'Movistar ES'],
  ['214', '03', 'Orange ES'],
  ['214', '04', 'Yoigo'],
  ['214', '19', 'Simyo', 'Orange ES'],
  ['214', '23', 'Orange ES (ex-Jazztel)'],
  ['214', '21', 'Jazztel', 'Orange ES'],
  ['214', '17', 'Lebara ES'],
  ['214', '05', 'Lycamobile ES', 'Movistar ES'],
  ['214', '06', 'Vodafone ES (ex-ONO)'],
  // ---- Portugal (268) ----
  ['268', '01', 'Vodafone PT'],
  ['268', '03', 'NOS'],
  ['268', '06', 'MEO'],
  // ---- Germany (262) ----
  ['262', '01', 'Telekom DE'],
  ['262', '02', 'Vodafone DE'],
  ['262', '03', 'Telekom DE (D2)', null],
  ['262', '07', 'O2 DE'],
  ['262', '05', 'E-Plus legacy'],
  ['262', '09', 'Vodafone DE'],
  ['262', '11', 'O2 DE'],
  ['262', '42', 'Aldi Talk', 'Telekom DE'],
  ['262', '08', 'Blau', 'Telekom DE'],
  ['262', '20', 'Lycamobile DE'],
  ['262', '14', 'Congstar', 'Telekom DE'],
  ['262', '23', '1&1 Versatel'],
  // ---- Netherlands (204) ----
  ['204', '04', 'Vodafone NL'],
  ['204', '08', 'KPN'],
  ['204', '16', 'T-Mobile NL'],
  ['204', '20', 'Simyo NL', 'KPN'],
  ['204', '07', 'Tele2 NL', 'T-Mobile NL'],
  ['204', '68', 'Youfone', 'KPN'],
  // ---- Belgium (206) ----
  ['206', '01', 'Proximus'],
  ['206', '10', 'Orange BE'],
  ['206', '20', 'BASE / Telenet'],
  // ---- Switzerland (228) ----
  ['228', '01', 'Swisscom'],
  ['228', '02', 'Sunrise'],
  ['228', '03', 'Salt CH'],
  ['228', '12', 'M-Budget Mobile', 'Swisscom'],
  // ---- Austria (232) ----
  ['232', '01', 'A1 Telekom AT'],
  ['232', '05', 'Magenta AT (T-Mobile)'],
  ['232', '03', 'Magenta AT'],
  ['232', '11', 'Hutchison Drei AT'],
  ['232', '12', 'HoT Hofer Telekom', 'Magenta AT'],
  // ---- Italy (222) ----
  ['222', '01', 'TIM Italia'],
  ['222', '10', 'Vodafone IT'],
  ['222', '99', 'WindTre'],
  ['222', '88', 'Iliad Italia'],
  ['222', '50', 'Fastweb'],
  ['222', '02', 'PosteMobile', 'Vodafone IT'],
  ['222', '07', 'ho-mobile.', 'Vodafone IT'],
  ['222', '43', 'Very Mobile', 'WindTre'],
  // ---- Greece (202) ----
  ['202', '01', 'Cosmote GR'],
  ['202', '05', 'Vodafone GR'],
  ['202', '10', 'Nova GR'],
  // ---- Poland (260) ----
  ['260', '01', 'Plus PL'],
  ['260', '02', 'T-Mobile PL'],
  ['260', '03', 'Orange PL'],
  ['260', '06', 'Play PL'],
  ['260', '12', 'nju mobile', 'Orange PL'],
  // ---- Czechia (230) ----
  ['230', '01', 'T-Mobile CZ'],
  ['230', '02', 'Telefónica CZ (O2)'],
  ['230', '03', 'Vodafone CZ'],
  // ---- Hungary (216) ----
  ['216', '01', 'T-Mobile HU'],
  ['216', '70', 'Yettel HU (Telenor)'],
  ['216', '30', 'One HU (Vodafone)'],
  // ---- Romania (226) ----
  ['226', '01', 'Vodafone RO'],
  ['226', '10', 'Orange RO'],
  ['226', '05', 'Digi Mobil'],
  ['226', '06', 'Telekom RO'],
  // ---- Sweden (240) ----
  ['240', '01', 'Telia SE'],
  ['240', '02', 'Tele2 SE'],
  ['240', '04', 'Telenor SE'],
  ['240', '07', 'Telia SE'],
  ['240', '08', 'Halebop', 'Telia SE'],
  // ---- Norway (242) ----
  ['242', '01', 'Telenor NO'],
  ['242', '02', 'Telia NO'],
  ['242', '05', 'Ice NO'],
  // ---- Denmark (238) ----
  ['238', '01', 'TDC / YouSee DK'],
  ['238', '02', 'Telenor DK'],
  ['238', '06', 'Telia DK'],
  ['238', '20', 'Telia/Telenor DK'],
  // ---- Finland (244) ----
  ['244', '05', 'Elisa FI'],
  ['244', '91', 'Telia FI'],
  ['244', '21', 'DNA FI'],
  // ---- Baltic (246/247/248) ----
  ['246', '01', 'LMT LV'],
  ['246', '02', 'Tele2 LV'],
  ['247', '01', 'LMT LT? Bite', null],
  ['247', '02', 'Bite LT'],
  ['247', '05', 'Telia LT'],
  ['248', '01', 'Telia EE'],
  ['248', '02', 'Elisa EE'],
  ['248', '03', 'Tele2 EE'],
  // ---- Ukraine/Russia/Belarus ----
  ['255', '03', 'Kyivstar UA'],
  ['255', '06', 'lifecell UA'],
  ['255', '21', 'Vodafone UA'],
  ['250', '01', 'MTS RU'],
  ['250', '02', 'MegaFon RU'],
  ['250', '20', 'Tele2 RU'],
  ['250', '99', 'Beeline RU'],
  ['257', '01', 'Velcom BY'],
  ['257', '04', 'mts BY'],
  // ---- Turkey (286) ----
  ['286', '01', 'Turkcell'],
  ['286', '02', 'Vodafone TR'],
  ['286', '03', 'Turk Telekom'],
  // ---- Israel (425) ----
  ['425', '01', 'Partner IL'],
  ['425', '02', 'Cellcom IL'],
  ['425', '03', 'Pelephone'],
  ['425', '05', 'Hot Mobile'],
  ['425', '07', 'Golan Telecom'],
  // ---- UAE/Saudi/Qatar/Kuwait ----
  ['420', '01', 'STC SA'],
  ['420', '03', 'Mobily SA'],
  ['420', '04', 'Zain SA'],
  ['424', '02', 'Etisalat AE'],
  ['424', '03', 'Du AE'],
  ['427', '01', 'Ooredoo QA'],
  ['427', '02', 'Vodafone QA'],
  ['419', '02', 'Ooredoo KW'],
  ['419', '03', 'STC KW'],
  ['419', '04', 'Zain KW'],
  // ---- Egypt/Morocco/Nigeria/Kenya/Ghana/Zaire... Africa majors ----
  ['602', '01', 'Orange EG? Vodafone EG', null],
  ['602', '02', 'Vodafone EG'],
  ['602', '03', 'Etisalat EG'],
  ['602', '04', 'WE Egypt'],
  ['604', '00', 'Maroc Telecom'],
  ['604', '01', 'Orange MA'],
  ['604', '02', 'inwi MA'],
  ['621', '20', 'Airtel NG'],
  ['621', '30', 'MTN NG'],
  ['621', '50', 'Glo NG'],
  ['621', '60', '9mobile NG'],
  ['639', '02', 'Safaricom KE'],
  ['639', '03', 'Airtel KE'],
  ['639', '05', 'Equitel KE'],
  ['620', '01', 'MTN GH'],
  ['620', '02', 'Vodafone/Telecel GH'],
  ['620', '06', 'AirtelTigo GH'],
  ['636', '01', 'Vodacom ZA? TZ', null],
  ['655', '01', 'Vodacom ZA'],
  ['655', '02', 'Telkom SA'],
  ['655', '07', 'Cell C ZA'],
  ['655', '10', 'MTN ZA'],
  // ---- India (404/405) ----
  ['404', '45', 'Airtel IN'],
  ['404', '02', 'Airtel IN'],
  ['404', '10', 'Airtel IN'],
  ['404', '93', 'Vodafone Idea IN'],
  ['404', '44', 'Idea IN'],
  ['405', '51', 'Jio IN'],
  ['405', '52', 'Jio IN'],
  ['405', '53', 'Jio IN'],
  ['405', '54', 'Jio IN'],
  ['405', '55', 'Jio IN'],
  ['404', '13', 'Vi IN'],
  ['404', '46', 'BSNL IN'],
  // ---- Pakistan/Bangladesh/Sri Lanka/Nepal ----
  ['410', '01', 'Mobilink/Jazz PK'],
  ['410', '03', 'Ufone PK'],
  ['410', '04', 'Zong PK'],
  ['410', '06', 'Telenor PK'],
  ['410', '07', 'Warid PK'],
  ['470', '01', 'Grameenphone BD'],
  ['470', '03', 'Banglalink BD'],
  ['470', '04', 'Teletalk BD'],
  ['413', '02', 'Dialog LK'],
  ['413', '03', 'Mobitel LK'],
  ['413', '05', 'Airtel LK'],
  ['429', '01', 'NTC NP'],
  ['429', '02', 'Ncell NP'],
  // ---- China (460) ----
  ['460', '00', 'China Mobile'],
  ['460', '01', 'China Unicom'],
  ['460', '02', 'China Mobile'],
  ['460', '03', 'China Telecom'],
  ['460', '04', 'China Global Net'],
  ['460', '05', 'China Telecom'],
  ['460', '06', 'China Unicom'],
  ['460', '07', 'China Mobile'],
  ['460', '11', 'China Telecom'],
  ['460', '15', 'China Unicom'],
  ['460', '20', 'China Railcom'],
  // ---- Hong Kong / Macau (454/455) ----
  ['454', '00', 'CSL HK'],
  ['454', '03', '3HK'],
  ['454', '04', 'HKBN'],
  ['454', '12', 'CMCC HK'],
  ['454', '15', 'SmarTone HK'],
  ['455', '00', 'CTM Macau'],
  ['455', '03', 'SmarTone Macau'],
  // ---- Taiwan (466) ----
  ['466', '01', 'FarEasTone TW'],
  ['466', '92', 'Chunghwa TW'],
  ['466', '88', 'Taiwan Mobile'],
  ['466', '97', 'Taiwan Star'],
  // ---- South Korea (450) ----
  ['450', '05', 'SK Telecom KR'],
  ['450', '06', 'KT KR'],
  ['450', '08', 'KT KR'],
  ['450', '04', 'LG U+'],
  // ---- Japan (440/441) ----
  ['440', '10', 'NTT Docomo'],
  ['440', '01', 'Docomo? KDDI au', null],
  ['440', '20', 'SoftBank JP'],
  ['440', '40', 'au KDDI JP'],
  ['440', '50', 'au KDDI JP'],
  ['440', '51', 'au KDDI JP'],
  ['441', '70', 'Rakuten JP'],
  ['440', '53', 'UQ Mobile JP'],
  // ---- Australia (505) ----
  ['505', '01', 'Telstra AU'],
  ['505', '02', 'Optus AU'],
  ['505', '03', 'Vodafone AU'],
  ['505', '71', 'TPG/Vodafone AU'],
  ['505', '38', 'Virgin AU', 'Optus AU'],
  ['505', '88', 'ALDImobile', 'Telstra AU'],
  ['505', '99', 'Amaysim', 'Optus AU'],
  // ---- New Zealand (530) ----
  ['530', '01', 'One NZ (Vodafone)'],
  ['530', '05', 'Spark NZ'],
  ['530', '24', '2degrees NZ'],
  ['530', '28', 'Skinny NZ', 'Spark NZ'],
  // ---- Southeast Asia ----
  ['502', '12', 'Maxis MY'],
  ['502', '13', 'Celcom MY'],
  ['502', '16', 'DiGi my'],
  ['502', '19', 'U Mobile MY'],
  ['515', '02', 'Globe PH'],
  ['515', '03', 'Smart PH'],
  ['515', '05', 'DITO PH'],
  ['515', '11', 'Smart PH'],
  ['515', '18', 'Globe PH'],
  ['510', '01', 'Indosat ID'],
  ['510', '10', 'Telkomsel ID'],
  ['510', '11', 'XL Axiata ID'],
  ['510', '89', 'Tri ID'],
  ['520', '01', 'AIS TH'],
  ['520', '05', 'True TH'],
  ['520', '18', 'True Move TH'],
  ['520', '23', 'AIS TH'],
  ['452', '01', 'Mobifone VN'],
  ['452', '02', 'Vinaphone VN'],
  ['452', '04', 'Viettel VN'],
  ['452', '05', 'Vietnamobile VN'],
  ['525', '01', 'Singtel SG'],
  ['525', '02', 'StarHub SG'],
  ['525', '05', 'M1 SG'],
  ['525', '03', 'SIMBA SG'],
  // ---- Central Asia ----
  ['437', '01', 'Beeline KG'],
  ['437', '03', 'O! KG'],
  ['438', '01', 'TMCELL TJ'],
  ['434', '01', 'Uzmobile UZ'],
  ['434', '05', 'Ucell UZ'],
  ['434', '07', 'UMS UZ'],
  ['401', '01', 'Kcell KZ'],
  ['401', '02', 'Kcell KZ'],
  ['401', '77', 'Tele2 KZ']
];

export const MCC_COUNTRY: { [mcc: string]: [string, string] } = {
  // mcc -> [country name, ISO2]
  '202': ['Greece', 'GR'], '204': ['Netherlands', 'NL'], '206': ['Belgium', 'BE'],
  '208': ['France', 'FR'], '214': ['Spain', 'ES'], '216': ['Hungary', 'HU'],
  '218': ['Bosnia & Herzegovina', 'BA'], '219': ['Croatia', 'HR'], '220': ['Serbia', 'RS'],
  '222': ['Italy', 'IT'], '226': ['Romania', 'RO'], '228': ['Switzerland', 'CH'],
  '230': ['Czechia', 'CZ'], '231': ['Slovakia', 'SK'], '232': ['Austria', 'AT'],
  '235': ['United Kingdom', 'GB'], '238': ['Denmark', 'DK'], '240': ['Sweden', 'SE'],
  '242': ['Norway', 'NO'], '244': ['Finland', 'FI'], '246': ['Latvia', 'LV'],
  '247': ['Lithuania', 'LT'], '248': ['Estonia', 'EE'], '250': ['Russia', 'RU'],
  '255': ['Ukraine', 'UA'], '257': ['Belarus', 'BY'], '259': ['Moldova', 'MD'],
  '262': ['Germany', 'DE'], '268': ['Portugal', 'PT'], '270': ['Montenegro', 'ME'],
  '272': ['Ireland', 'IE'], '276': ['Albania', 'AL'], '286': ['Türkiye', 'TR'],
  '288': ['Faroe Islands', 'FO'], '290': ['Greenland', 'GL'], '294': ['North Macedonia', 'MK'],
  '295': ['Liechtenstein', 'LI'], '302': ['Canada', 'CA'], '308': ['Saint Pierre', 'PM'],
  '310': ['United States', 'US'], '311': ['United States', 'US'], '312': ['United States', 'US'],
  '313': ['United States', 'US'], '314': ['United States', 'US'], '315': ['United States', 'US'],
  '316': ['United States', 'US'], '330': ['Puerto Rico', 'PR'], '334': ['Mexico', 'MX'],
  '340': ['Guadeloupe', 'GP'], '342': ['Barbados', 'BB'], '344': ['Antigua', 'AG'],
  '346': ['Cayman Islands', 'KY'], '348': ['British Virgin Is.', 'VG'], '352': ['Grenada', 'GD'],
  '364': ['Curaçao', 'CW'], '366': ['Saint Lucia', 'LC'], '370': ['Dominican Rep.', 'DO'],
  '372': ['Jamaica', 'JM'], '374': ['Trinidad & Tobago', 'TT'],   '401': ['Kazakhstan', 'KZ'],
  '402': ['Bhutan', 'BT'], '404': ['India', 'IN'], '405': ['India', 'IN'],
  '410': ['Pakistan', 'PK'], '412': ['Afghanistan', 'AF'], '413': ['Sri Lanka', 'LK'],
  '414': ['Myanmar', 'MM'], '415': ['Cambodia', 'KH'], '416': ['Laos', 'LA'],
  '417': ['Syria', 'SY'], '418': ['Iraq', 'IQ'], '419': ['Kuwait', 'KW'],
  '420': ['Saudi Arabia', 'SA'], '421': ['Yemen', 'YE'], '422': ['Oman', 'OM'],
  '424': ['United Arab Emirates', 'AE'], '425': ['Israel', 'IL'], '426': ['Bahrain', 'BH'],
  '427': ['Qatar', 'QA'],   '428': ['Mongolia', 'MN'], '429': ['Nepal', 'NP'],
  '432': ['Iran', 'IR'], '434': ['Uzbekistan', 'UZ'],
  '436': ['Tajikistan', 'TJ'], '437': ['Kyrgyzstan', 'KG'], '438': ['Turkmenistan', 'TM'],
  '440': ['Japan', 'JP'], '441': ['Japan', 'JP'], '450': ['South Korea', 'KR'],
  '452': ['Vietnam', 'VN'], '454': ['Hong Kong', 'HK'], '455': ['Macau', 'MO'],
  '456': ['Cambodia', 'KH'], '457': ['Laos', 'LA'], '460': ['China', 'CN'],
  '461': ['China', 'CN'], '466': ['Taiwan', 'TW'], '467': ['North Korea', 'KP'],
  '470': ['Bangladesh', 'BD'], '472': ['Maldives', 'MV'], '502': ['Malaysia', 'MY'],
  '505': ['Australia', 'AU'], '510': ['Indonesia', 'ID'], '514': ['Timor-Leste', 'TL'],
  '515': ['Philippines', 'PH'], '520': ['Thailand', 'TH'], '525': ['Singapore', 'SG'],
  '528': ['Brunei', 'BN'], '530': ['New Zealand', 'NZ'], '534': ['Northern Mariana', 'MP'],
  '535': ['Guam', 'GU'], '536': ['Nauru', 'NR'], '537': ['Papua New Guinea', 'PG'],
  '539': ['Cook Islands', 'CK'], '540': ['Solomon Islands', 'SB'], '541': ['Vanuatu', 'VU'],
  '542': ['Fiji', 'FJ'], '544': ['American Samoa', 'AS'], '546': ['French Polynesia', 'PF'],
  '547': ['Wallis & Futuna', 'WF'], '548': ['Kiribati', 'KI'], '550': ['Micronesia', 'FM'],
  '551': ['Marshall Islands', 'MH'], '552': ['Palau', 'PW'], '553': ['New Caledonia', 'NC'],
  '555': ['Niue', 'NU'], '602': ['Egypt', 'EG'], '603': ['Algeria', 'DZ'],
  '604': ['Morocco', 'MA'], '605': ['Tunisia', 'TN'], '606': ['Libya', 'LY'],
  '607': ['Gambia', 'GM'], '608': ['Senegal', 'SN'], '609': ['Mauritania', 'MR'],
  '610': ['Mali', 'ML'], '611': ['Guinea', 'GN'], '612': ["Côte d'Ivoire", 'CI'],
  '613': ['Burkina Faso', 'BF'], '614': ['Niger', 'NE'], '615': ['Togo', 'TG'],
  '616': ['Benin', 'BJ'], '617': ['Mauritius', 'MU'], '618': ['Liberia', 'LR'],
  '619': ['Sierra Leone', 'SL'], '620': ['Ghana', 'GH'], '621': ['Nigeria', 'NG'],
  '622': ['Chad', 'TD'], '623': ['Central African Rep.', 'CF'], '624': ['Cameroon', 'CM'],
  '625': ['Cape Verde', 'CV'], '626': ['São Tomé', 'ST'], '627': ['Eq. Guinea', 'GQ'],
  '628': ['Gabon', 'GA'], '629': ['Congo', 'CG'], '630': ['DR Congo', 'CD'],
  '631': ['Angola', 'AO'], '632': ['Guinea-Bissau', 'GW'], '633': ['Seychelles', 'SC'],
  '634': ['Sudan', 'SD'], '635': ['Rwanda', 'RW'], '636': ['Ethiopia', 'ET'],
  '637': ['Eritrea', 'ER'], '638': ['Djibouti', 'DJ'], '639': ['Kenya', 'KE'],
  '640': ['Tanzania', 'TZ'], '641': ['Uganda', 'UG'], '642': ['Burundi', 'BI'],
  '643': ['Mozambique', 'MZ'], '645': ['Zambia', 'ZM'], '646': ['Madagascar', 'MG'],
  '647': ['Réunion', 'RE'], '648': ['Zimbabwe', 'ZW'], '649': ['Namibia', 'NA'],
  '650': ['Malawi', 'MW'], '651': ['Lesotho', 'LS'], '652': ['Botswana', 'BW'],
  '653': ['Eswatini', 'SZ'], '654': ['Comoros', 'KM'], '655': ['South Africa', 'ZA'],
  '657': ['Eritrea', 'ER'], '658': ['St Helena', 'SH'], '659': ['Namibia', 'NA'],
  '702': ['Belize', 'BZ'], '704': ['Guatemala', 'GT'], '706': ['El Salvador', 'SV'],
  '708': ['Honduras', 'HN'], '710': ['Nicaragua', 'NI'], '712': ['Costa Rica', 'CR'],
  '714': ['Panama', 'PA'], '716': ['Peru', 'PE'], '722': ['Argentina', 'AR'],
  '724': ['Brazil', 'BR'], '730': ['Chile', 'CL'], '732': ['Colombia', 'CO'],
  '734': ['Venezuela', 'VE'], '736': ['Bolivia', 'BO'], '738': ['Guyana', 'GY'],
  '740': ['Suriname', 'SR'], '742': ['French Guiana', 'GF'], '744': ['Paraguay', 'PY'],
  '746': ['Aruba', 'AW'], '748': ['Uruguay', 'UY']
};

export interface OperatorInfo {
  mcc: string;
  mnc: string;
  plmn: string;
  name: string;
  country?: string;
  iso?: string;
  mvnoHost?: string | null;
}

export function lookupPlmn(mcc: string, mnc: string): OperatorInfo | null {
  if (!mcc) return null;
  const mncPad = mnc ? mnc.padStart(3, '0') : '';
  const e =
    PLMN_DB.find(x => x[0] === mcc && x[1] === mnc) ||
    PLMN_DB.find(x => x[0] === mcc && mncPad && x[1] === String(parseInt(mncPad, 10))) ||
    PLMN_DB.find(x => x[0] === mcc && x[1].length === 2 && x[1] === mncPad.slice(0, 2));
  const c = MCC_COUNTRY[mcc];
  return {
    mcc,
    mnc,
    plmn: `${mcc}-${mnc}`,
    name: e ? e[2] : `Unknown (${mcc}-${mnc})`,
    country: c ? c[0] : undefined,
    iso: c ? c[1] : undefined,
    mvnoHost: e && e[3] ? e[3] : undefined
  };
}

export function searchPlmn(q: string): OperatorInfo[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return PLMN_DB.filter(e =>
    e[2].toLowerCase().includes(s) || `${e[0]}${e[1]}`.includes(s)
  )
    .slice(0, 60)
    .map(e => {
      const c = MCC_COUNTRY[e[0]];
      return {
        mcc: e[0], mnc: e[1], plmn: `${e[0]}-${e[1]}`, name: e[2],
        country: c?.[0], iso: c?.[1], mvnoHost: e[3]
      };
    });
}
