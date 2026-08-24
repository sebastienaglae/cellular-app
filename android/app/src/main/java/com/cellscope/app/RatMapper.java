package com.cellscope.app;

/**
 * Pure mapping from Android/3GPP radio access technology strings to
 * CellScope internal labels and integer codes. Unit tested in RatMapperTest.
 */
public final class RatMapper {

    private RatMapper() {}

    /** Map a CTRadioAccessTechnology or Android RAT string to a CellScope label. */
    public static String label(String rat) {
        if (rat == null || rat.isEmpty()) return "UNKNOWN";
        if (rat.endsWith("NRNSA")) return "NR";
        if (rat.endsWith("NR") || rat.equals("NR")) return "NR";
        if (rat.contains("LTE")) return "LTE";
        if (rat.contains("WCDMA") || rat.contains("HSDPA") || rat.contains("HSUPA")) return "WCDMA";
        if (rat.contains("CDMA")) return "CDMA";
        if (rat.contains("Edge") || rat.contains("GPRS")) return "GSM";
        return "UNKNOWN";
    }

    /** Map to Android NETWORK_TYPE_* integer for the TS layer. */
    public static int toInt(String rat) {
        if (rat == null || rat.isEmpty()) return 0;
        if (rat.endsWith("NRNSA") || rat.endsWith("NR")) return 20; // NETWORK_TYPE_NR
        if (rat.contains("LTE")) return 13;                          // NETWORK_TYPE_LTE
        if (rat.contains("HSDPA") || rat.contains("HSUPA")) return 3; // NETWORK_TYPE_UMTS
        if (rat.contains("WCDMA")) return 3;
        if (rat.contains("CDMA1x") || rat.contains("EVDO")) return 4; // NETWORK_TYPE_CDMA
        if (rat.contains("Edge")) return 2;                           // NETWORK_TYPE_EDGE
        if (rat.contains("GPRS")) return 1;                           // NETWORK_TYPE_GPRS
        return 0;
    }

    /** Whether the RAT represents 5G NR (SA or NSA). */
    public static boolean isNr(String rat) {
        return rat != null && (rat.endsWith("NR") || rat.endsWith("NRNSA") || rat.contains("NR"));
    }

    /** Whether the RAT represents 5G NSA specifically. */
    public static boolean isNrNsa(String rat) {
        return rat != null && rat.endsWith("NRNSA");
    }
}
