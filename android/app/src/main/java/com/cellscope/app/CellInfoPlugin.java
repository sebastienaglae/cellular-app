package com.cellscope.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.DhcpInfo;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.telephony.CellIdentityCdma;
import android.telephony.CellIdentityGsm;
import android.telephony.CellIdentityLte;
import android.telephony.CellIdentityNr;
import android.telephony.CellIdentityWcdma;
import android.telephony.CellInfo;
import android.telephony.CellInfoCdma;
import android.telephony.CellInfoGsm;
import android.telephony.CellInfoLte;
import android.telephony.CellInfoNr;
import android.telephony.CellInfoWcdma;
import android.telephony.CellSignalStrengthCdma;
import android.telephony.CellSignalStrengthGsm;
import android.telephony.CellSignalStrengthLte;
import android.telephony.CellSignalStrengthNr;
import android.telephony.CellSignalStrengthWcdma;
import android.telephony.ServiceState;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@CapacitorPlugin(name = "CellInfo", permissions = {
    @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }, alias = "location"),
    @Permission(strings = { Manifest.permission.READ_PHONE_STATE }, alias = "phone")
})
public class CellInfoPlugin extends Plugin {

    // ------------------------------------------------------------------ util

    private boolean has(String perm) {
        return getActivity() != null &&
            getActivity().checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED;
    }

    private Object reflect(Object target, String method) {
        if (target == null) return null;
        try {
            Method m = target.getClass().getMethod(method);
            m.setAccessible(true);
            return m.invoke(target);
        } catch (Throwable t) {
            return null;
        }
    }

    private Integer asInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        try {
            String s = o.toString().replace("[", "").replace("]", "").trim();
            if (s.isEmpty()) return null;
            return Integer.parseInt(s.split(",")[0].trim());
        } catch (Throwable t) {
            return null;
        }
    }

    private JSArray asBandArray(Object o) {
        JSArray arr = new JSArray();
        try {
            if (o instanceof int[]) {
                for (int v : (int[]) o) arr.put(v);
            } else if (o instanceof Number[]) {
                for (Number v : (Number[]) o) arr.put(v.intValue());
            } else if (o instanceof List) {
                for (Object v : (List<?>) o) {
                    Integer i = asInt(v);
                    if (i != null) arr.put(i);
                }
            } else if (o != null && o.toString().contains(",")) {
                for (String p : o.toString().replace("[", "").replace("]", "").split(",")) {
                    arr.put(Integer.parseInt(p.trim()));
                }
            } else {
                Integer one = asInt(o);
                if (one != null) arr.put(one);
            }
        } catch (Throwable ignored) {
        }
        return arr;
    }

    // ----------------------------------------------------------- permissions

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject o = new JSObject();
        o.put("location", has(Manifest.permission.ACCESS_FINE_LOCATION));
        o.put("phone", Build.VERSION.SDK_INT >= 33 || has(Manifest.permission.READ_PHONE_STATE));
        call.resolve(o);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        boolean fine = has(Manifest.permission.ACCESS_FINE_LOCATION);
        boolean phone = Build.VERSION.SDK_INT >= 33 || has(Manifest.permission.READ_PHONE_STATE);
        if (fine && phone) {
            call.resolve(granted(true));
            return;
        }
        requestPermissionForAliases(new String[]{"location", "phone"}, call, "handlePermResult");
    }

    @PermissionCallback
    public void handlePermResult(PluginCall call) {
        call.resolve(granted(has(Manifest.permission.ACCESS_FINE_LOCATION)));
    }

    private Boolean reflectBool(Object target, String method) {
        Object r = reflect(target, method);
        return r instanceof Boolean ? (Boolean) r : null;
    }

    private JSObject granted(boolean ok) {
        JSObject o = new JSObject();
        o.put("granted", ok);
        return o;
    }

    // ------------------------------------------------------------ cell info

    @PluginMethod
    public void getAllCellInfo(PluginCall call) {
        JSArray out = new JSArray();
        try {
            TelephonyManager tm = tm();
            List<CellInfo> infos = tm.getAllCellInfo();
            if (infos != null) {
                for (CellInfo ci : infos) {
                    try {
                        JSObject c = mapCell(ci);
                        if (c != null) out.put(c);
                    } catch (Throwable ignored) {
                    }
                }
            }
        } catch (SecurityException se) {
            call.reject("Location permission required for cell info");
            return;
        } catch (Throwable t) {
            call.reject(t.getMessage());
            return;
        }
        JSObject res = new JSObject();
        res.put("cells", out);
        call.resolve(res);
    }

    private TelephonyManager tm() {
        return (TelephonyManager) getContext().getSystemService(Context.TELEPHONY_SERVICE);
    }

    private JSObject mapCell(CellInfo ci) throws Throwable {
        JSObject c = new JSObject();
        c.put("registered", ci.isRegistered());
        long ts = 0;
        try {
            ts = ci.getTimeStamp();
        } catch (Throwable ignored) {
        }
        c.put("timestamp", ts > 0 ? ts / 1000L : System.currentTimeMillis());

        if (Build.VERSION.SDK_INT >= 29 && ci instanceof CellInfoNr) {
            CellInfoNr nr = (CellInfoNr) ci;
            c.put("tech", "NR");
            CellIdentityNr id = (CellIdentityNr) nr.getCellIdentity();
            if (id != null) {
                c.put("arfcn", id.getNrarfcn());
                Long nci = null;
                try {
                    nci = id.getNci();
                } catch (Throwable ignored) {
                }
                c.put("cid", nci);
                c.put("tac", id.getTac());
                c.put("pci", id.getPci());
                Object mcc = null, mnc = null;
                try {
                    mcc = id.getMccString();
                    mnc = id.getMncString();
                } catch (Throwable ignored) {
                }
                c.put("mcc", mcc);
                c.put("mnc", mnc);
                c.put("bands", asBandArray(reflect(id, "getBands")));
            }
            if (nr.getCellSignalStrength() instanceof CellSignalStrengthNr) {
                CellSignalStrengthNr s = (CellSignalStrengthNr) nr.getCellSignalStrength();
                putIfNotNull(c, "rsrp", s.getSsRsrp());
                putIfNotNull(c, "rsrq", s.getSsRsrq());
                putIfNotNull(c, "sinr", s.getSsSinr());
                putIfNotNull(c, "rssi", null);
                putIfNotNull(c, "dbm", s.getDbm());
            }
            return c;
        }

        if (ci instanceof CellInfoLte) {
            CellInfoLte lte = (CellInfoLte) ci;
            c.put("tech", "LTE");
            CellIdentityLte id = lte.getCellIdentity();
            if (id != null) {
                c.put("arfcn", id.getEarfcn());
                c.put("pci", id.getPci());
                Integer ciVal = null;
                try {
                    ciVal = id.getCi();
                } catch (Throwable ignored) {
                }
                c.put("cid", ciVal);
                c.put("tac", id.getTac());
                Object mcc = null, mnc = null;
                try {
                    mcc = id.getMccString();
                    mnc = id.getMncString();
                } catch (Throwable ignored) {
                }
                c.put("mcc", mcc);
                c.put("mnc", mnc);
                if (Build.VERSION.SDK_INT >= 29) {
                    try {
                        c.put("bandwidthMhz", id.getBandwidth() / 1000);
                    } catch (Throwable ignored) {
                    }
                }
                c.put("bands", asBandArray(reflect(id, "getBands")));
            }
            CellSignalStrengthLte s = lte.getCellSignalStrength();
            if (s != null) {
                putIfNotNull(c, "rsrp", s.getRsrp());
                putIfNotNull(c, "rsrq", s.getRsrq());
                putIfNotNull(c, "rssi", s.getRssi());
                putIfNotNull(c, "sinr", s.getRssnr());
                putIfNotNull(c, "dbm", s.getDbm());
                if (Build.VERSION.SDK_INT >= 28) putIfNotNull(c, "timingAdvance", s.getTimingAdvance());
            }
            return c;
        }

        if (ci instanceof CellInfoGsm) {
            CellInfoGsm g = (CellInfoGsm) ci;
            c.put("tech", "GSM");
            CellIdentityGsm id = g.getCellIdentity();
            if (id != null) {
                c.put("arfcn", id.getArfcn());
                c.put("cid", id.getCid());
                c.put("tac", id.getLac());
                Object mcc = null, mnc = null;
                try {
                    mcc = id.getMccString();
                    mnc = id.getMncString();
                } catch (Throwable ignored) {
                }
                c.put("mcc", mcc);
                c.put("mnc", mnc);
            }
            CellSignalStrengthGsm s = g.getCellSignalStrength();
            if (s != null) {
                putIfNotNull(c, "dbm", s.getDbm());
                if (Build.VERSION.SDK_INT >= 30) putIfNotNull(c, "rssi", s.getRssi());
            }
            return c;
        }

        if (ci instanceof CellInfoWcdma) {
            CellInfoWcdma w = (CellInfoWcdma) ci;
            c.put("tech", "WCDMA");
            CellIdentityWcdma id = w.getCellIdentity();
            if (id != null) {
                c.put("arfcn", id.getUarfcn());
                c.put("pci", id.getPsc());
                c.put("cid", id.getCid());
                c.put("tac", id.getLac());
                Object mcc = null, mnc = null;
                try {
                    mcc = id.getMccString();
                    mnc = id.getMncString();
                } catch (Throwable ignored) {
                }
                c.put("mcc", mcc);
                c.put("mnc", mnc);
            }
            CellSignalStrengthWcdma s = w.getCellSignalStrength();
            if (s != null) putIfNotNull(c, "dbm", s.getDbm());
            return c;
        }

        if (ci instanceof CellInfoCdma) {
            CellInfoCdma cd = (CellInfoCdma) ci;
            c.put("tech", "CDMA");
            CellIdentityCdma id = cd.getCellIdentity();
            if (id != null) c.put("cid", id.getBasestationId());
            CellSignalStrengthCdma s = cd.getCellSignalStrength();
            if (s != null) putIfNotNull(c, "dbm", s.getDbm());
            return c;
        }

        // generic fallback: at least expose technology string + dbm
        c.put("tech", ci.getClass().getSimpleName().replace("CellInfo", "").toUpperCase(Locale.US));
        try {
            Method dbmM = ci.getCellSignalStrength().getClass().getMethod("getDbm");
            putIfNotNull(c, "dbm", asInt(dbmM.invoke(ci.getCellSignalStrength())));
        } catch (Throwable ignored) {
        }
        return c;
    }

    private void putIfNotNull(JSObject o, String k, Integer v) {
        if (v != null && v != Integer.MAX_VALUE && v != -Integer.MAX_VALUE) o.put(k, v);
    }

    // ---------------------------------------------------------- service state

    @PluginMethod
    public void getServiceState(PluginCall call) {
        JSObject o = new JSObject();
        try {
            TelephonyManager tm = tm();
            ServiceState ss = tm.getServiceState();
            o.put("operatorName", safe(tm::getNetworkOperatorName));
            o.put("operatorNumeric", safe(tm::getNetworkOperator));
            o.put("isoCountry", safe(tm::getNetworkCountryIso));

            boolean roaming = false;
            try {
                roaming = tm.isNetworkRoaming();
            } catch (Throwable ignored) {
            }
            o.put("roaming", roaming);

            int dataTech = 0;
            try {
                dataTech = tm.getDataNetworkType();
            } catch (Throwable ignored) {
            }
            o.put("dataTechInt", dataTech);

            Integer voiceReg = null, dataReg = null;
            Boolean manual = null, emergency = null;
            if (ss != null) {
                voiceReg = asInt(reflect(ss, "getVoiceRegState"));
                if (voiceReg == null) voiceReg = asInt(reflect(ss, "getState"));
                dataReg = asInt(reflect(ss, "getDataRegState"));
                manual = reflectBool(ss, "getIsManualSelection");
                emergency = reflectBool(ss, "isEmergencyOnly");
            }
            o.put("voiceRegState", voiceReg);
            o.put("dataRegState", dataReg);
            o.put("isManualSelection", manual);
            o.put("emergencyOnly", emergency);

            boolean ntn = false;
            boolean ntnResolved = false;
            if (ss != null && Build.VERSION.SDK_INT >= 34) {
                try {
                    Method m = ServiceState.class.getMethod("isUsingNonTerrestrialNetwork");
                    Object r = m.invoke(ss);
                    if (r instanceof Boolean) {
                        ntn = (Boolean) r;
                        ntnResolved = true;
                    }
                } catch (Throwable ignored) {
                }
            }
            String sLow = ss != null ? ss.toString().toLowerCase(Locale.US) : "";
            if (!ntnResolved) {
                // strict field-value match only ("isNonTerrestrialNetwork=TRUE"),
                // never a loose contains("true") which other fields trigger
                ntn = sLow.contains("nonterrestrialnetwork=true") || sLow.contains("isntn=true");
            }
            o.put("nrAvailable", sLow.contains("isnravailable=true"));
            o.put("endc", sLow.matches("(?i).*(endc.*true|isen dc available=true).*") || sLow.contains("mendc"));
            o.put("carrierAggregation",
                sLow.contains("carrieraggregation=true") ||
                    sLow.contains("misusingcarrieraggregation=true"));
            // VoWiFi / IWLAN registration (transportType=WLAN accessNetworkTechnology=IWLAN)
            o.put("iwlanPreferred", sLow.contains("misiwlanpreferred=true")
                || sLow.contains("iswlanpreferred=true")
                || sLow.contains("accessnetworktechnology=iwlan"));
            o.put("ntn", ntn);
        } catch (Throwable t) {
            call.reject(t.getMessage());
            return;
        }
        call.resolve(o);
    }

    private interface SafeStr {
        String get();
    }

    private String safe(SafeStr fn) {
        try {
            String v = fn.get();
            return (v == null || v.isEmpty()) ? null : v;
        } catch (Throwable t) {
            return null;
        }
    }

    // -------------------------------------------------------------- SIM info

    @PluginMethod
    public void getSimInfo(PluginCall call) {
        JSArray sims = new JSArray();
        try {
            SubscriptionManager sm = (SubscriptionManager) getContext().getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
            if (sm != null) {
                List<SubscriptionInfo> list = sm.getActiveSubscriptionInfoList();
                if (list != null) {
                    for (SubscriptionInfo si : list) {
                        JSObject s = new JSObject();
                        s.put("subscriptionId", si.getSubscriptionId());
                        s.put("slotIndex", si.getSimSlotIndex());
                        s.put("carrierName", strOrNull(si.getCarrierName()));
                        s.put("displayName", strOrNull(si.getDisplayName()));
                        String mcc = null, mnc = null;
                        try {
                            mcc = si.getMccString();
                            mnc = si.getMncString();
                        } catch (Throwable ignored) {
                        }
                        s.put("mcc", mcc);
                        s.put("mnc", mnc);
                        s.put("isoCountry", strOrNull(si.getCountryIso()));
                        s.put("isEmbedded", si.isEmbedded());
                        s.put("isOpportunistic", si.isOpportunistic());
                        Boolean roam = null;
                        try {
                            roam = si.getDataRoaming() == 1;
                        } catch (Throwable ignored) {
                        }
                        s.put("dataRoaming", roam);
                        sims.put(s);
                    }
                }
            }
        } catch (SecurityException se) {
            call.reject("READ_PHONE_STATE permission required");
            return;
        } catch (Throwable t) {
            call.reject(t.getMessage());
            return;
        }
        JSObject res = new JSObject();
        res.put("sims", sims);
        call.resolve(res);
    }

    private String strOrNull(CharSequence cs) {
        return cs == null ? null : cs.toString();
    }

    // ------------------------------------------------------------- Wi-Fi info

    @PluginMethod
    public void getWifiInfo(PluginCall call) {
        JSObject o = new JSObject();
        try {
            WifiManager wm = (WifiManager) getContext().getSystemService(Context.WIFI_SERVICE);
            WifiInfo wi = wm != null ? wm.getConnectionInfo() : null;
            DhcpInfo dhcp = wm != null ? wm.getDhcpInfo() : null;

            String ssid = null;
            String bssid = null;
            Integer freq = null, speed = null, rssi = null, chanW = null;
            if (wi != null) {
                try {
                    ssid = wi.getSSID();
                    if (ssid != null && ssid.startsWith("\"") && ssid.endsWith("\"")) ssid = ssid.substring(1, ssid.length() - 1);
                    if ("<unknown ssid>".equals(ssid)) ssid = null;
                } catch (Throwable ignored) {
                }
                bssid = safe(wi::getBSSID);
                freq = asInt(wi.getFrequency());
                speed = asInt(wi.getLinkSpeed());
                rssi = asInt(wi.getRssi());
                if (Build.VERSION.SDK_INT >= 29) {
                    try {
                        chanW = asInt(reflect(wi, "getChannelWidth"));
                    } catch (Throwable ignored) {
                    }
                }
            }
            o.put("ssid", ssid);
            o.put("bssid", bssid);
            o.put("frequencyMhz", freq);
            o.put("linkSpeedMbps", speed);
            o.put("rssi", rssi);
            o.put("channelWidthMhz", chanW);
            o.put("ipAddress", dhcp != null ? ipToString(dhcp.ipAddress) : null);
            o.put("gatewayIp", dhcp != null ? ipToString(dhcp.gateway) : null);

            String std = null, band = null;
            if (freq != null) {
                if (freq >= 5925) {
                    band = "6 GHz";
                    std = "Wi-Fi 6E/7";
                } else if (freq >= 4900) {
                    band = "5 GHz";
                    std = "Wi-Fi 5/6";
                } else if (freq >= 2400) {
                    band = "2.4 GHz";
                    std = "Wi-Fi 4/n";
                }
            }
            o.put("standardGuess", std);
            o.put("bandLabel", band);
        } catch (Throwable t) {
            call.reject(t.getMessage());
            return;
        }
        call.resolve(o);
    }

    private String ipToString(int ip) {
        if (ip == 0) return null;
        return String.format(Locale.US, "%d.%d.%d.%d", ip & 0xff, (ip >> 8) & 0xff, (ip >> 16) & 0xff, (ip >> 24) & 0xff);
    }

    // ---------------------------------------------------------- capabilities

    @PluginMethod
    public void getDeviceCapabilities(PluginCall call) {
        JSObject o = new JSObject();
        try {
            o.put("model", Build.MODEL);
            o.put("manufacturer", Build.MANUFACTURER);
            o.put("brand", Build.BRAND);
            o.put("device", Build.DEVICE);
            o.put("product", Build.PRODUCT);
            o.put("hardware", Build.HARDWARE);
            o.put("androidVersion", Build.VERSION.RELEASE);
            o.put("sdkInt", Build.VERSION.SDK_INT);
            o.put("securityPatch", Build.VERSION.SECURITY_PATCH);
            o.put("radioVersion", Build.getRadioVersion());

            TelephonyManager tm = tm();
            Integer phoneCount = null;
            try {
                phoneCount = tm.getPhoneCount();
            } catch (Throwable ignored) {
            }
            o.put("phoneCount", phoneCount);
            Integer modems = null;
            if (Build.VERSION.SDK_INT >= 30) {
                try {
                    modems = tm.getActiveModemCount();
                } catch (Throwable ignored) {
                }
            }
            o.put("activeModemCount", modems);
            Object ratMask = reflect(tm, "getSupportedRadioAccessFamily");
            o.put("supportedRatMask", ratMask instanceof Number ? ((Number) ratMask).longValue() : null);

            JSArray feats = new JSArray();
            PackageManager pm = getContext().getPackageManager();
            String[] wanted = {
                PackageManager.FEATURE_TELEPHONY, PackageManager.FEATURE_TELEPHONY_CDMA,
                PackageManager.FEATURE_TELEPHONY_GSM, PackageManager.FEATURE_TELEPHONY_EUICC,
                PackageManager.FEATURE_WIFI, PackageManager.FEATURE_WIFI_DIRECT,
                PackageManager.FEATURE_NFC, PackageManager.FEATURE_BLUETOOTH,
                PackageManager.FEATURE_LOCATION_GPS, PackageManager.FEATURE_LOCATION_NETWORK,
                "android.hardware.telephony.ims", "android.hardware.telephony.data.cuttlefish"
            };
            for (String f : wanted) {
                try {
                    if (pm.hasSystemFeature(f)) feats.put(f.replace("android.hardware.", ""));
                } catch (Throwable ignored) {
                }
            }
            o.put("features", feats);

            JSObject caps = new JSObject();
            Integer down = null, up = null;
            Boolean validated = null, internet = null, metered = null, roamingNw = null;
            try {
                ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
                Network nw = cm != null ? cm.getActiveNetwork() : null;
                NetworkCapabilities nc = nw != null ? cm.getNetworkCapabilities(nw) : null;
                if (nc != null) {
                    internet = nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
                    validated = nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
                    metered = !nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED);
                    down = nc.getLinkDownstreamBandwidthKbps();
                    up = nc.getLinkUpstreamBandwidthKbps();
                }
            } catch (Throwable ignored) {
            }
            caps.put("internet", internet);
            caps.put("validated", validated);
            caps.put("metered", metered);
            o.put("networkCaps", caps);
            o.put("linkDownKbps", down);
            o.put("linkUpKbps", up);

            Boolean dataEnabled = null;
            try {
                dataEnabled = tm.isDataEnabled();
            } catch (Throwable ignored) {
            }
            o.put("dataEnabled", dataEnabled);
        } catch (Throwable t) {
            call.reject(t.getMessage());
            return;
        }
        call.resolve(o);
    }

    // ------------------------------------------------------------------ ping

    @PluginMethod
    public void ping(PluginCall call) {
        String host = call.getString("host", "1.1.1.1");
        int count = Math.min(30, Math.max(1, call.getInt("count", 10)));
        int size = Math.min(1400, Math.max(8, call.getInt("size", 56)));
        int timeoutSec = Math.min(10, Math.max(1, call.getInt("timeoutSec", 3)));

        JSArray timesArr = new JSArray();
        JSObject o = new JSObject();
        o.put("host", host);
        o.put("times", timesArr);
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "/system/bin/ping", "-c", String.valueOf(count), "-s", String.valueOf(size),
                "-W", String.valueOf(timeoutSec), "-i", "0.3", host
            );
            pb.redirectErrorStream(true);
            Process p = pb.start();
            StringBuilder sb = new StringBuilder();
            BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
            boolean finished = false;
            try {
                finished = p.waitFor(timeoutSec * count + 5, java.util.concurrent.TimeUnit.SECONDS);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
            if (!finished) {
                p.destroyForcibly();
                o.put("ok", false);
                o.put("error", "ping timed out");
                o.put("raw", sb.toString());
                call.resolve(o);
                return;
            }
            String raw = sb.toString();

            java.util.regex.Matcher mt = java.util.regex.Pattern.compile("time=([\\d.]+)").matcher(raw);
            List<Double> times = new ArrayList<>();
            while (mt.find()) times.add(Double.parseDouble(mt.group(1)));
            for (Double d : times) timesArr.put(d);

            o.put("transmitted", firstGroup(raw, "(\\d+) packets transmitted"));
            o.put("received", firstGroup(raw, ",\\s*(\\d+) received"));
            o.put("lossPct", firstGroup(raw, "([\\d.]+)% packet loss"));
            java.util.regex.Matcher mr = java.util.regex.Pattern
                .compile("min/avg/max(?:/mdev)?\\s*=\\s*([\\d.]+)/([\\d.]+)/([\\d.]+)(?:/([\\d.]+))?").matcher(raw);
            if (mr.find()) {
                o.put("minMs", Double.parseDouble(mr.group(1)));
                o.put("avgMs", Double.parseDouble(mr.group(2)));
                o.put("maxMs", Double.parseDouble(mr.group(3)));
                o.put("jitterMs", mr.group(4) != null ? Double.parseDouble(mr.group(4)) : null);
            }
            o.put("ttl", firstGroup(raw, "ttl=(\\d+)"));
            o.put("ok", !times.isEmpty());
            if (times.isEmpty()) o.put("error", "no replies (blocked or unreachable)");
            o.put("raw", raw.length() > 4000 ? raw.substring(0, 4000) : raw);
            call.resolve(o);
        } catch (Throwable t) {
            o.put("ok", false);
            o.put("error", "ping exec failed: " + t.getMessage());
            call.resolve(o);
        }
    }

    private Integer firstGroup(String s, String rx) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(rx).matcher(s);
            return m.find() ? Integer.parseInt(m.group(1)) : null;
        } catch (Throwable t) {
            return null;
        }
    }

    private Double parseDouble(String s) {
        try {
            return s == null ? null : Double.parseDouble(s);
        } catch (Throwable t) {
            return null;
        }
    }
}
