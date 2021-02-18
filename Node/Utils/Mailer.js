const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: 'ordossystem@gmail.com',
        pass: '68turquoiseostrich@'
    }
});


exports.sendEmail = function(to,sub,msg,callback) {
    let mailOptions = {
        from: 'ordossystem@gmail.com',
        to: to,
        subject: sub,
        text: msg
    };

    transporter.sendMail(mailOptions, function(err,info) {
        if (err) console.log(err);
        callback(err, true);
    });
    
};