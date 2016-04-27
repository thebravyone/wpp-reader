/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:44:56
* @Last modified by:   Guilherme Seradilha
* @Last modified time: 27-Apr-2016 17:20:33
*/

const moment = require('moment');
const emoji  = require('emojione');

var reader = function(text, inputTimestamp, outputTimestamp) {

    // arg validation
    if (!text || typeof text !== 'string') throw new Error('"text" parameter is either missing or invalid');
    if (!inputTimestamp || typeof inputTimestamp !== 'string') throw new Error('"inputTimestamp" parameter is either missing or invalid');
    if (!outputTimestamp || typeof outputTimestamp !== 'string') throw new Error('"inputTimestamp" parameter is either missing or invalid');

    var entries    = fixEntries(text.split('\n'), inputTimestamp),
        parsedData = sort(mapTimestamps(entries, inputTimestamp, outputTimestamp));

    /**
     * Retrieves an array of csv files
     * @return {string[]}
     */
    /*self.getCSV = function(identifier, addHeader) {

        // arg validation
        if (!identifier || typeof identifier !== 'string') throw new Error('"identifier" parameter is either missing or invalid');
        if (!addHeader || typeof addHeader !== 'boolean') addHeader = false;

        var files = {};
        for (var obj in parsedData) {
            if (parsedData.hasOwnProperty(obj)) {
                files[obj] = generateCSV(parsedData[obj], identifier, addHeader);
            }
        }
        return files;
    };*/

    /**
     * Retrieves an object {events, messages}
     * @return {{events[], messages[]}}
     */
    self.getData = function() {
        return parsedData;
    }

    /**
     * Retrieves a JSON file {events, messages}
     * @return {string}
     */
    self.getJSON = function() {
        return JSON.stringify(parsedData, null, 4);
    };

    /**
     * Fixes multi-line entries looking for timestamps
     * @param  {string[]}   entries        - array of multi-line entries
     * @param  {string}     inputTimestamp - format to validate timestamps
     * @return {string[]}                  - array of single-line entries
     */
    function fixEntries(entries, inputTimestamp) {
        var fixedEntries = [];
        for (var i = 0, f = 0; i < entries.length; i++) {

            // check if entry has timestamp
            var isTimestamp = moment(entries[i].split(' -')[0].replace('h', ':'), inputTimestamp, true).isValid();

            // in case current entry has a timestamp
            // create a new instace, else append to previous
            if (typeof fixedEntries[0] === 'undefined') {
                if (isTimestamp) { fixedEntries[f] = entries[i]; } // add first item
                else { continue; }  // ignore fragment
            } else {
                if (isTimestamp) {
                    f++;//add new item
                    fixedEntries[f] = entries[i];
                } else { fixedEntries[f] += ' ' + entries[i]; } // append to previous
            }
        }
        return fixedEntries;
    }

    /**
     * Maps entries in a {timestamp, content} object
     * @param  {string[]} entries         - array of single-line entries
     * @param  {string}   inputTimestamp  - format to validate timestamps
     * @param  {string}   outputTimestamp - format to record timestamps
     * @return {{timestamp, content}[]}
     */
    function mapTimestamps (entries, inputTimestamp, outputTimestamp) {

        var mappedObject = [];

        for (var e in entries) {
            if (entries.hasOwnProperty(e)) {

                var data = entries[e].split(' - ');

                mappedObject[e] = {
                    timestamp: moment(data[0].replace('h', ':'), inputTimestamp).format(outputTimestamp),
                    content: sanitaze(data[1])
                }
            }
        }
        return mappedObject;
    }

    /**
     * Sorts data as either Message or Event
     * @param  {{timestamp, content}[]}  mappedObject - {timestamp, content} object
     * @return {{message, events}[]}
     */
    function sort(mappedObject) {

        var events = [],
            messages = [];

        for (var o in mappedObject) {
            if (mappedObject.hasOwnProperty(o)) {

                // look for user's token
                var data = mappedObject[o]['content'].replace(': ', ';').split(';');

                // if it was posted by an user then data.length > 1
                if (data.length > 1) {

                    var text = '', media = '';

                    // check for media content
                    if (data[1] == "<Mídia omitida>") {
                        media = 'mídia omitida';
                    } else if (data[1].indexOf('(arquivo anexado)') !== -1) {
                        var msgContent = data[1].split(' (arquivo anexado)');
                        media = msgContent[0];
                        if (msgContent[1]) text = emoji.toShort(msgContent[1]).trim();
                    } else {
                        text = emoji.toShort(data[1]);
                    }

                    messages.push({
                        timestamp: mappedObject[o]['timestamp'],
                        user: data[0],
                        text: text,
                        media: media
                    });
                } else {
                    events.push({
                        timestamp: mappedObject[o]['timestamp'],
                        text: data[0]
                    });
                }
            }
        }

        return {
            messages: messages,
            events: events
        };
    }

    /**
     * Sanitazes text with csv-safe characters
     * @param  {string} text
     * @return {string}
     */
    function sanitaze(text) {
        return text.replace(new RegExp(';', 'g'), '.');
    }

    /**
     * Creates a CSV based on given object
     * @param  {object}  obj        - data-source
     * @param  {string}  identifier - chat identifier (ie group name, user, etc.)
     * @param  {boolean} addHeader  - adds a header to csv
     * @return {string}
     */
    function generateCSV(obj, identifier, addHeader) {

        var csv = '',
            headers = Object.keys(obj[0]);

        // write headers
        if (addHeader) {
            csv += 'identifier;';
            for (var i = 0; i < headers.length; i++)
                csv += headers[i] + ';';
            csv += '\n';
        }

        // write content
        for (var i = 0; i < obj.length; i++) {
            csv += identifier + ';';
            for (var k in obj[i]) {
                if (obj[i].hasOwnProperty(k)) {
                    csv += obj[i][k] + ';';
                }
            }
            csv += '\n';
        }
        return csv;
    }

    return self;
}

module.exports = reader;
