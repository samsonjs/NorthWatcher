// NorthWatcher by Sami Samhuri 2011 MIT
//
// TODO:
//  - fork & run headless
//  - watch .northwatcher and automatically reload changes, rolling back on errors
//  - simple globbing
//  - watching regular files for changes (simple case of globbing really)
//  - support spaces in filenames (need a real parser instead of the regex stuff)
//
// Possible TODOs, may be out of scope:
//  - watch files and/or directories for modifications
//  - mail output to MAILTO
//  - *maybe* a minimum interval at which commands are run, e.g. at most once every 5 minutes

var fs = require('fs')

function main() {
  var path = require('path')
    , eachLine = require('batteries').FileExt.eachLine
    , rcFile = require('path').join(process.env.HOME, '.northwatcher')

  fs.stat(rcFile, function(err, s) {
    if (err) {
      spiel()
      return
    }

    eachLine(rcFile, function(line) {
      // ignore comments and blank lines
      if (line.match(/^\s*(#.*|)?$/)) {
        console.log('>>> ignoring: "' + line + '"')
        return
      }

      line = line.trim() // don't want to match \s* everywhere

      // <trigger> <dir> <command>
      var m
      if (m = line.match(/^([-+]{0,2})\s*(\S+)\s*(.+)$/i)) {
        var trigger = m[1] || '+-' // default watches for both
          , dir = m[2]
          , command = m[3]
          , options = { create: trigger.indexOf('+') !== -1
                      , remove: trigger.indexOf('-') !== -1
                      , command: command
                      }
        if (dir.charAt(0) !== '/') dir = path.resolve(process.env.HOME, dir)
        ensureDirectory(dir)
        console.log('>>> watch line, trigger: ' + trigger + ', dir: ' + dir + ', command: ' + command)
        watch(dir, options)
      }

      // if you're happy and you know it, syntax error!
      else {
        throw new Error('syntax error: ' + line)
      }
    })
  })
}

function ensureDirectory(dir) {
  var s
  try {
    s = fs.statSync(dir)
  }
  catch (e) {
    throw new Error('directory does not exist: ' + dir)
  }
  if (!s.isDirectory()) {
    throw new Error('not a directory: ' + dir)
  }
}

var watchedDirs = {}
  , files = {}

function watch(dir, options) {
  if (dir in watchedDirs) {
    console.log('>>> first watcher for ' + dir)
    watchedDirs[dir].push(options)
  }
  else {
    console.log('>>> adding watcher for ' + dir)
    watchedDirs[dir] = [options]
    files[dir] = ls(dir)
    fs.watchFile(dir, watcherForDir(dir, options))
  }
}

function watcherForDir(dir, options) {
  return function(curr, prev) {
    // bail if no changes
    if (curr.mtime <= prev.mtime) return
    var newFiles = ls(dir)
      , c = unset(setDiff(newFiles, files[dir]))
      , r = unset(setDiff(files[dir], newFiles))
    files[dir] = newFiles
    console.log('>>> ' + dir + ' changed! c: ' + JSON.stringify(c) + ' r: ' + JSON.stringify(r))
    watchedDirs[dir].forEach(function(o) {
      if (c.length > 0 && o.create || r.length > 0 && o.remove) {
        runCommand({ command: o.command
                   , dir: dir
                   , created: c
                   , removed: r
                   })
      }
    })
  }
}

function runCommand(options) {
  console.log('>>> running command: ' + options.command)
  var spawn = require('child_process').spawn
    // TODO quoting
    , args = options.command.split(/\s+/)
    , cmd = args.shift()
  process.env.WATCH_DIR = options.dir
  process.env.WATCH_CREATED = JSON.stringify(options.created)
  process.env.WATCH_REMOVED = JSON.stringify(options.removed)
  console.log('WATCH_DIR=' + process.env.WATCH_DIR)
  console.log('WATCH_CREATED=' + process.env.WATCH_CREATED)
  console.log('WATCH_REMOVED=' + process.env.WATCH_REMOVED)
  console.log('cmd:  ' + cmd)
  console.log('args: ' + args.join(' '))
  spawn(cmd, args).stdout.on('data', function(x) {
    console.log('child>>> ' + x)
  })
}

function ls(dir) {
  return set(fs.readdirSync(dir))
}

function set(elems) {
  if (!Array.isArray(elems)) elems = [].slice.call(arguments)
  return elems.reduce(function(set, x) {
    set[x] = x
    return set
  }, {})
}

function unset(set) {
  return Object.keys(set)
}

function setDiff(a, b) {
  var d = {}
    , x
  for (x in a) if (!(x in b)) d[x] = a[x]
  return d
}

function spiel() {
  [ "NorthWatcher is cron for filesystem changes."
  , ""
  , "Each line in your watch file specifies a directory to watch and a"
  , "command to run when changes occur in that directory. You may"
  , "optionally specify the kind of changes that will trigger the"
  , "command."
  , ""
  , "Lines that begin with # are comments. No trailing comments."
  , ""
  , "The watch file resides at `~/.northwatcher` and looks like this:"
  , ""
  , "    # triggers when files are created or removed in /etc"
  , "    /etc notify-the-admin.sh"
  , ""
  , "    # triggerz when you save pikcherz of teh kittehz"
  , "    + Pictures rbx post-to-twitter.rb"
  , ""
  , "    # triggers when files are removed from the ~/todo directory"
  , "    - todo update-remote-todo-list.sh"
  , ""
  , "So each line has an optional trigger followed by a directory and"
  , "then a command. The triggers are:"
  , ""
  , "    +  files are created"
  , "    -  files are removed"
  , ""
  , "You can use one or both of these, if you omit the trigger then"
  , "both creations and removals are monitored."
  , ""
  , "No frills."
  , ""
  , "Create a watch file and then run NorthWatcher again."
  ].forEach(function(s) { console.log(s) })
}

if (require.main === module) main()