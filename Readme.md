NorthWatcher
============

NorthWatcher is cron for filesystem changes.

Each line in your watch file specifies a directory to watch and a command to run when changes occur in that directory. You may optionally specify the kind of changes that will trigger the command.

Lines that begin with # are comments. No trailing comments.

The watch file resides at `~/.northwatcher` and looks like this:

    # triggers when files are created or removed in /etc
    /etc notify-the-admin.sh
    
    # triggerz when you save pikcherz of teh kittehz
    + Pictures rbx post-to-twitter.rb
    
    # triggers when files are removed from the ~/todo directory
    - todo update-remote-todo-list.sh

So each line has an optional trigger followed by a directory and then a command. The triggers are:

  * `+`: files are created
  * `-`: files are removed

You can use one or both of these, if you omit the trigger then both creations and removals are monitored.

No frills.

Potential Gotchas
=================

No spaces in filenames.

If you actually want to watch `/etc` it seems like you need root privs. I don't need this behaviour so I'm not likely to fix it.

Installation
============

Node nerd? It's just an `npm i --global northwatcher` away. Otherwise you'll need to [install node and npm](https://gist.github.com/579814) and then run the aforementioned command.

Once it's installed just run `northwatcher` from the command line. It does not daemonize itself, it only logs to stdout, and it doesn't run at startup. It's barely beyond "hack" status.

Licensing
=========

Copyright 2011 Sami Samhuri

MIT License
