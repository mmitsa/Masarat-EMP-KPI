/**
 * ZKTeco Fingerprint Device Integration Service
 * خدمة التكامل مع أجهزة البصمة ZKTeco
 *
 * يدعم بروتوكولات: TCP/UDP على المنفذ 4370
 * متوافق مع أجهزة: ZK-F18, ZK-F22, ZK-U160, ZK-IN01-A
 */

import net from 'net';
import dgram from 'dgram';

// ZKTeco Protocol Commands
const COMMANDS = {
    CMD_CONNECT: 1000,
    CMD_EXIT: 1001,
    CMD_ENABLEDEVICE: 1002,
    CMD_DISABLEDEVICE: 1003,
    CMD_RESTART: 1004,
    CMD_POWEROFF: 1005,
    CMD_SLEEP: 1006,
    CMD_RESUME: 1007,
    CMD_CAPTUREFINGER: 1009,
    CMD_TEST_TEMP: 1011,
    CMD_CAPTUREIMAGE: 1012,
    CMD_REFRESHDATA: 1013,
    CMD_REFRESHOPTION: 1014,
    CMD_TESTVOICE: 1017,
    CMD_GET_VERSION: 1100,
    CMD_CHANGE_SPEED: 1101,
    CMD_AUTH: 1102,
    CMD_PREPARE_DATA: 1500,
    CMD_DATA: 1501,
    CMD_FREE_DATA: 1502,
    CMD_DATA_WRRQ: 1503,
    CMD_DATA_RDY: 1504,
    CMD_DB_RRQ: 7,
    CMD_USER_WRQ: 8,
    CMD_USERTEMP_RRQ: 9,
    CMD_USERTEMP_WRQ: 10,
    CMD_OPTIONS_RRQ: 11,
    CMD_OPTIONS_WRQ: 12,
    CMD_ATTLOG_RRQ: 13,
    CMD_CLEAR_DATA: 14,
    CMD_CLEAR_ATTLOG: 15,
    CMD_DELETE_USER: 18,
    CMD_DELETE_USERTEMP: 19,
    CMD_CLEAR_ADMIN: 20,
    CMD_USERGRP_RRQ: 21,
    CMD_USERGRP_WRQ: 22,
    CMD_USERTZ_RRQ: 23,
    CMD_USERTZ_WRQ: 24,
    CMD_GRPTZ_RRQ: 25,
    CMD_GRPTZ_WRQ: 26,
    CMD_TZ_RRQ: 27,
    CMD_TZ_WRQ: 28,
    CMD_ULG_RRQ: 29,
    CMD_ULG_WRQ: 30,
    CMD_UNLOCK: 31,
    CMD_CLEAR_ACC: 32,
    CMD_CLEAR_OPLOG: 33,
    CMD_OPLOG_RRQ: 34,
    CMD_GET_FREE_SIZES: 50,
    CMD_ENABLE_CLOCK: 57,
    CMD_STARTVERIFY: 60,
    CMD_STARTENROLL: 61,
    CMD_CANCELCAPTURE: 62,
    CMD_STATE_RRQ: 64,
    CMD_WRITE_LCD: 66,
    CMD_CLEAR_LCD: 67,
    CMD_GET_PINWIDTH: 69,
    CMD_SMS_WRQ: 70,
    CMD_SMS_RRQ: 71,
    CMD_DELETE_SMS: 72,
    CMD_UDATA_WRQ: 73,
    CMD_DELETE_UDATA: 74,
    CMD_DOORSTATE_RRQ: 75,
    CMD_WRITE_MIFARE: 76,
    CMD_EMPTY_MIFARE: 78,
    CMD_GET_TIME: 201,
    CMD_SET_TIME: 202,
    CMD_REG_EVENT: 500
};

// Reply codes
const REPLIES = {
    CMD_ACK_OK: 2000,
    CMD_ACK_ERROR: 2001,
    CMD_ACK_DATA: 2002,
    CMD_ACK_RETRY: 2003,
    CMD_ACK_REPEAT: 2004,
    CMD_ACK_UNAUTH: 2005,
    CMD_ACK_UNKNOWN: 65535,
    CMD_ACK_ERROR_CMD: 65533,
    CMD_ACK_ERROR_INIT: 65532,
    CMD_ACK_ERROR_DATA: 65531
};

class ZKTecoDevice {
    constructor(ip, port = 4370, timeout = 5000, protocol = 'udp') {
        this.ip = ip;
        this.port = port;
        this.timeout = timeout;
        this.protocol = protocol;
        this.socket = null;
        this.sessionId = 0;
        this.replyId = 0;
        this.connected = false;
    }

    /**
     * Create UDP packet header
     */
    createHeader(command, sessionId, replyId, data = Buffer.alloc(0)) {
        const header = Buffer.alloc(8 + data.length);
        header.writeUInt16LE(command, 0);
        header.writeUInt16LE(0, 2); // checksum placeholder
        header.writeUInt16LE(sessionId, 4);
        header.writeUInt16LE(replyId, 6);
        if (data.length > 0) {
            data.copy(header, 8);
        }

        // Calculate checksum
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

    /**
     * Send command via UDP
     */
    async sendUDP(command, data = Buffer.alloc(0)) {
        return new Promise((resolve, reject) => {
            const client = dgram.createSocket('udp4');
            const packet = this.createHeader(command, this.sessionId, this.replyId++, data);

            const timer = setTimeout(() => {
                client.close();
                reject(new Error('Connection timeout'));
            }, this.timeout);

            client.on('message', (msg) => {
                clearTimeout(timer);
                client.close();
                resolve(this.parseResponse(msg));
            });

            client.on('error', (err) => {
                clearTimeout(timer);
                client.close();
                reject(err);
            });

            client.send(packet, 0, packet.length, this.port, this.ip);
        });
    }

    /**
     * Send command via TCP
     */
    async sendTCP(command, data = Buffer.alloc(0)) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            const packet = this.createHeader(command, this.sessionId, this.replyId++, data);

            const timer = setTimeout(() => {
                client.destroy();
                reject(new Error('Connection timeout'));
            }, this.timeout);

            client.connect(this.port, this.ip, () => {
                client.write(packet);
            });

            client.on('data', (msg) => {
                clearTimeout(timer);
                client.destroy();
                resolve(this.parseResponse(msg));
            });

            client.on('error', (err) => {
                clearTimeout(timer);
                client.destroy();
                reject(err);
            });
        });
    }

    /**
     * Send command (auto-select protocol)
     */
    async send(command, data = Buffer.alloc(0)) {
        if (this.protocol === 'tcp') {
            return this.sendTCP(command, data);
        }
        return this.sendUDP(command, data);
    }

    /**
     * Parse device response
     */
    parseResponse(buffer) {
        if (buffer.length < 8) {
            return { success: false, error: 'Invalid response' };
        }

        const command = buffer.readUInt16LE(0);
        const checksum = buffer.readUInt16LE(2);
        const sessionId = buffer.readUInt16LE(4);
        const replyId = buffer.readUInt16LE(6);
        const data = buffer.slice(8);

        return {
            success: command === REPLIES.CMD_ACK_OK || command === REPLIES.CMD_ACK_DATA,
            command,
            checksum,
            sessionId,
            replyId,
            data
        };
    }

    /**
     * Connect to device
     */
    async connect() {
        try {
            const response = await this.send(COMMANDS.CMD_CONNECT);
            if (response.success) {
                this.sessionId = response.sessionId;
                this.connected = true;
                return { success: true, message: 'Connected successfully' };
            }
            return { success: false, message: 'Connection failed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Disconnect from device
     */
    async disconnect() {
        if (this.connected) {
            try {
                await this.send(COMMANDS.CMD_EXIT);
            } catch (e) {
                // Ignore disconnect errors
            }
            this.connected = false;
            this.sessionId = 0;
        }
    }

    /**
     * Get device info/version
     */
    async getDeviceInfo() {
        try {
            const response = await this.send(COMMANDS.CMD_GET_VERSION);
            if (response.success && response.data.length > 0) {
                return {
                    success: true,
                    version: response.data.toString('utf8').replace(/\0/g, '').trim()
                };
            }
            return { success: false, message: 'Failed to get device info' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Get device time
     */
    async getTime() {
        try {
            const response = await this.send(COMMANDS.CMD_GET_TIME);
            if (response.success && response.data.length >= 4) {
                const time = response.data.readUInt32LE(0);
                const date = new Date((time + 946684800) * 1000); // Offset from 2000-01-01
                return { success: true, time: date };
            }
            return { success: false, message: 'Failed to get time' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Set device time
     */
    async setTime(date = new Date()) {
        try {
            const time = Math.floor(date.getTime() / 1000) - 946684800;
            const data = Buffer.alloc(4);
            data.writeUInt32LE(time, 0);
            const response = await this.send(COMMANDS.CMD_SET_TIME, data);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Get attendance logs
     */
    async getAttendanceLogs() {
        try {
            // Request attendance data
            await this.send(COMMANDS.CMD_REFRESHDATA);
            const response = await this.send(COMMANDS.CMD_ATTLOG_RRQ);

            if (response.success && response.data.length > 0) {
                const logs = this.parseAttendanceLogs(response.data);
                return { success: true, logs };
            }
            return { success: true, logs: [] };
        } catch (error) {
            return { success: false, message: error.message, logs: [] };
        }
    }

    /**
     * Parse attendance log data
     */
    parseAttendanceLogs(data) {
        const logs = [];
        const recordSize = 40; // Standard ZKTeco log record size

        for (let i = 0; i < data.length; i += recordSize) {
            if (i + recordSize > data.length) break;

            const record = data.slice(i, i + recordSize);
            const userId = record.slice(0, 9).toString('utf8').replace(/\0/g, '').trim();
            const timestamp = record.readUInt32LE(24);
            const status = record.readUInt8(28);
            const punchType = record.readUInt8(29);

            if (userId) {
                const date = new Date((timestamp + 946684800) * 1000);
                logs.push({
                    userId,
                    timestamp: date.toISOString(),
                    date: date.toISOString().split('T')[0],
                    time: date.toTimeString().slice(0, 8),
                    status,
                    punchType, // 0: Check-In, 1: Check-Out, 2: Break-Out, 3: Break-In, 4: OT-In, 5: OT-Out
                    verified: status > 0
                });
            }
        }

        return logs;
    }

    /**
     * Get all users from device
     */
    async getUsers() {
        try {
            await this.send(COMMANDS.CMD_REFRESHDATA);
            const response = await this.send(COMMANDS.CMD_USERTEMP_RRQ);

            if (response.success && response.data.length > 0) {
                const users = this.parseUsers(response.data);
                return { success: true, users };
            }
            return { success: true, users: [] };
        } catch (error) {
            return { success: false, message: error.message, users: [] };
        }
    }

    /**
     * Parse user data
     */
    parseUsers(data) {
        const users = [];
        const recordSize = 72; // User record size varies by device

        for (let i = 0; i < data.length; i += recordSize) {
            if (i + recordSize > data.length) break;

            const record = data.slice(i, i + recordSize);
            const userId = record.slice(0, 9).toString('utf8').replace(/\0/g, '').trim();
            const name = record.slice(11, 35).toString('utf8').replace(/\0/g, '').trim();
            const privilege = record.readUInt8(10);
            const password = record.slice(35, 43).toString('utf8').replace(/\0/g, '').trim();
            const cardNumber = record.slice(43, 48).toString('hex');

            if (userId) {
                users.push({
                    userId,
                    name,
                    privilege, // 0: User, 1: Enroller, 2: Manager, 14: Super Admin
                    password,
                    cardNumber
                });
            }
        }

        return users;
    }

    /**
     * Add/Update user on device
     */
    async setUser(userId, name, privilege = 0, password = '', cardNumber = '') {
        try {
            const data = Buffer.alloc(72);
            Buffer.from(userId.padEnd(9, '\0')).copy(data, 0);
            data.writeUInt8(privilege, 10);
            Buffer.from(name.padEnd(24, '\0')).copy(data, 11);
            Buffer.from(password.padEnd(8, '\0')).copy(data, 35);
            Buffer.from(cardNumber.padStart(10, '0'), 'hex').copy(data, 43);

            const response = await this.send(COMMANDS.CMD_USER_WRQ, data);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Delete user from device
     */
    async deleteUser(userId) {
        try {
            const data = Buffer.from(userId.padEnd(9, '\0'));
            const response = await this.send(COMMANDS.CMD_DELETE_USER, data);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Clear all attendance logs
     */
    async clearAttendanceLogs() {
        try {
            const response = await this.send(COMMANDS.CMD_CLEAR_ATTLOG);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Restart device
     */
    async restart() {
        try {
            const response = await this.send(COMMANDS.CMD_RESTART);
            this.connected = false;
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Enable device
     */
    async enable() {
        try {
            const response = await this.send(COMMANDS.CMD_ENABLEDEVICE);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Disable device
     */
    async disable() {
        try {
            const response = await this.send(COMMANDS.CMD_DISABLEDEVICE);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Test voice
     */
    async testVoice() {
        try {
            const response = await this.send(COMMANDS.CMD_TESTVOICE);
            return { success: response.success };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Get device capacity and usage
     */
    async getCapacity() {
        try {
            const response = await this.send(COMMANDS.CMD_GET_FREE_SIZES);
            if (response.success && response.data.length >= 92) {
                const data = response.data;
                return {
                    success: true,
                    capacity: {
                        userCount: data.readUInt32LE(16),
                        userCapacity: data.readUInt32LE(4),
                        fingerCount: data.readUInt32LE(24),
                        fingerCapacity: data.readUInt32LE(12),
                        logCount: data.readUInt32LE(40),
                        logCapacity: data.readUInt32LE(32),
                        faceCount: data.readUInt32LE(80) || 0,
                        faceCapacity: data.readUInt32LE(72) || 0
                    }
                };
            }
            return { success: false, message: 'Failed to get capacity' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

/**
 * ZKTeco Device Manager
 * إدارة مجموعة من الأجهزة
 */
class ZKTecoManager {
    constructor() {
        this.devices = new Map();
    }

    /**
     * Add device to manager
     */
    addDevice(id, ip, port = 4370, protocol = 'udp') {
        const device = new ZKTecoDevice(ip, port, 5000, protocol);
        this.devices.set(id, device);
        return device;
    }

    /**
     * Remove device from manager
     */
    removeDevice(id) {
        const device = this.devices.get(id);
        if (device) {
            device.disconnect();
            this.devices.delete(id);
        }
    }

    /**
     * Get device by ID
     */
    getDevice(id) {
        return this.devices.get(id);
    }

    /**
     * Test connection to device
     */
    async testConnection(ip, port = 4370, protocol = 'udp') {
        const device = new ZKTecoDevice(ip, port, 5000, protocol);
        try {
            const result = await device.connect();
            if (result.success) {
                const info = await device.getDeviceInfo();
                const time = await device.getTime();
                const capacity = await device.getCapacity();
                await device.disconnect();
                return {
                    success: true,
                    version: info.version || 'Unknown',
                    time: time.time || new Date(),
                    capacity: capacity.capacity || {}
                };
            }
            return { success: false, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Sync attendance from device
     */
    async syncAttendance(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            return { success: false, message: 'Device not found' };
        }

        try {
            if (!device.connected) {
                const connectResult = await device.connect();
                if (!connectResult.success) {
                    return { success: false, message: 'Failed to connect' };
                }
            }

            const logsResult = await device.getAttendanceLogs();
            await device.disconnect();

            return logsResult;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Sync all devices
     */
    async syncAllDevices() {
        const results = [];
        for (const [id, device] of this.devices) {
            const result = await this.syncAttendance(id);
            results.push({ deviceId: id, ...result });
        }
        return results;
    }

    /**
     * Get all device statuses
     */
    async getAllDeviceStatuses() {
        const statuses = [];
        for (const [id, device] of this.devices) {
            try {
                const connected = await device.connect();
                let status = {
                    deviceId: id,
                    ip: device.ip,
                    port: device.port,
                    online: connected.success,
                    lastCheck: new Date().toISOString()
                };

                if (connected.success) {
                    const capacity = await device.getCapacity();
                    status.capacity = capacity.capacity;
                    await device.disconnect();
                }

                statuses.push(status);
            } catch (error) {
                statuses.push({
                    deviceId: id,
                    ip: device.ip,
                    port: device.port,
                    online: false,
                    error: error.message
                });
            }
        }
        return statuses;
    }
}

// Export singleton manager
export const zktecoManager = new ZKTecoManager();
export { ZKTecoDevice, ZKTecoManager, COMMANDS, REPLIES };
export default ZKTecoDevice;
