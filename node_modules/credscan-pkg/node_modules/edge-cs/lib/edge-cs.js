var path = require('path');

exports.getCompiler = function () {
	return process.env.EDGE_CS_NATIVE || (process.env.EDGE_USE_CORECLR ? 'Edge.js.CSharp' : path.join(__dirname, 'edge-cs.dll'));
};

exports.getBootstrapDependencyManifest = function() {
	return path.join(__dirname, 'bootstrap', 'bin', 'Release', 'netstandard1.6', 'bootstrap.deps.json');
}
