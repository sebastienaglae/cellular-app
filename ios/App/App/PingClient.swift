import Foundation

/**
 * Minimal ICMP echo client using a SOCK_DGRAM/ICMP socket (the same
 * technique as Apple's SimplePing sample - no raw sockets or entitlements
 * required on iOS). Falls back with an explicit error when the platform
 * refuses the socket.
 */
struct PingResult {
    var ok = false
    var times: [Double] = []
    var transmitted = 0
    var received = 0
    var lossPct: Double? = nil
    var minMs: Double? = nil
    var avgMs: Double? = nil
    var maxMs: Double? = nil
    var jitterMs: Double? = nil
    var ttl: Int? = nil
    var error: String? = nil
}

enum PingClient {

    static func ping(host: String, count: Int, size: Int, timeoutSec: Int) -> PingResult {
        var result = PingResult()
        result.transmitted = count

        // resolve IPv4
        var info: UnsafeMutablePointer<addrinfo>? = nil
        var hints = addrinfo()
        hints.ai_family = AF_INET
        hints.ai_socktype = SOCK_DGRAM
        hints.ai_protocol = IPPROTO_ICMP
        guard getaddrinfo(host, nil, &hints, &info) == 0, let addr = info else {
            result.error = "cannot resolve host"
            return result
        }
        defer { freeaddrinfo(info) }

        let sock = socket(addr.pointee.ai_family, SOCK_DGRAM, IPPROTO_ICMP)
        guard sock >= 0 else {
            result.error = "ICMP socket unavailable on this device"
            return result
        }
        defer { close(sock) }

        // receive timeout
        var tv = timeval(tv_sec: timeoutSec, tv_usec: 0)
        _ = setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, socklen_t(MemoryLayout<timeval>.size))

        let connectResult = withUnsafePointer(to: addr.pointee.ai_addr) { ptr -> Int32 in
            ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sa in
                connect(sock, sa, socklen_t(addr.pointee.ai_addrlen))
            }
        }
        guard connectResult == 0 else {
            result.error = "connect failed"
            return result
        }

        let identifier = UInt16(ProcessInfo.processInfo.processIdentifier & 0xFFFF)
        let payloadSize = max(8, size - 8)
        var seq: UInt16 = 0

        for _ in 1...count {
            seq += 1
            var packet = buildPacket(id: identifier, seq: seq, payloadSize: payloadSize)

            let start = Date()
            let sent = withUnsafeBytes(of: &packet) { raw -> Int in
                send(sock, raw.baseAddress, raw.count, 0)
            }
            guard sent > 0 else {
                result.error = "send failed"
                continue
            }

            var reply = [UInt8](repeating: 0, count: payloadSize + 64)
            let receivedBytes = recv(sock, &reply, reply.count, 0)
            let elapsed = Date().timeIntervalSince(start) * 1000.0

            if receivedBytes >= 8, reply[0] == 0 { // ICMP ECHO REPLY
                let replyId = (UInt16(reply[4]) << 8) | UInt16(reply[5])
                let replySeq = (UInt16(reply[6]) << 8) | UInt16(reply[7])
                if replyId == identifier && replySeq == seq {
                    result.times.append((elapsed * 10).rounded() / 10)
                    result.received += 1
                }
            }
            Thread.sleep(forTimeInterval: 0.4)
        }

        let t = result.times
        if !t.isEmpty {
            result.ok = true
            result.minMs = t.min()
            result.maxMs = t.max()
            let avg = t.reduce(0, +) / Double(t.count)
            result.avgMs = (avg * 10).rounded() / 10
            let jitter = t.count > 1 ? sqrt(t.reduce(0, { $0 + ($1 - avg) * ($1 - avg) }) / Double(t.count)) : 0
            result.jitterMs = (jitter * 10).rounded() / 10
            result.lossPct = Double(count - t.count) * 100.0 / Double(count)
        } else if result.error == nil {
            result.error = "no replies (blocked or unreachable)"
        }
        return result
    }

    private static func buildPacket(id: UInt16, seq: UInt16, payloadSize: Int) -> [UInt8] {
        var packet = [UInt8]()
        packet.append(8)  // type: echo request
        packet.append(0)  // code
        packet.append(contentsOf: withUnsafeBytes(of: UInt16(0).bigEndian)) // checksum placeholder
        packet.append(contentsOf: withUnsafeBytes(of: id.bigEndian))
        packet.append(contentsOf: withUnsafeBytes(of: seq.bigEndian))
        let start = UInt8(truncatingIfNeeded: 65) // 'A'
        for i in 0..<payloadSize { packet.append(start + UInt8(i % 26)) }

        let sum = checksum(packet)
        packet[2] = UInt8((sum >> 8) & 0xFF)
        packet[3] = UInt8(sum & 0xFF)
        return packet
    }

    private static func checksum(_ data: [UInt8]) -> UInt16 {
        var sum: UInt32 = 0
        var i = 0
        while i + 1 < data.count {
            sum += (UInt32(data[i]) << 8) | UInt32(data[i + 1])
            i += 2
        }
        if i < data.count {
            sum += UInt32(data[i]) << 8
        }
        while sum >> 16 != 0 {
            sum = (sum & 0xFFFF) + (sum >> 16)
        }
        return UInt16(~sum)
    }
}
