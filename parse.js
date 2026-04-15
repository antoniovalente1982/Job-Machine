const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('Recruiting Pipeline.pdf');
pdf(dataBuffer).then(function(data) {
    console.log("PDF TEXT:\n" + data.text);
}).catch(console.error);
