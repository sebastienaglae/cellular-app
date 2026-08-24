package com.cellscope.app;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure parser for /system/bin/ping output - unit tested in PingParserTest.
 */
public final class PingParser {

    public static final class Result {
        public final List<Double> times = new ArrayList<>();
        public Integer transmitted;
        public Integer received;
        public Double lossPct;
        public Integer ttl;
        public Double minMs;
        public Double avgMs;
        public Double maxMs;
        public Double jitterMs;

        public boolean hasReplies() {
            return !times.isEmpty();
        }
    }

    private static final Pattern TIME = Pattern.compile("time=([0-9.]+)");
    private static final Pattern TRANSMITTED = Pattern.compile("(\\d+) packets transmitted");
    private static final Pattern RECEIVED = Pattern.compile(",\\s*(\\d+) (?:packets )?received");
    private static final Pattern LOSS = Pattern.compile("([0-9.]+)% packet loss");
    private static final Pattern RTT =
        Pattern.compile("min/avg/max(?:/mdev)?\\s*=\\s*([0-9.]+)/([0-9.]+)/([0-9.]+)(?:/([0-9.]+))?");
    private static final Pattern TTL = Pattern.compile("ttl=(\\d+)");

    private PingParser() {
    }

    public static boolean isValidHost(String host) {
        if (host == null) return false;
        String h = host.trim();
        if (h.isEmpty() || h.length() > 253 || h.startsWith("-")) return false;
        return h.matches("[\\w.\\-:]+");
    }

    public static Result parse(String raw) {
        Result r = new Result();
        if (raw == null) return r;

        Matcher m = TIME.matcher(raw);
        while (m.find()) {
            try {
                r.times.add(Double.parseDouble(m.group(1)));
            } catch (NumberFormatException ignored) {
            }
        }

        r.transmitted = firstInt(TRANSMITTED, raw);
        r.received = firstInt(RECEIVED, raw);
        String loss = firstGroup(LOSS, raw);
        if (loss != null) {
            try {
                r.lossPct = Double.parseDouble(loss);
            } catch (NumberFormatException ignored) {
            }
        }
        r.ttl = firstInt(TTL, raw);

        Matcher mr = RTT.matcher(raw);
        if (mr.find()) {
            try {
                r.minMs = Double.parseDouble(mr.group(1));
                r.avgMs = Double.parseDouble(mr.group(2));
                r.maxMs = Double.parseDouble(mr.group(3));
                r.jitterMs = mr.group(4) != null ? Double.parseDouble(mr.group(4)) : null;
            } catch (NumberFormatException ignored) {
            }
        }
        return r;
    }

    private static Integer firstInt(Pattern p, String s) {
        Matcher m = p.matcher(s);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private static String firstGroup(Pattern p, String s) {
        Matcher m = p.matcher(s);
        return m.find() ? m.group(1) : null;
    }
}
