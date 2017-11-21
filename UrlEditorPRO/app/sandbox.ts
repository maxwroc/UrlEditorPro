window.addEventListener('message', function(event) {
    var command = event.data.command;
    var name = event.data.name || 'hello';
    switch(command) {
        case 'eval':
            try {
                var result = eval(event.data.value);
                event.source.postMessage({
                    result: result
                }, event.origin);
            }
            catch (e) {
                event.source.postMessage({
                    error: e.message
                }, event.origin);
            }
            break;
    }
});