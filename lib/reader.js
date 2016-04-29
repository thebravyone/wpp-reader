/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:44:56
* @Last modified by:   Guilherme Serradilha
* @Last modified time: 28-Apr-2016, 23:46:12
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
     * Retrieves an object {events, messages}
     * @return {{events[], messages[]}}
     */
    self.getData = function() {
        return parsedData;
    }

    /**
     * Stats from parsed file
     * @return {object}
     */
    self.stats = function() {

        var mediaCount   = 0,
            missingMedia = 0;
        for (var i = 0; i < parsedData['messages'].length; i++) {
            if (parsedData['messages'][i]['media'] === 'mídia omitida')
                missingMedia++;
            else if (parsedData['messages'][i]['media'] !== '')
                mediaCount++;
        }

        return {
            "total-messages": parsedData['messages'].length,
            "total-events"  : parsedData['events'].length,
            "media-files"   : mediaCount,
            "media-missing" : missingMedia
        }
    }

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
                    content: sanitize(data[1])
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
    function sanitize(text) {
        return text.replace(new RegExp(';', 'g'), '.');
    }

    return self;
}

module.exports = reader;
