var fs = require('fs')
var path = require('path');
var childProcess = require('child_process');

function whereis() {
    var pathSep = process.platform === 'win32' ? ';' : ':';

    var directories = process.env.PATH.split(pathSep);

    for (var i = 0; i < directories.length; i++) {
    	for (var j = 0; j < arguments.length; j++) {
    		var filename = arguments[j];
	        var filePath = path.join(directories[i], filename);

	        if (fs.existsSync(filePath)) {
	            return filePath;
	        }
	    }
    }

    return null;
}

var dotnetPath = whereis('dotnet', 'dotnet.exe');

if (dotnetPath) {
	childProcess.spawn(dotnetPath, ['restore'], {
		cwd: path.join(__dirname, '..', 'lib', 'bootstrap'),
		stdio: 'inherit'
	}).on('close', function() {
		childProcess.spawn(dotnetPath, ['build', '--configuration', 'Release'], {
			cwd: path.join(__dirname, '..', 'lib', 'bootstrap'),
			stdio: 'inherit'
		});
	});
}
