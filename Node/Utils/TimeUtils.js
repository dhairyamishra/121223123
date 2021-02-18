
// function to ensure constant-width of a number
function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

// function to add new format to Date object
Date.prototype.toISONormString = function() {
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        ' ' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds());
};


// implementation of the new Date prototype
exports.formatTime = function(Date) {
    return Date.toISONormString()
}

// gets the current time plus any offsets
exports.getTime = function(yearOffset=0,monthOffset=0,dayOffset=0,hourOffset=0,minuteOffset=0,secondOffset=0) {
    //Get the current date
    var date = new Date();

    //Apply offsets to the current date
    date.setFullYear(date.getFullYear() + yearOffset);
    date.setMonth(date.getMonth() + monthOffset);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(date.getHours() + hourOffset);
    date.setMinutes(date.getMinutes() + minuteOffset);
    date.setSeconds(date.getSeconds() + secondOffset);

    //Assemble the date
    //Date format: "YYYY-MM-DD HH:MM:SS"
    var dateAssembled = date.toISONormString().replace('T', ' ').substring(0, 19);

    //Return the assembled date
    return dateAssembled;
}