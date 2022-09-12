const DatabaseHandler = require('./DatabaseHandler');
const Sequelize = require('sequelize');

class MonitorDbHandler extends DatabaseHandler {
    constructor(db) {
        super();
        this.Monitors = db.define('MonitorInfo', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            host: {
                type: Sequelize.STRING,
            },
            ip: {
                type: Sequelize.STRING,
            },
            disk: {
                type: Sequelize.DOUBLE,
                defaultValue: 0,
            },
            cpu: {
                type: Sequelize.DOUBLE,
                defaultValue: 0,
            },
            memory: {
                type: Sequelize.DOUBLE,
                defaultValue: 0,
            },
            inetLatency: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            sysUpTime: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            data: {
                type: Sequelize.JSONB,
            },
        }, 
        {
            updatedAt: false,
        }
        );
    }

    get model() {
        return this.Monitors;
    }

    sync(options) {
        if (typeof options === 'undefined') {
            options = {};
        }
        return this.Monitors.sync({ force: options.reset || false });
    }

    async updateInfo(aInfo) {
        console.log(aInfo);
        let monitorInfo = {};
        monitorInfo.host = aInfo.host;
        monitorInfo.ip = aInfo.networkInterfaces[0].ip4;
        monitorInfo.sysUpTime = aInfo.time.uptime;
        monitorInfo.cpu = aInfo.cpu.currentLoad;
        monitorInfo.memory = aInfo.memory.used / aInfo.memory.total;
        monitorInfo.disk = aInfo.disk[0].use;
        monitorInfo.inetLatency = aInfo.inetLatency;
        monitorInfo.data = aInfo.disk;
        await this.Monitors.create(monitorInfo);
    }
}

module.exports = MonitorDbHandler;
