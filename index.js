const fs = require('fs');
const path = require('path');
const _ = require('lodash');

if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}
const log4js = require('log4js');
const logger = log4js.getLogger('index');

logFilename = 'logs/log';
log4js.addLayout('json', function (config) {
    return function (logEvent) {
        logEvent.caller = logEvent.fileName + ':' + logEvent.lineNumber;
        return JSON.stringify(logEvent) + config.separator;
    };
});

log4js.configure({
    appenders: {
        out: {
            type: 'console',
        },
        task: {
            type: 'dateFile',
            // layout: { type: 'json', separator: ',' },
            filename: logFilename,
            alwaysIncludePattern: true,
            numBackups: 15,
        },
    },
    categories: {
        default: {
            appenders: ['out', 'task'],
            level: 'INFO',
            enableCallStack: true,
        },
    },
});


const si = require('systeminformation');
const os = require('os');

// 讀取系統設定檔
// const config = require('./config.json');
let config = {};
const configFile = path.join('./config.json').normalize();
const hasFile = fs.existsSync(configFile);
logger.info('load configFile', hasFile, configFile);
if (hasFile) {
    try {
        const file = fs.readFileSync(configFile, 'utf8');
        config = JSON.parse(file);
        logger.info('config', config);
    } catch (err) {
        logger.error(err);
    }
}

const getSystemInfo = () => {
    // 取得系統基本資訊 disk, memory, cpu
    return new Promise((resolve, reject) => {
        let systeminfo = {};
        let taskList = [];
        let xList = [
            ['disk', si.fsSize()],
            ['inetLatency', si.inetLatency(config.inet_target_host)],
            ['networkStats', si.networkStats()],
            ['networkInterfaces', si.networkInterfaces()],            
            ['inetChecksite', si.inetChecksite('http://127.0.0.1:3000')],
            ['inetChecksite2', si.inetChecksite('http://www.google.com')],
            ['memory', si.mem()],
            ['cpu', si.currentLoad()],
            ['time', si.time()],
        ];
        for (let item of xList) {
            taskList.push(item[1]);
        }

        let complete = Promise.all(taskList);
        complete.then((result) => {
            for (let i = 0; i < xList.length; i++) {
                let aKey = xList[i][0];
                systeminfo[aKey] = result[i];
            }

            resolve(systeminfo);
        }).catch((err) => {
            reject(err);
        });
    });
}

const Database = require('./src/Database');
const aDatabase = new Database();

const mainLoop = async () => {
    // 收集系統資訊，寫入 MonitorInfo
    let si = await getSystemInfo();
    // logger.info(si);
    si.host = os.hostname();
    aDatabase.updateInfo(si);
}

// 資料庫連線
aDatabase.connect(config.db_ip, config.db_port, config.db_user, config.db_password, config.db_name).then(() => {
    mainLoop();
    setInterval(function () {
        mainLoop();
    }, config.query_period);
}).catch((error) => {
    console.error(error);
});
