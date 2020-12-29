const express = require('express');
const jssoup = require('jssoup').default;
const request = require('request');
const fs = require('fs');
const jsonexport = require('jsonexport');
var html_tablify = require('html-tablify');

const app = express();

const alternativeArray = [];
app.get('/', function (req, res) {
    scrapePageUtility(1, res);
});


const scrapePageUtility = (serachPageNo, res) => {
    const searchURL = serachPageNo == 1 ? 'https://alternativeto.net/platform/windows/' : 'https://alternativeto.net/platform/windows/?p=' + serachPageNo;
    request(searchURL, function (error, response, body) {
        if (error) {
            console.error('error:', error);
            res.send('<h4>Error Occured while fetchhing data<h4>');
            return;
        }
        if (response && response.statusCode == 200) {
            const soup = new jssoup(body);
            const allLi = soup.findAll('li');
             for (let iter of allLi) {
                if (iter.attrs['data-testid'] && alternativeArray.length < 100) {
                    alternativeArray.push(iter)
                }
            }

            if (alternativeArray.length < 100) {
                scrapePageUtility(serachPageNo + 1, res);
            } else {
                const dataArray = [];
                let rank = 1;
                for (const alternative of alternativeArray) {
                    dataArray.push({
                        Rank: rank,
                        Name: alternative.find('a').contents[0]._text,
                        LandingPage: 'https://alternativeto.net' + alternative.find('a').attrs.href,
                        Description: alternative.find('span', 'server-rendered-content').contents[0]._text
                    });
                    rank = rank+1;
                }

                jsonexport(dataArray, function(err, csv){
                    if(err) {
                        console.error(err);
                        res.send('<h4>Error Occured while creating CSV<h4>');
                        return;
                    }
                    fs.writeFileSync('out.csv', csv);
                    let options = {
                        data: dataArray
                    };
                    const html_data = '<div>' +  html_tablify.tablify(options) + '</div>';
                    res.send('<h3><center>Alternative To Windows</center></h3><a href="download">CLICK TO DOWNLOAD THE CSV FILE</a> <br> <br> ' + html_data);
                });
            }
        }
    }); 
}

app.get('/download', function(req, res){
    const file = `${__dirname}/out.csv`;
    res.download(file);
});


// start the server in the port 3000 !
app.listen(3000, function () {
    console.log('Server started - Listening on port 3000.');
});