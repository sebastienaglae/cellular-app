package com.cellscope.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class RatMapperTest {

    @Test
    public void mapsIosRadioAccessTechnologies() {
        assertEquals("GSM", RatMapper.label("CTRadioAccessTechnologyGPRS"));
        assertEquals("GSM", RatMapper.label("CTRadioAccessTechnologyEdge"));
        assertEquals("WCDMA", RatMapper.label("CTRadioAccessTechnologyWCDMA"));
        assertEquals("WCDMA", RatMapper.label("CTRadioAccessTechnologyHSDPA"));
        assertEquals("LTE", RatMapper.label("CTRadioAccessTechnologyLTE"));
        assertEquals("NR", RatMapper.label("CTRadioAccessTechnologyNR"));
        assertEquals("NR", RatMapper.label("CTRadioAccessTechnologyNRNSA"));
    }

    @Test
    public void mapsAndroidNetworkTypes() {
        assertEquals("GSM", RatMapper.label("GPRS"));
        assertEquals("LTE", RatMapper.label("LTE"));
        assertEquals("NR", RatMapper.label("NR"));
    }

    @Test
    public void unknownAndNullReturnUnknown() {
        assertEquals("UNKNOWN", RatMapper.label(null));
        assertEquals("UNKNOWN", RatMapper.label(""));
        assertEquals("UNKNOWN", RatMapper.label("future_tech"));
    }

    @Test
    public void integerCodesMatchAndroidConstants() {
        assertEquals(20, RatMapper.toInt("CTRadioAccessTechnologyNR"));
        assertEquals(20, RatMapper.toInt("CTRadioAccessTechnologyNRNSA"));
        assertEquals(13, RatMapper.toInt("CTRadioAccessTechnologyLTE"));
        assertEquals(3, RatMapper.toInt("CTRadioAccessTechnologyWCDMA"));
        assertEquals(2, RatMapper.toInt("CTRadioAccessTechnologyEdge"));
        assertEquals(1, RatMapper.toInt("CTRadioAccessTechnologyGPRS"));
        assertEquals(0, RatMapper.toInt(null));
    }

    @Test
    public void nrDetection() {
        assertTrue(RatMapper.isNr("CTRadioAccessTechnologyNR"));
        assertTrue(RatMapper.isNr("CTRadioAccessTechnologyNRNSA"));
        assertFalse(RatMapper.isNr("CTRadioAccessTechnologyLTE"));
        assertFalse(RatMapper.isNr(null));
    }

    @Test
    public void nsaDetection() {
        assertTrue(RatMapper.isNrNsa("CTRadioAccessTechnologyNRNSA"));
        assertFalse(RatMapper.isNrNsa("CTRadioAccessTechnologyNR"));
        assertFalse(RatMapper.isNrNsa("CTRadioAccessTechnologyLTE"));
    }
}
