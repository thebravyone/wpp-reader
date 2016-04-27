/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:44:56
* @Last modified by:   Guilherme Serradilha
* @Last modified time: 26-Apr-2016, 22:51:22
*/

///PSEUDO CODE

// Opens a text file
var openFile = function(path) {
    return fs.readFileSync(path, 'utf8');
}

// Removes semicolons from given text
var sanitaze = function(text) {
    return text.replace(new RegExp(';', 'g'), '.');
}

// Fixes entries so each line represents one entry with its timestamp
var fixEntries = function(entries) {
    var fixedEntries = [];
    for (var i = 0, f = 0; i < entries.length; i++) {

        // check if entry has timestamp
        var isTimestamp = moment(entries[i].split(' -')[0].replace('h', ':'), 'DD/MM/YY, HH:mm', true).isValid();

        if (typeof fixedEntries[0] === 'undefined') {
            if (isTimestamp) { fixedEntries[f] = entries[i]; } // add first item
            else { continue; }  // ignore fragment
        } else {
            //add new item
            if (isTimestamp) {
                f++;
                fixedEntries[f] = entries[i];
            } else { fixedEntries[f] += ' ' + entries[i]; } // append to previous
        }
    }

    return fixedEntries;
}

// Maps data in a "timestamp + content" object
var mapTimestamps = function(entries) {

    var mappedObject = [];

    for (var e in entries) {
        if (entries.hasOwnProperty(e)) {

            var data = entries[e].split(' - ');

            mappedObject[e] =
            {
                timestamp: data[0].replace('h', ':'),
                content: sanitaze(data[1])
            }

        }
    }

    return mappedObject;
}

// Sorts data as either Message or Event
var sort = function(mappedObject) {

    var events = [],
        messages = [];

    for (var o in mappedObject) {
        if (mappedObject.hasOwnProperty(o)) {

            // look for user's token
            var data = mappedObject[o]['content'].replace(': ', ';').split(';');

            // if it was posted by an user then data.length > 1
            if (data.length > 1) {
                messages.push({
                    timestamp: mappedObject[o]['timestamp'],
                    user: data[0],
                    text: emoji.toShort(data[1]) // convert emojis to snippets
                });
            } else {
                events.push({
                    timestamp: mappedObject[o]['timestamp'],
                    text: data[0]
                });
            }
        }
    }

    return sortedObject =
    {
        messages: messages,
        events: events
    };
}
