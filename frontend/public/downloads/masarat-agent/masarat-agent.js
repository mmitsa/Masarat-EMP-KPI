#!/usr/bin/env node
/**
 * ══════════════════════════════════════════════════════════════
 *  Masarat Biometric Agent — وكيل مزامنة أجهزة البصمة
 * ══════════════════════════════════════════════════════════════
 *
 *  يعمل على الشبكة المحلية للعميل ويقرأ سجلات الحضور من
 *  أجهزة ZKTeco عبر UDP/TCP ثم يرسلها للسيرفر السحابي.
 *
 *  لا يحتاج أي مكتبات خارجية — يعمل بـ Node.js فقط.
 *
 *  الاستخدام:
 *    node masarat-agent.js
 *
 *  الإعدادات في ملف: config.json (بنفس المجلد)
 * ══════════════════════════════════════════════════════════════
 */

const dgram = require('dgram');
const net = require('net');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ═══ Load config ═══════════════════════════════════════════════
const CONFIG_PATH = path.join(__dirname, 'config.json');
let config;

try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (err) {
    console.error('══════════════════════════════════════════════');
    console.error('  خطأ: لا يمكن قراءة ملف config.json');
    console.error('  تأكد من وجود الملف في نفس مجلد البرنامج');
    console.error('══════════════════════════════════════════════');
    process.exit(1);
}

const SERVER_URL = config.serverUrl;    // e.g. https://unified.mmit.sa
const API_KEY = config.apiKey;          // PushApiKey from device settings
const DEVICES = config.devices || [];   // [{ ip, port, protocol, name }]
const SYNC_INTERVAL = (config.syncIntervalMinutes || 5) * 60 * 1000;
const LOG_FILE = path.join(__dirname, 'agent.log');

// ═══ Logging ═══════════════════════════════════════════════════
function log(level, ...args) {
    const ts = new Date().toLocaleString('ar-SA', { hour12: false });
    const msg = `[${ts}] [${level}] ${args.join(' ')}`;
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (_) { /* ignore log write errors */ }
}

// ═══ ZKTeco Protocol ═══════════════════════════════════════════
const CMD = {
    CONNECT: 1000, EXIT: 1001, REFRESHDATA: 1013,
    ATTLOG_RRQ: 13, GET_VERSION: 1100,
};
const REPLY_OK = 2000;
const REPLY_DATA = 2002;

function createPacket(command, sessionId, replyId, data = Buffer.alloc(0)) {
    const header = Buffer.alloc(8 + data.length);
    header.writeUInt16LE(command, 0);
    header.writeUInt16LE(0, 2);
    header.writeUInt16LE(sessionId, 4);
    header.writeUInt16LE(replyId, 6);
    if (data.length > 0) data.copy(header, 8);

    let checksum = 0;
    for (let i = 0; i < header.length; i += 2) {
        checksum += header.readUInt16LE(i);
    }
    checksum = checksum % 65536;
    checksum = 65536 - checksum;
    if (checksum === 65536) checksum = 0;
    header.writeUInt16LE(checksum, 2);
    return header;
}

function parseResponse(buffer) {
    if (buffer.length < 8) return { success: false };
    const command = buffer.readUInt16LE(0);
    return {
        success: command === REPLY_OK || command === REPLY_DATA,
        command,
        sessionId: buffer.readUInt16LE(4),
        replyId: buffer.readUInt16LE(6),
        data: buffer.slice(8),
    };
}

function sendUDP(ip, port, command, sessionId, replyId, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        const packet = createPacket(command, sessionId, replyId, data);
        const timer = setTimeout(() => { client.close(); reject(new Error('UDP timeout')); }, timeout);
        client.on('message', (msg) => { clearTimeout(timer); client.close(); resolve(parseResponse(msg)); });
        client.on('error', (err) => { clearTimeout(timer); client.close(); reject(err); });
        client.send(packet, 0, packet.length, port, ip);
    });
}

function sendTCP(ip, port, command, sessionId, replyId, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        const packet = createPacket(command, sessionId, replyId, data);
        const timer = setTimeout(() => { client.destroy(); reject(new Error('TCP timeout')); }, timeout);
        client.connect(port, ip, () => client.write(packet));
        client.on('data', (msg) => { clearTimeout(timer); client.destroy(); resolve(parseResponse(msg)); });
        client.on('error', (err) => { clearTimeout(timer); client.destroy(); reject(err); });
    });
}

async function sendCmd(ip, port, protocol, command, sessionId, replyId, data = Buffer.alloc(0)) {
    if (protocol === 'tcp') return sendTCP(ip, port, command, sessionId, replyId, data);
    return sendUDP(ip, port, command, sessionId, replyId, data);
}

// ═══ Parse attendance logs from binary data ════════════════════
function parseAttendanceLogs(data) {
    const logs = [];
    const recordSize = 40;
    for (let i = 0; i + recordSize <= data.length; i += recordSize) {
        const record = data.slice(i, i + recordSize);
        const userId = record.slice(0, 9).toString('utf8').replace(/\0/g, '').trim();
        const timestamp = record.readUInt32LE(24);
        const punchType = record.readUInt8(29);
        if (!userId) continue;
        const dt = new Date((timestamp + 946684800) * 1000);
        logs.push({
            userId,
            dateTime: dt.toISOString().replace('T', ' ').slice(0, 19),
            punchType,
        });
    }
    return logs;
}

// ═══ Read attendance from one device ═══════════════════════════
async function readDevice(device) {
    const { ip, port = 4370, protocol = 'udp', name = ip } = device;
    let replyId = 0;

    // Connect
    log('INFO', `جاري الاتصال بـ ${name} (${ip}:${port}) ...`);
    const connResp = await sendCmd(ip, port, protocol, CMD.CONNECT, 0, replyId++);
    if (!connResp.success) throw new Error(`فشل الاتصال بالجهاز ${name}`);

    const sessionId = connResp.sessionId;

    // Refresh + read attendance
    await sendCmd(ip, port, protocol, CMD.REFRESHDATA, sessionId, replyId++);
    const attResp = await sendCmd(ip, port, protocol, CMD.ATTLOG_RRQ, sessionId, replyId++);

    // Disconnect
    try { await sendCmd(ip, port, protocol, CMD.EXIT, sessionId, replyId++); } catch (_) {}

    if (!attResp.success || attResp.data.length === 0) {
        log('INFO', `${name}: لا توجد سجلات جديدة`);
        return [];
    }

    const logs = parseAttendanceLogs(attResp.data);
    log('INFO', `${name}: تم قراءة ${logs.length} سجل`);
    return logs;
}

// ═══ Send records to cloud server ══════════════════════════════
function postToServer(records) {
    return new Promise((resolve, reject) => {
        const url = new URL('/api/hr/attendance/agent-sync', SERVER_URL);
        const isHttps = url.protocol === 'https:';
        const transport = isHttps ? https : http;

        const body = JSON.stringify({ records });
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(body),
            },
            rejectUnauthorized: false, // Allow self-signed certs
        };

        const req = transport.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, ...json });
                } catch (_) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
        req.write(body);
        req.end();
    });
}

// ═══ Single sync cycle ═════════════════════════════════════════
async function syncCycle() {
    log('INFO', '══════ بدء دورة المزامنة ══════');

    let allRecords = [];

    for (const device of DEVICES) {
        try {
            const records = await readDevice(device);
            allRecords = allRecords.concat(records);
        } catch (err) {
            log('ERROR', `خطأ في الجهاز ${device.name || device.ip}: ${err.message}`);
        }
    }

    if (allRecords.length === 0) {
        log('INFO', 'لا توجد سجلات للإرسال');
        return;
    }

    log('INFO', `إرسال ${allRecords.length} سجل إلى السيرفر ...`);

    try {
        const result = await postToServer(allRecords);
        if (result.success) {
            log('INFO', `تم الإرسال بنجاح: ${result.inserted || 0} جديد, ${result.skipped || 0} مكرر`);
        } else {
            log('ERROR', `فشل الإرسال: ${result.error || result.raw || JSON.stringify(result)}`);
        }
    } catch (err) {
        log('ERROR', `خطأ في الاتصال بالسيرفر: ${err.message}`);
    }

    log('INFO', '══════ انتهت دورة المزامنة ══════\n');
}

// ═══ Startup ═══════════════════════════════════════════════════
function printBanner() {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   Masarat Biometric Agent v1.0           ║');
    console.log('  ║   وكيل مزامنة أجهزة البصمة              ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`  السيرفر:     ${SERVER_URL}`);
    console.log(`  عدد الأجهزة: ${DEVICES.length}`);
    console.log(`  فترة المزامنة: كل ${config.syncIntervalMinutes || 5} دقائق`);
    console.log('');
    DEVICES.forEach((d, i) => {
        console.log(`  [${i + 1}] ${d.name || d.ip} — ${d.ip}:${d.port || 4370} (${d.protocol || 'udp'})`);
    });
    console.log('');
    console.log('  اضغط Ctrl+C للإيقاف');
    console.log('  ─────────────────────────────────────────────');
    console.log('');
}

async function main() {
    // Validate config
    if (!SERVER_URL) { console.error('خطأ: serverUrl مطلوب في config.json'); process.exit(1); }
    if (!API_KEY) { console.error('خطأ: apiKey مطلوب في config.json'); process.exit(1); }
    if (DEVICES.length === 0) { console.error('خطأ: أضف جهاز واحد على الأقل في devices'); process.exit(1); }

    printBanner();

    // First sync immediately
    await syncCycle();

    // Then schedule periodic sync
    setInterval(syncCycle, SYNC_INTERVAL);
}

main().catch(err => {
    log('FATAL', err.message);
    process.exit(1);
});
