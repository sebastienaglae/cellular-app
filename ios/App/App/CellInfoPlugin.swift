import Foundation
import Capacitor
import CoreTelephony
import Network
import CoreLocation

/**
 * iOS twin of the Android CellInfoPlugin.
 *
 * Apple exposes far less than Android: only the current radio access
 * technology, carrier identity and (optionally) a coarse signal strength.
 * Neighbor cells, PCI, TAC, CID, ARFCN and bands are NOT available to apps.
 * Every unavailable field is returned as null and the UI explains why.
 */
@objc(CellInfoPlugin)
public class CellInfoPlugin: CAPPlugin, CLLocationManagerDelegate {

    private let telephony = CTTelephonyNetworkInfo()
    private let locationManager = CLLocationManager()

    // MARK: - permissions

    @PluginMethod func checkPermissions(_ call: CAPPluginCall) {
        let status = CLLocationManager.authorizationStatus()
        let loc = status == .authorizedWhenInUse || status == .authorizedAlways
        call.resolve(["location": loc, "phone": true])
    }

    @PluginMethod func requestPermissions(_ call: CAPPluginCall) {
        locationManager.delegate = self
        let status = CLLocationManager.authorizationStatus()
        if status == .notDetermined {
            locationManager.requestWhenInUseAuthorization()
            call.resolve(["granted": true])
        } else {
            call.resolve(["granted": status == .authorizedWhenInUse || status == .authorizedAlways])
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        // no-op: JS layer re-checks through checkPermissions()
    }

    // MARK: - radio access technology helpers

    private func currentRat() -> String? {
        return telephony.serviceCurrentRadioAccessTechnology?.values.first
    }

    private func ratLabel(_ rat: String?) -> String {
        guard let r = rat else { return "UNKNOWN" }
        if r.hasSuffix("NRNSA") { return "NR" }
        if r.hasSuffix("NR") { return "NR" }
        if r.contains("LTE") { return "LTE" }
        if r.contains("WCDMA") || r.contains("HSDPA") || r.contains("HSUPA") { return "WCDMA" }
        if r.contains("CDMA") { return "CDMA" }
        if r.contains("Edge") || r.contains("GPRS") { return "GSM" }
        return "UNKNOWN"
    }

    private func ratToInt(_ rat: String?) -> Int {
        guard let r = rat else { return 0 }
        if r.hasSuffix("NR") || r.hasSuffix("NRNSA") { return 20 }
        if r.contains("LTE") { return 13 }
        if r.contains("WCDMA") || r.contains("HSDPA") || r.contains("HSUPA") { return 3 }
        if r.contains("CDMA") { return 4 }
        if r.contains("Edge") || r.contains("GPRS") { return 2 }
        return 0
    }

    private func firstCarrier() -> CTCarrier? {
        return telephony.serviceSubscriberCellularProviders?.values.first
    }

    // MARK: - cells (single serving record; iOS hides neighbors & identifiers)

    @PluginMethod func getAllCellInfo(_ call: CAPPluginCall) {
        let rat = currentRat()
        var cell = JSObject()
        cell["tech"] = ratLabel(rat)
        cell["registered"] = true
        cell["timestamp"] = Int64(Date().timeIntervalSince1970 * 1000)
        cell["arfcn"] = NSNull()
        cell["bands"] = JSArray()
        cell["band"] = NSNull()
        cell["freqDlMhz"] = NSNull()
        cell["freqUlMhz"] = NSNull()
        cell["bandwidthMhz"] = NSNull()
        cell["pci"] = NSNull()
        cell["cid"] = NSNull()
        cell["tac"] = NSNull()
        cell["mcc"] = NSNull()
        cell["mnc"] = NSNull()
        cell["rsrp"] = NSNull()
        cell["rsrq"] = NSNull()
        cell["rssi"] = NSNull()
        cell["sinr"] = NSNull()
        cell["dbm"] = NSNull()
        cell["note"] = "not exposed by iOS"

        var cells = JSArray()
        cells.append(cell)

        let res = JSObject()
        res["cells"] = cells
        call.resolve(res)
    }

    // MARK: - service state

    @PluginMethod func getServiceState(_ call: CAPPluginCall) {
        let rat = currentRat()
        let carrier = firstCarrier()

        var mcc: String? = nil
        var mnc: String? = nil
        if let c = carrier {
            mcc = c.mobileCountryCode
            mnc = c.mobileNetworkCode
        }

        var o = JSObject()
        o["operatorName"] = carrier?.carrierName ?? nil
        o["operatorNumeric"] = (mcc ?? "") + (mnc ?? "")
        o["isoCountry"] = carrier?.isoCountryCode ?? nil
        o["roaming"] = carrier?.isRoaming ?? false
        o["dataTechInt"] = ratToInt(rat)
        o["voiceRegState"] = 0
        o["dataRegState"] = 0
        o["nrAvailable"] = rat?.hasSuffix("NR") ?? false
        o["endc"] = rat?.hasSuffix("NRNSA") ?? false
        o["carrierAggregation"] = false
        o["ntn"] = false
        o["iwlanPreferred"] = false
        o["nrModeHint"] = (rat?.hasSuffix("NRNSA") ?? false) ? "NSA" : ((rat?.hasSuffix("NR") ?? false) ? "SA" : nil)
        o["isManualSelection"] = false
        o["emergencyOnly"] = false
        call.resolve(o)
    }

    // MARK: - SIM / carriers

    @PluginMethod func getSimInfo(_ call: CAPPluginCall) {
        var sims = JSArray()
        if let services = telephony.serviceSubscriberCellularProviders {
            for (serviceId, carrier) in services {
                var s = JSObject()
                s["subscriptionId"] = serviceId.hashValue
                s["slotIndex"] = 0
                s["carrierName"] = carrier.carrierName ?? nil
                s["displayName"] = carrier.carrierName ?? nil
                s["mcc"] = carrier.mobileCountryCode ?? nil
                s["mnc"] = carrier.mobileNetworkCode ?? nil
                s["isoCountry"] = carrier.isoCountryCode ?? nil
                s["isEmbedded"] = false
                s["isOpportunistic"] = false
                s["dataRoaming"] = nil
                sims.append(s)
            }
        }
        let res = JSObject()
        res["sims"] = sims
        call.resolve(res)
    }

    // MARK: - Wi-Fi (SSID requires location permission; entitlement may limit it)

    @PluginMethod func getWifiInfo(_ call: CAPPluginCall) {
        var o = JSObject()
        o["ssid"] = nil
        o["bssid"] = nil
        o["frequencyMhz"] = nil
        o["linkSpeedMbps"] = nil
        o["rssi"] = nil
        o["channelWidthMhz"] = nil
        o["ipAddress"] = CellInfoPlugin.localIPv4()
        o["gatewayIp"] = nil
        o["standardGuess"] = nil
        o["bandLabel"] = nil

        NEHotspotNetwork.fetchCurrent { network in
            if let n = network {
                o["ssid"] = n.ssid
                o["bssid"] = n.bssid
            }
            call.resolve(o)
        }
    }

    static func localIPv4() -> String? {
        var address: String? = nil
        var ifaddr: UnsafeMutablePointer<ifaddrs>? = nil
        guard getifaddrs(&ifaddr) == 0, let first = ifaddr else { return nil }
        defer { freeifaddrs(ifaddr) }

        var ptr: UnsafeMutablePointer<ifaddrs>? = first
        while let p = ptr {
            let ifa = p.pointee
            if let sa = ifa.ifa_addr, (ifa.ifa_flags & UInt32(IFF_LOOPBACK)) == 0 {
                if sa.pointee.sa_family == UInt8(AF_INET) {
                    var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    if getnameinfo(sa, socklen_t(sa.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 {
                        address = String(cString: host)
                        if ifa.ifa_name.map({ String(cString: $0) }) == "en0" { break }
                    }
                }
            }
            ptr = p.pointee.ifa_next
        }
        return address
    }

    // MARK: - device capabilities

    @PluginMethod func getDeviceCapabilities(_ call: CAPPluginCall) {
        var systemInfo = utsname()
        uname(&systemInfo)
        let mirror = Mirror(reflecting: systemInfo.machine)
        let machine = mirror.children.reduce("") { acc, element in
            guard let value = element.value as? Int8, value != 0 else { return acc }
            return acc + String(UnicodeScalar(UInt8(value)))
        }

        var o = JSObject()
        o["model"] = machine
        o["manufacturer"] = "Apple"
        o["brand"] = "Apple"
        o["device"] = machine
        o["product"] = machine
        o["hardware"] = nil
        o["androidVersion"] = nil
        o["sdkInt"] = ProcessInfo.processInfo.operatingSystemVersionMajor
        o["securityPatch"] = nil
        o["radioVersion"] = telephony.serviceCurrentRadioAccessTechnology?.values.first ?? nil
        o["phoneCount"] = 1
        o["activeModemCount"] = 1
        o["supportedRatMask"] = nil

        var feats = JSArray()
        feats.append("telephony")
        feats.append("wifi")
        o["features"] = feats

        var caps = JSObject()
        caps["internet"] = nil
        caps["validated"] = nil
        caps["metered"] = nil
        o["networkCaps"] = caps
        o["linkDownKbps"] = nil
        o["linkUpKbps"] = nil
        o["dataEnabled"] = nil
        call.resolve(o)
    }

    // MARK: - ping (ICMP over DGRAM socket; falls back with an explicit error)

    @PluginMethod func ping(_ call: CAPPluginCall) {
        let host = call.getString("host", "1.1.1.1")
        let count = min(30, max(1, call.getInt("count", 10)))
        let size = min(1400, max(8, call.getInt("size", 56)))
        let timeoutSec = min(10, max(1, call.getInt("timeoutSec", 3)))

        DispatchQueue.global(qos: .userInitiated).async {
            let result = PingClient.ping(host: host, count: count, size: size, timeoutSec: timeoutSec)
            var o = JSObject()
            o["ok"] = result.ok
            o["host"] = host
            let times = JSArray()
            for t in result.times { times.append(t) }
            o["times"] = times
            o["transmitted"] = result.transmitted
            o["received"] = result.received
            o["lossPct"] = result.lossPct
            o["minMs"] = result.minMs
            o["avgMs"] = result.avgMs
            o["maxMs"] = result.maxMs
            o["jitterMs"] = result.jitterMs
            o["ttl"] = result.ttl
            if let err = result.error { o["error"] = err }
            call.resolve(o)
        }
    }
}
