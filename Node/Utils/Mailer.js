const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: 'selibrarysystem@gmail.com',
        pass: 'fgSN$Nt7o#@@mP9?'
    }
});


exports.sendEmail = function(to,sub,msg,callback) {
    let mailOptions = {
        from: 'selibrarysystem@gmail.com',
        to: to,
        subject: sub,
        text: msg
    };

    transporter.sendMail(mailOptions, function(err,info) {
        if (err) console.log(err);
        callback(err, true);
    });
    
};