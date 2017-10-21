/**
 * Simple userland CPU profiler using v8-profiler
 * Usage: require('[path_to]/CpuProfiler').init('datadir')
 *
 * @module CpuProfiler
 * @type {exports}
 */

var fs = require('fs');
var profiler = require('v8-profiler');
var _datadir = null;
var _name = null;
/**
 * Init and schedule profiler runs
 *
 * @param datadir Folder to save the data to
 */
function init(datadir, name) {
    _datadir = datadir;
    _name = name
    setInterval(startProfiling, 30 * 1000);
};

/**
 * Starts profiling and schedules its end
 */
function startProfiling() {
    var stamp = Date.now();
    var id = _name + '-profile-' + stamp;

    // Use stdout directly to bypass eventloop
    fs.writeSync(1, 'Start profiler with Id [' + id + ']\n');

    // Start profiling
    profiler.startProfiling(id);


    // Schedule stop of profiling in x seconds
    setTimeout(function () {
        stopProfiling(id)
    }, 5000);
}

/**
 * Stops the profiler and writes the data to a file
 * @param id the id of the profiler process to stop
 */
function stopProfiling(id) {
    var profile = profiler.stopProfiling(id);
    fs.writeFile(_datadir + '/' + id + '.cpuprofile', JSON.stringify(profile), function () {
        console.log('Profiler data written');
    });
}

module.exports = init;

