const gcProfiler = require('gc-profiler')
const fs = require('fs')

const init = (path, filename) => {
  // let markAndSweep = { datasets: { data:[] }};
  // let scavenge = { datasets: { data: [] }};
  let index = 0;
  let mixed = [
    {
      labels: [],
      datasets: [
        {
          label: "Scavenge",
          fillColor: "rgba(120,120,120,0.2)",
          data: []
        }
      ]
    },
    {
      labels: [],
      datasets: [
        {
          label: "Mark and Sweep",
          fillColor: "rgba(220,220,220,0.2)",
          data: []
        }
      ]
    },
    {
      labels: [],
      datasets: [
        {
          label: "MemoryUsage",
          fillColor: "rgba(220,220,220,0.2)",
          data: []
        }
      ]
    }
  ];


  gcProfiler.on('gc', function (info) {
    let stats = process.memoryUsage();

    if (info.type == 'Scavenge') {
      mixed[0].datasets[0].data.push(info.duration)
      // scavenge.datasets.data.push({ x: info.date, y: info.duration })
    } else if (info.type == 'MarkSweepCompact') {
      mixed[0].datasets[0].data.push(info.duration)
      // markAndSweep.datasets.data.push({ x: info.date, y: info.duration })
    }

    let time = new Date(info.date).getTime();

    mixed[2].datasets[0].data.push(stats.heapUsed);

    mixed[2].labels.push(time);
    mixed[0].labels.push(time);
    mixed[1].labels.push(time);
    index++;
  });

  process.on('SIGINT', () => {
    fs.writeFile(`${path}/${filename}_${Date.now()}.gc`, JSON.stringify(mixed), (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
      process.exit(0);
    });
  });
}

module.exports = { init };