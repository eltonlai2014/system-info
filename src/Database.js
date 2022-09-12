const log4js = require('log4js');
const logger = log4js.getLogger('Database');
const Sequelize = require('sequelize');
const MonitorDbHandler = require('./MonitorDbHandler');
// const pg = require('pg'); 

class Database {
    constructor(options) {
        this.dataHandlers = {};
        // this.reset = options.reset || false;
    }

    connect(ip, port, db_user, db_password, db_name, db_pool_max) {
        const self = this;
        let retry = false;
        // this.reset = false;
        db_pool_max = db_pool_max || 20
        const initializeDataHandlers = async (db, dataHandlers) => {
            const monitorHandler = new MonitorDbHandler(db);
            try {
                await monitorHandler.sync({ reset: self.reset });

                dataHandlers['MonitorDbHandler'] = monitorHandler;
                logger.info('DataHandler are initialized');
            } catch (error) {
                logger.error('DataHandler initialized error', error);
            }

        };

        // Retry connect if the DB server is starting...
        const _connect = function () {
            return new Promise((resolve, reject) => {
                self.db.authenticate()
                    .then(() => {
                        return initializeDataHandlers(self.db, self.dataHandlers);
                    })
                    .then(() => {
                        logger.info(`Database ${db_user} is connected`);
                        resolve();
                    })
                    .catch((err) => {
                        logger.error(err);
                        if (!retry || err.original.code === '57P03') { // 57P03: cannot_connect_now
                            // 第一次連不上2秒後重新嚐試，如果還連不上就10秒後再試
                            let timeout = 10000;
                            setTimeout(() => {
                                resolve(_connect());
                            }, timeout);
                        } else {
                            reject(err);
                        }
                    });
            });
        };

        logger.info('Intializing database client');
        this.db = new Sequelize(db_user, db_name, db_password, {
            // benchmark: true,
            logging: true,
            dialect: 'postgres',
            // dialectModule: 'pg',
            host: ip,
            port: port,
            pool: {
                acquire: 20000,
                min: 1,
                max: db_pool_max,
            },
        });
        return _connect();
    }

    updateInfo(info) {
        logger.info('updateInfo');
        this.dataHandlers['MonitorDbHandler'].updateInfo(info);
    }
}

module.exports = Database;
