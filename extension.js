const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const extension = ExtensionUtils.getCurrentExtension();

const prayTimes = extension.imports.PrayTimes;

const Owghat = new Lang.Class({
  Name: 'Owghat',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "Owghat", false);
    this.buttonText = new St.Label({
      text: _("Loading..."),
      y_align: Clutter.ActorAlign.CENTER
    });
    this.actor.add_actor(this.buttonText);
    this._buildMenu();
    this._refresh();
  },

  _buildMenu: function() {
    this.menu.removeAll();
    this.azan_keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha', 'midnight'];
    this.azan_labels = {
      fajr : 'اذان صبح',
      sunrise : 'طلوع آفتاب',
      dhuhr : 'اذان ظهر',
      asr : 'عصر',
      sunset : 'غروب آفتاب',
      maghrib : 'اذان مغرب',
      isha : 'عشا',
      midnight : 'نیمه شب'};
    this.azan = {};
    for(var i of this.azan_keys) {
      this.azan[i] = this._createMenuItem(_(this.azan_labels[i]));
    }
    this.azan_moment = false;
  },

  _createMenuItem: function(text) {
    let label_left = new St.Label({
        text: text
    });
    let label_right = new St.Label({
        text: _("...")
    });
    let item = new PopupMenu.PopupBaseMenuItem({
        reactive: false
    });
    item.actor.add(label_right, {
        expand: true
    });
    item.actor.add(label_left);
    this.menu.addMenuItem(item)
    return label_right;
  },

  _refresh: function () {
    this._refreshUI();
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));
    return true;
  },

  _refreshUI: function () {
    var date = new Date();
    var pt = prayTimes.prayTimes;
    pt.setMethod('Tehran');
    var times = pt.getTimes(date, [35.42, 51.25], 3.5);

    var min_time_diff = 9999999999999;
    var timeDiff = 0;
    var next_time = '';
    var time = new Date();
    while (next_time == '') {
      for(var i of this.azan_keys) {
        this.azan[i].set_text(times[i]);
        var u = false;
        
        var hm = times[i].split(':')
        var h = parseInt(hm[0]);
        var m = parseInt(hm[1]);
        time.setHours(h, m)
        timeDiff = time.getTime() - date.getTime();
        var f = false;
        // global.log('owghat: ' + timeDiff);
        
        if (timeDiff > 0 && timeDiff < min_time_diff) {
          min_time_diff = timeDiff;

          var diffHrs = Math.floor((timeDiff % 86400000) / 3600000);
          var diffMins = Math.floor(((timeDiff % 86400000) % 3600000) / 60000);
          if (diffHrs == 0 && diffMins == 0) {
            next_time = this.azan_labels[i];
            f = true;
          }
          else {
            next_time = String(diffHrs) + ":" + (diffMins > 9 ? "" + diffMins: "0" + diffMins) + " تا " + this.azan_labels[i];
            f = false;
          }
          // break;
        }
      }
      time.setDate(time.getDate() + 1);
    }

    if (f && !this.azan_moment) {
      Main.notify(next_time)
      this.azan_moment = true;
    }
    else {
      this.azan_moment = false;
    }
    let txt = next_time;
    this.buttonText.set_text(txt);
    
  },

  _onPreferencesActivate: function() {
    Util.spawn(["gnome-shell-extension-prefs", "mhkhoshmehr@gmail.com"]);
    return 0;
  },


  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (this._timeout)
      Mainloop.source_remove(this._timeout);
    this._timeout = undefined;

    this.menu.removeAll();
  }
});

let twMenu;

function init() {
}

function enable() {
	twMenu = new Owghat;
	Main.panel.addToStatusArea('tw-indicator', twMenu);
}

function disable() {
	twMenu.stop();
	twMenu.destroy();
}
