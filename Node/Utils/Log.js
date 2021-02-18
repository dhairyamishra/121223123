var winston = require('winston');
    
    const expressWinston = require('express-winston'); // module for easy logging in express
    require('winston-daily-rotate-file'); // module to rotate log files easily
var fs = require('fs');
// const { logger } = require('express-winston');


var content = fs.readFileSync('../bin/setup.json');
// function(err,content) {
    
//     // adds logger
//     // winston.loggers.add('logger',{ logger
        
//     // });
//     // module.exports = log;
//     // winston.loggers.add(log);
    
//     // exports.log = winston.loggers.get('logger');
// }

var setup = JSON.parse(content);

var days = setup.log_folder_lifetime_days+'d'; // formats the lifetime from the setup folder
if (days = '0d') days = null; // if the lifetime is 0 days, never delete files

// global.log = new winston.createLogger({
winston.loggers.add('clog',{
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.simple()
        }),
        new winston.transports.DailyRotateFile({
            filename: setup.log_folder + 'consoleOutput-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxFiles: days,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        new winston.transports.DailyRotateFile({
            level: 'silly',
            filename: setup.log_folder + 'req-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: days,
            maxSize: '24m',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

init();

function init() {
    var clog = winston.loggers.get('clog');
    exports.clog = clog;
}
