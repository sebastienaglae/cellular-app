package com.cellscope.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class PingParserTest {

    private static final String LINUX_OK =
        "PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.\n" +
        "64 bytes from 1.1.1.1: icmp_seq=1 ttl=58 time=10.2 ms\n" +
        "64 bytes from 1.1.1.1: icmp_seq=2 ttl=58 time=12.4 ms\n" +
        "64 bytes from 1.1.1.1: icmp_seq=3 ttl=58 time=9.80 ms\n" +
        "\n" +
        "--- 1.1.1.1 ping statistics ---\n" +
        "3 packets transmitted, 3 received, 0% packet loss, time 2004ms\n" +
        "rtt min/avg/max/mdev = 9.800/10.800/12.400/1.100 ms\n";

    private static final String LOSSY =
        "PING example.com (93.184.216.34): 56 data bytes\n" +
        "64 bytes from 93.184.216.34: seq=0 ttl=51 time=123.456 ms\n" +
        "\n" +
        "--- example.com ping statistics ---\n" +
        "3 packets transmitted, 1 received, 66.667% packet loss\n" +
        "round-trip min/avg/max = 123.456/123.456/123.456 ms\n";

    @Test
    public void parsesTimesTtlAndStats() {
        PingParser.Result r = PingParser.parse(LINUX_OK);
        assertEquals(3, r.times.size());
        assertEquals(10.2, r.times.get(0), 0.001);
        assertEquals(Integer.valueOf(3), r.transmitted);
        assertEquals(Integer.valueOf(3), r.received);
        assertEquals(Integer.valueOf(58), r.ttl);
        assertEquals(Double.valueOf(0.0), r.lossPct);
        assertEquals(9.8, r.minMs, 0.001);
        assertEquals(10.8, r.avgMs, 0.001);
        assertEquals(12.4, r.maxMs, 0.001);
        assertEquals(1.1, r.jitterMs, 0.001);
        assertTrue(r.hasReplies());
    }

    @Test
    public void parsesLossySession() {
        PingParser.Result r = PingParser.parse(LOSSY);
        assertEquals(1, r.times.size());
        assertEquals(123.456, r.times.get(0), 0.0001);
        assertEquals(Integer.valueOf(3), r.transmitted);
        assertEquals(Integer.valueOf(1), r.received);
        assertEquals(Double.valueOf(66.667), r.lossPct, 0.0001);
        assertNull(r.jitterMs); // no mdev in "round-trip" summary
        assertTrue(r.hasReplies());
    }

    @Test
    public void emptyAndGarbageInputYieldEmptyResult() {
        PingParser.Result empty = PingParser.parse("");
        assertFalse(empty.hasReplies());
        assertNull(empty.transmitted);
        assertNull(empty.avgMs);

        PingParser.Result garbage = PingParser.parse("Lorem ipsum dolor sit amet");
        assertFalse(garbage.hasReplies());
        assertNull(garbage.lossPct);
    }

    @Test
    public void nullInputIsSafe() {
        PingParser.Result r = PingParser.parse(null);
        assertFalse(r.hasReplies());
    }

    @Test
    public void hostValidation() {
        assertTrue(PingParser.isValidHost("1.1.1.1"));
        assertTrue(PingParser.isValidHost("example.com"));
        assertTrue(PingParser.isValidHost("2606:4700::1111"));
        assertTrue(PingParser.isValidHost("192.168.1.1"));
        assertTrue(PingParser.isValidHost("freebox-server.local"));
        assertFalse(PingParser.isValidHost(null));
        assertFalse(PingParser.isValidHost(""));
        assertFalse(PingParser.isValidHost("-c 1 evil.com"));   // flag injection
        assertFalse(PingParser.isValidHost("1.1.1.1; rm -rf")); // shell injection attempt
        assertFalse(PingParser.isValidHost("host with space"));
        assertFalse(PingParser.isValidHost("a".repeat(300)));   // over-length
    }
}
