(function () {
  var $, AndGate, Connected, Direction, Light, Machine, Module, NotGate, OrGate, PowerSource, Signal, SignalOperation, Switch, Tile, TileContainer, Wire, clocked, stepByStep, tileSize, tiles;

  $ = jQuery;

  Module = this.kevthunder.Module;

  tileSize = 20;

  stepByStep = false;

  this.clocked = clocked = [];

  Direction = {
    adjacents: [
      {
        name: 'top',
        rev: 'bottom',
        x: 0,
        y: -1
      },
      {
        name: 'right',
        rev: 'left',
        x: 1,
        y: 0
      },
      {
        name: 'bottom',
        rev: 'top',
        x: 0,
        y: 1
      },
      {
        name: 'left',
        rev: 'right',
        x: -1,
        y: 0
      }
    ],
    getByName: function (name) {
      var direction, j, len, ref;
      ref = this.adjacents;
      for (j = 0, len = ref.length; j < len; j++) {
        direction = ref[j];
        if (direction.name === name) {
          return direction;
        }
      }
      return null;
    },
    getByCoord: function (x, y) {
      var direction, j, len, ref;
      ref = this.adjacents;
      for (j = 0, len = ref.length; j < len; j++) {
        direction = ref[j];
        if (direction.x === x && direction.y === y) {
          return direction;
        }
      }
      return null;
    }
  };

  Tile = class Tile extends Module {
    constructor(x1, y1, type1) {
      super();
      this.x = x1;
      this.y = y1;
      this.type = type1;
      this.containerDisplay = $('#TileContainer');
      this.container = tiles;
      this.children = [];
      this.draw();
    }

    draw() {
      var displayPos, newDiv;
      newDiv = document.createElement("div");
      displayPos = this.getDisplayPos();
      return this.display = jQuery(newDiv).addClass('tile').addClass(this.type).appendTo(this.containerDisplay).css({
        top: displayPos.y,
        left: displayPos.x
      });
    }

    remove() {
      return this.display.remove();
    }

    getDisplayPos() {
      return this.tileToDisplayPos(this.x, this.y);
    }

    tileToDisplayPos(x, y) {
      return {
        x: x * tileSize,
        y: y * tileSize
      };
    }

    addChild(child) {
      this.children.push(child);
      return child.tile = this;
    }

    getAdjacents() {
      var direction, directions, j, len, res, tile;
      directions = Direction.adjacents;
      res = [];
      for (j = 0, len = directions.length; j < len; j++) {
        direction = directions[j];
        tile = this.container.getTile(this.x + direction.x, this.y + direction.y);
        if (tile != null) {
          res.push(tile);
        }
      }
      return res;
    }

    static createFromData(data) {
      var tile;
      return tile = new Tile(data.x, data.y, data.type);
    }

  };

  Machine = (function () {
    class Machine extends Module { };

    Machine.properties({
      tile: {
        change: function () {
          var displayPos;
          displayPos = this.tile.getDisplayPos();
          this.display.css({
            top: displayPos.y,
            left: displayPos.x
          });
          return this.display.appendTo(this.tile.containerDisplay);
        }
      },
      display: {
        init: function () {
          return $(document.createElement("div")).addClass('machine');
        }
      }
    });

    return Machine;

  }).call(this);

  Connected = {
    included: function () {
      this.properties({
        signals: {
          init: function () {
            return [];
          }
        },
        connections: {
          init: function () {
            return [];
          }
        }
      });
      this.prototype.canConnectTo = this.prototype.canConnectTo || function (target) {
        return false;
      };
      this.prototype.onAddConnection = this.prototype.onAddConnection || function (conn) { };
      this.prototype.onRemoveConnection = this.prototype.onRemoveConnection || function (conn) { };
      this.prototype.onNewSignalType = this.prototype.onNewSignalType || function (signal) { };
      this.prototype.onAddSignal = this.prototype.onAddSignal || function (signal, op) { };
      this.prototype.onRemoveSignal = this.prototype.onRemoveSignal || function (signal, op) { };
      this.prototype.onRemoveSignalType = this.prototype.onRemoveSignalType || function (signal, op) { };
      this.prototype.onReplaceSignal = this.prototype.onReplaceSignal || function (oldSignal, newSignal, op) { };
      this.prototype.acceptSignal = this.prototype.acceptSignal || function (signal) {
        return true;
      };
      return this.prototype.getOutputs = this.prototype.getOutputs || function () {
        return this.getAdjacentConnections();
      };
    },
    initAdjacentConnections: function () {
      var added, conn, i, j, k, l, len, len1, len2, ref, removed, results;
      added = [];
      removed = this.connections;
      ref = this.getAdjacentConnections();
      for (j = 0, len = ref.length; j < len; j++) {
        conn = ref[j];
        i = removed.indexOf(conn);
        if (i > -1) {
          removed.splice(i, 1);
        } else {
          added.push(conn);
        }
      }
      for (k = 0, len1 = removed.length; k < len1; k++) {
        conn = removed[k];
        this.removeConnection(conn);
        conn.removeConnection(this);
      }
      results = [];
      for (l = 0, len2 = added.length; l < len2; l++) {
        conn = added[l];
        this.addConnection(conn);
        results.push(conn.addConnection(this));
      }
      return results;
    },
    addConnection: function (conn) {
      if (this.canConnectTo(conn) && conn.canConnectTo(this)) {
        this.connections.push(conn);
        return this.onAddConnection(conn);
      }
    },
    removeConnection: function (conn) {
      var i;
      i = this.connections.indexOf(conn);
      if (i > -1) {
        this.connections.splice(i, 1);
        return this.onRemoveConnection(conn);
      }
    },
    getAdjacentConnections: function () {
      var child, j, k, len, len1, ref, ref1, res, tile;
      res = [];
      if (this.tile != null) {
        ref = this.tile.getAdjacents();
        for (j = 0, len = ref.length; j < len; j++) {
          tile = ref[j];
          ref1 = tile.children;
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            child = ref1[k];
            if ((child.canConnectTo != null) && (child.canConnectTo(this) || this.canConnectTo(child))) {
              res.push(child);
            }
          }
        }
      }
      return res;
    },
    getConnectionByDirection: function (name) {
      var direction, j, len, ref, wire;
      ref = this.getAdjacentConnections();
      for (j = 0, len = ref.length; j < len; j++) {
        wire = ref[j];
        direction = Direction.getByCoord(wire.tile.x - this.tile.x, wire.tile.y - this.tile.y);
        if (direction.name === name) {
          return wire;
        }
      }
    },
    containsSignal: function (signal, checkLast = false, checkOrigin) {
      var c, j, len, ref;
      ref = this.signals;
      for (j = 0, len = ref.length; j < len; j++) {
        c = ref[j];
        if (c.match(signal, checkLast, checkOrigin)) {
          return c;
        }
      }
      return null;
    },
    addSignal: function (signal, op) {
      var autoStart;
      if (!(op != null ? op.findLimiter(this) : void 0)) {
        if (!op) {
          op = new SignalOperation();
          autoStart = true;
        }
        op.addOperation(() => {
          var similar;
          if (!this.containsSignal(signal, true) && this.acceptSignal(signal)) {
            similar = this.containsSignal(signal);
            this.signals.push(signal);
            this.onAddSignal(signal, op);
            if (!similar) {
              return this.onNewSignalType(signal, op);
            }
          }
        });
        if (autoStart) {
          op.start();
        }
      }
      return signal;
    },
    removeSignal: function (signal, op) {
      var autoStart;
      if (!(op != null ? op.findLimiter(this) : void 0)) {
        if (!op) {
          op = new SignalOperation();
          autoStart = true;
        }
        op.addOperation(() => {
          var existing;
          if ((existing = this.containsSignal(signal, true)) && this.acceptSignal(signal)) {
            this.signals.splice(this.signals.indexOf(existing), 1);
            this.onRemoveSignal(signal, op);
            op.addOperation(() => {
              var similar;
              similar = this.containsSignal(signal);
              if (similar) {
                return this.onReplaceSignal(signal, similar, op);
              } else {
                return this.onRemoveSignalType(signal, op);
              }
            }, 0);
          }
          if (stepByStep) {
            return op.step();
          }
        });
        if (autoStart) {
          return op.start();
        }
      }
    },
    prepForwardedSignal: function (signal) {
      if (signal.last === this) {
        return signal;
      } else {
        return signal.withLast(this);
      }
    },
    forwardSignal: function (signal, op) {
      var conn, key, next, ref, results;
      next = this.prepForwardedSignal(signal);
      ref = this.getOutputs();
      results = [];
      for (key in ref) {
        conn = ref[key];
        if (signal.last !== conn) {
          results.push(conn.addSignal(next, op));
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    forwardAllSignalsTo: function (conn, op) {
      var j, len, next, ref, results, signal;
      ref = this.signals;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        signal = ref[j];
        next = this.prepForwardedSignal(signal);
        results.push(conn.addSignal(next, op));
      }
      return results;
    },
    stopForwardedSignal: function (signal, op) {
      var conn, key, next, ref, results;
      next = this.prepForwardedSignal(signal);
      ref = this.getOutputs();
      results = [];
      for (key in ref) {
        conn = ref[key];
        if (signal.last !== conn) {
          results.push(conn.removeSignal(next, op));
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    stopAllForwardedSignalTo: function (conn, op) {
      var j, len, next, ref, results, signal;
      ref = this.signals;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        signal = ref[j];
        next = this.prepForwardedSignal(signal);
        results.push(conn.removeSignal(next, op));
      }
      return results;
    }
  };

  PowerSource = (function () {
    class PowerSource extends Machine {
      changeTile() {
        super.changeTile();
        return this.initAdjacentConnections();
      }

      initDisplay() {
        return super.initDisplay().addClass('powerSource').addClass('fa fa-power-off').click(() => {
          return this.activated = !this.activated;
        });
      }

      canConnectTo(target) {
        return target.wireType != null;
      }

    };

    PowerSource.include(Connected);

    PowerSource.properties({
      activated: {
        change: function () {
          var op, signal;
          this.display.toggleClass('activated', this.activated);
          op = new SignalOperation();
          signal = new Signal(this, 'power', true);
          if (this.activated) {
            this.forwardSignal(signal, op);
          } else {
            this.stopForwardedSignal(signal, op);
          }
          return op.start();
        }
      }
    });

    return PowerSource;

  }).call(this);

  Switch = (function () {
    class Switch extends Machine {
      changeTile() {
        super.changeTile();
        return this.initAdjacentConnections();
      }

      initDisplay() {
        return super.initDisplay().addClass('switch').click(() => {
          return this.activated = !this.activated;
        });
      }

      canConnectTo(target) {
        return target.wireType != null;
      }

      onNewSignalType(signal, op) {
        if (this.activated) {
          return this.forwardSignal(signal, op);
        }
      }

      onReplaceSignal(oldSignal, newSignal, op) {
        if (this.activated) {
          return this.forwardSignal(newSignal, op);
        }
      }

      onRemoveSignal(signal, op) {
        if (this.activated) {
          return this.stopForwardedSignal(signal, op);
        }
      }

    };

    Switch.include(Connected);

    Switch.properties({
      activated: {
        change: function () {
          var byType, j, len, op, ref, signal, type;
          op = new SignalOperation();
          this.display.toggleClass('activated', this.activated);
          if (this.activated) {
            byType = this.signals.reduce(function (byType, signal) {
              if (byType[signal.type] == null) {
                byType[signal.type] = signal;
              }
              return byType;
            }, {});
            for (type in byType) {
              signal = byType[type];
              this.forwardSignal(signal, op);
            }
          } else {
            ref = this.signals.slice();
            for (j = 0, len = ref.length; j < len; j++) {
              signal = ref[j];
              this.stopForwardedSignal(signal, op);
            }
          }
          return op.start();
        }
      }
    });

    return Switch;

  }).call(this);

  Light = (function () {
    class Light extends Machine {
      changeTile() {
        super.changeTile();
        return this.initAdjacentConnections();
      }

      initDisplay() {
        return super.initDisplay().addClass('light').addClass('fa fa-lightbulb-o');
      }

      canConnectTo(target) {
        return target.wireType != null;
      }

      onNewSignalType(signal) {
        if (signal.type === 'power') {
          return this.activated = true;
        }
      }

      onRemoveSignalType(signal) {
        if (signal.type === 'power') {
          return this.activated = false;
        }
      }

    };

    Light.include(Connected);

    Light.properties({
      activated: {
        change: function () {
          return this.display.toggleClass('activated', this.activated);
        }
      }
    });

    return Light;

  }).call(this);

  OrGate = (function () {
    class OrGate extends Machine {
      constructor(outputDirection) {
        super();
        this.outputDirection = Direction.getByName(outputDirection);
      }

      initDisplay() {
        return super.initDisplay().addClass('orGate').addClass(this.outputDirection.name + 'Output');
      }

      changeTile() {
        super.changeTile();
        return this.initAdjacentConnections();
      }

      canConnectTo(target) {
        return target.wireType != null;
      }

      acceptSignal(signal) {
        return signal.getDirection(this.tile) !== this.outputDirection;
      }

      onNewSignalType(signal, op) {
        if (signal.type === 'power') {
          this.activated = true;
        }
        return this.forwardSignal(signal, op);
      }

      onReplaceSignal(oldSignal, newSignal, op) {
        return this.forwardSignal(newSignal, op);
      }

      getOutputs() {
        var c;
        c = this.getConnectionByDirection(this.outputDirection.name);
        if (c != null) {
          return [c];
        } else {
          return [];
        }
      }

      onRemoveSignalType(signal) {
        if (signal.type === 'power') {
          return this.activated = false;
        }
      }

      onRemoveSignal(signal, op) {
        return this.stopForwardedSignal(signal, op);
      }

    };

    OrGate.include(Connected);

    OrGate.properties({
      activated: {
        change: function () {
          return this.display.toggleClass('activated', this.activated);
        }
      }
    });

    return OrGate;

  }).call(this);

  AndGate = (function () {
    class AndGate extends Machine {
      constructor(outputDirection) {
        super();
        this.outputDirection = Direction.getByName(outputDirection);
      }

      initDisplay() {
        return super.initDisplay().addClass('andGate').addClass(this.outputDirection.name + 'Output');
      }

      changeTile() {
        super.changeTile();
        return this.initAdjacentConnections();
      }

      canConnectTo(target) {
        return target.wireType != null;
      }

      getOutputs() {
        var c;
        c = this.getConnectionByDirection(this.outputDirection.name);
        if (c != null) {
          return [c];
        } else {
          return [];
        }
      }

      getInputConnections() {
        return this.getAdjacentConnections().filter((wire) => {
          var direction;
          direction = Direction.getByCoord(wire.tile.x - this.tile.x, wire.tile.y - this.tile.y);
          return direction.name !== this.outputDirection.name;
        });
      }

      acceptSignal(signal) {
        return signal.getDirection(this.tile) !== this.outputDirection;
      }

      onAddSignal(signal, op) {
        var cSignals, iConn;
        iConn = this.getInputConnections();
        cSignals = this.signals.filter(function (c) {
          return c.type === signal.type;
        });
        if (iConn.length === cSignals.length) {
          if (signal.type === 'power') {
            this.activated = true;
          }
          return this.forwardSignal(signal, op);
        }
      }

      onRemoveSignal(signal, op) {
        if (signal.getDirection(this.tile) !== this.outputDirection) {
          this.activated = false;
          return this.stopForwardedSignal(signal, op);
        }
      }

    };

    AndGate.include(Connected);

    AndGate.properties({
      activated: {
        change: function () {
          return this.display.toggleClass('activated', this.activated);
        }
      }
    });

    return AndGate;

  }).call(this);

  NotGate = (function () {
    class NotGate extends Machine {
      constructor(outputDirection) {
        super();
        this.outputDirection = Direction.getByName(outputDirection);
      }

      initDisplay() {
        return super.initDisplay().addClass('notGate').addClass(this.outputDirection.name + 'Output');
      }

      changeTile() {
        super.changeTile();
        this.initAdjacentConnections();
        return this.initOutput();
      }

      initOutput() {
        var signal;
        if (this.signals.length === 0) {
          signal = new Signal(this, 'power', true);
          return this.forwardSignal(signal);
        }
      }

      canConnectTo(target) {
        return target.wireType != null;
      }

      acceptSignal(signal) {
        return signal.getDirection(this.tile) !== this.outputDirection;
      }

      getOutputs() {
        var c;
        c = this.getConnectionByDirection(this.outputDirection.name);
        if (c != null) {
          return [c];
        } else {
          return [];
        }
      }

      onNewSignalType(signal, op) {
        if (signal.type === 'power') {
          this.activated = true;
        }
        this.stopForwardedSignal(signal, op);
        return op.addLimiter(this);
      }

      onReplaceSignal(oldSignal, newSignal, op) {
        return this.stopForwardedSignal(newSignal, op);
      }

      prepForwardedSignal(signal) {
        if (!(signal.origin instanceof NotGate)) {
          signal = new Signal(this, 'power', true);
        }
        if (signal.last === this) {
          return signal;
        } else {
          return signal.withLast(this);
        }
      }

      onRemoveSignalType(signal, op) {
        if (signal.type === 'power') {
          this.activated = false;
        }
        this.forwardSignal(signal, op);
        return op.addLimiter(this);
      }

    };

    NotGate.include(Connected);

    NotGate.properties({
      activated: {
        change: function () {
          return this.display.toggleClass('activated', this.activated);
        }
      }
    });

    return NotGate;

  }).call(this);

  Wire = (function () {
    

    class Wire extends Module {
      constructor(wireType = 'red') {
        super();
        this.wireType = wireType;
      }

      onAddConnection(conn) {
        var conName, direction;
        direction = Direction.getByCoord(conn.tile.x - this.tile.x, conn.tile.y - this.tile.y);
        conName = 'conn' + direction.name.charAt(0).toUpperCase() + direction.name.slice(1);
        this[conName] = true;
        return this.forwardAllSignalsTo(conn);
      }

      onRemoveConnection(conn) {
        var conName, direction;
        direction = Direction.getByCoord(conn.tile.x - this.tile.x, conn.tile.y - this.tile.y);
        conName = 'conn' + direction.name.charAt(0).toUpperCase() + direction.name.slice(1);
        return this[conName] = false;
      }

      canConnectTo(target) {
        return (target.wireType == null) || target.wireType === this.wireType;
      }

      onNewSignalType(signal, op) {
        if (signal.type === 'power') {
          this.activated = true;
        }
        return this.forwardSignal(signal, op);
      }

      onReplaceSignal(oldSignal, newSignal, op) {
        return this.forwardSignal(newSignal, op);
      }

      onRemoveSignalType(signal) {
        if (signal.type === 'power') {
          return this.activated = false;
        }
      }

      onRemoveSignal(signal, op) {
        return this.stopForwardedSignal(signal, op);
      }

      static loadMatrix(tileContainer, matrix) {
        var num, results, row, tile, type, val, x, y;
        results = [];
        for (y in matrix) {
          row = matrix[y];
          results.push((function () {
            var results1;
            results1 = [];
            for (x in row) {
              val = row[x];
              results1.push((function () {
                var ref, results2;
                ref = this.matrixDataType;
                results2 = [];
                for (type in ref) {
                  num = ref[type];
                  if (val & num) {
                    tile = tileContainer.getTile(parseInt(x), parseInt(y));
                    results2.push(tile.addChild(new Wire(type)));
                  } else {
                    results2.push(void 0);
                  }
                }
                return results2;
              }).call(this));
            }
            return results1;
          }).call(this));
        }
        return results;
      }

    };

    Wire.include(Connected);


    // Update Wire to illuminate tiles and manage fog
    Wire.properties({
      activated: {
        change: function () {
          this.display.toggleClass('activated', this.activated);
          if (this.activated) {
            this.tile.illuminate(); // Clear fog when activated
          } else {
            this.tile.dim(); // Reapply fog when deactivated
          }
        }
      },

      tile: {
        change: function () {
          const displayPos = this.tile.getDisplayPos();
          this.display.css({
            top: displayPos.y,
            left: displayPos.x
          });
          this.display.appendTo(this.tile.containerDisplay);
          this.initAdjacentConnections();
        }
      },

      display: {
        init: function () {
          return $(document.createElement("div")).addClass('wire').addClass(this.wireType);
        }
      },

      connTop: { change: function () { this.display.toggleClass('connTop', this.connTop); } },
      connRight: { change: function () { this.display.toggleClass('connRight', this.connRight); } },
      connBottom: { change: function () { this.display.toggleClass('connBottom', this.connBottom); } },
      connLeft: { change: function () { this.display.toggleClass('connLeft', this.connLeft); } }
    });


    Wire.matrixDataType = {
      red: 1,
      blue: 2
    };

    return Wire;

  }).call(this);

  Signal = class Signal extends Module {
    constructor(origin, type1 = 'signal', exclusive = false) {
      super();
      this.origin = origin;
      this.type = type1;
      this.exclusive = exclusive;
      this.last = this.origin;
    }

    withLast(last) {
      var signal;
      signal = new this.__proto__.constructor(this.origin, this.type, this.exclusive);
      signal.last = last;
      return signal;
    }

    copy() {
      var signal;
      signal = new this.__proto__.constructor(this.origin, this.type, this.exclusive);
      signal.last = this.last;
      return signal;
    }

    match(signal, checkLast = false, checkOrigin = this.exclusive) {
      return (!checkLast || signal.last === this.last) && (checkOrigin || signal.origin === this.origin) && signal.type === this.type;
    }

    getDirection(from) {
      var direction;
      return direction = Direction.getByCoord(this.last.tile.x - from.x, this.last.tile.y - from.y);
    }

  };

  SignalOperation = class SignalOperation extends Module {
    constructor() {
      super();
      this.queue = [];
      this.limiters = [];
    }

    addOperation(funct, priority = 1) {
      if (priority) {
        return this.queue.unshift(funct);
      } else {
        return this.queue.push(funct);
      }
    }

    addLimiter(connected) {
      if (!this.findLimiter(connected)) {
        return this.limiters.push(connected);
      }
    }

    findLimiter(connected) {
      return this.limiters.indexOf(connected) > -1;
    }

    start() {
      var results;
      if (stepByStep) {
        return clocked.push(this);
      } else {
        results = [];
        while (this.queue.length) {
          results.push(this.step());
        }
        return results;
      }
    }

    step() {
      var funct;
      if (this.queue.length === 0) {
        return this.done();
      } else {
        funct = this.queue.shift(funct);
        return funct(this);
      }
    }

    done() {
      var index;
      index = clocked.indexOf(this);
      if (index !== -1) {
        return clocked.splice(index, 1);
      }
    }

  };

  // Add illuminate and dim methods to the Tile class
  Tile.prototype.illuminate = function () {
    this.display.addClass('activated');
    this.propagateLight();
  };

  Tile.prototype.dim = function () {
    this.display.removeClass('activated');
  };

  // Optionally propagate light to adjacent tiles
  Tile.prototype.propagateLight = function () {
    let adjacents = this.getAdjacents();
    adjacents.forEach(tile => {
      if (!tile.display.hasClass('activated')) {
        tile.display.addClass('dimmed');
        setTimeout(() => tile.display.removeClass('dimmed'), 500); // Temporary glow
      }
    });
  };

  TileContainer = class TileContainer {
    constructor() {
      this.coords = {};
      this.tiles = [];
    }

    addTile(tile) {
      this.tiles.push(tile);
      if (this.coords[tile.x] == null) {
        this.coords[tile.x] = {};
      }
      return this.coords[tile.x][tile.y] = tile;
    }

    getTile(x, y) {
      var ref;
      if (((ref = this.coords[x]) != null ? ref[y] : void 0) != null) {
        return this.coords[x][y];
      }
    }

    loadMatrix(matrix) {
      var data, letter, results, row, types, x, y;
      types = {
        w: 'wall',
        f: 'floor'
      };
      results = [];
      for (y in matrix) {
        row = matrix[y];
        results.push((function () {
          var results1;
          results1 = [];
          for (x in row) {
            letter = row[x];
            data = {
              x: parseInt(x),
              y: parseInt(y),
              type: types[letter]
            };
            results1.push(this.addTile(Tile.createFromData(data)));
          }
          return results1;
        }).call(this));
      }
      return results;
    }

    allTiles() {
      return this.tiles.slice();
    }

    clearAll() {
      var j, len, ref, tile;
      ref = this.tiles;
      for (j = 0, len = ref.length; j < len; j++) {
        tile = ref[j];
        tile.remove();
      }
      this.coords = {};
      return this.tiles = [];
    }

  };

  this.tiles = tiles = new TileContainer();

  tiles.loadMatrix([
    //"1" "2", "3", "4", "5", "6", "7", "8", "9" "10" "11" "12" "13" "14" "15" "16" "17" "18" "19" "20" "21" "22,"23,"24,"25,"26,"27,"28,"29,"30,"31,"32,"33,"34,"35,"36,"37,"38,"39,"40,"41
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//1
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//2
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//3
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//4
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//5
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//6
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//7
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//8
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//9
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//10
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//11
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//12
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//13
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//14
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//15
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//16
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//17
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//18
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//19
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//20
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//21
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//22
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//23
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//24
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//25
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//26
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//27
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//28
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//29
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//30
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//31
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//32
    ["w", "f", "f", "f", "f", "f", "f", "f", "f","f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f", "f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","f","w"],//33
  ]);

  Wire.loadMatrix(tiles, [
 // [1, 2, 3, 4, 5, 6, 7, 8, 9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35                      
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 2, 2, 2, 0, 2, 0, 0, 2, 2, 2, 2, 0, 2, 0, 0, 0, 2, 0, 2, 2, 2, 1],
    [1, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 1],
    [1, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 2, 0, 1],
    [1, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 2, 2, 0, 2, 2, 0, 2, 0, 0, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]);


  //heart light
  tiles.getTile(11, 4).addChild(new PowerSource());

  //I and Heart Connection
  tiles.getTile(1, 10).addChild(new NotGate('right'));

  // // I
  // tiles.getTile(3, 6).addChild(new PowerSource()); 

  // // L
  // tiles.getTile(5, 9).addChild(new OrGate('right'));

  // // O
  // tiles.getTile(8, 10).addChild(new NotGate('top')); 
  // tiles.getTile(8, 6).addChild(new Switch());


  // // V 
  // tiles.getTile(15, 10).addChild(new Light());
  // tiles.getTile(12, 7).addChild(new NotGate('right'));




  $('#StepByStep').change(function () {
    return stepByStep = $(this).is(':checked');
  });

  setInterval(function () {
    return clocked.forEach(function (clocked) {
      return clocked.step();
    });
  }, 50);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUEsZUFBQSxFQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsYUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFFBQUEsRUFBQTs7RUFBQSxDQUFBLEdBQUk7O0VBQ0osTUFBQSxHQUFTLElBQUksQ0FBQyxVQUFVLENBQUM7O0VBRXpCLFFBQUEsR0FBVzs7RUFFWCxVQUFBLEdBQWE7O0VBQ2IsSUFBSSxDQUFDLE9BQUwsR0FBZSxPQUFBLEdBQVU7O0VBRXpCLFNBQUEsR0FBWTtJQUNWLFNBQUEsRUFBVztNQUNUO1FBQUMsSUFBQSxFQUFNLEtBQVA7UUFBYyxHQUFBLEVBQUssUUFBbkI7UUFBNkIsQ0FBQSxFQUFHLENBQWhDO1FBQW1DLENBQUEsRUFBRyxDQUFDO01BQXZDLENBRFM7TUFFVDtRQUFDLElBQUEsRUFBTSxPQUFQO1FBQWdCLEdBQUEsRUFBSyxNQUFyQjtRQUE2QixDQUFBLEVBQUcsQ0FBaEM7UUFBbUMsQ0FBQSxFQUFHO01BQXRDLENBRlM7TUFHVDtRQUFDLElBQUEsRUFBTSxRQUFQO1FBQWlCLEdBQUEsRUFBSyxLQUF0QjtRQUE2QixDQUFBLEVBQUcsQ0FBaEM7UUFBbUMsQ0FBQSxFQUFHO01BQXRDLENBSFM7TUFJVDtRQUFDLElBQUEsRUFBTSxNQUFQO1FBQWUsR0FBQSxFQUFLLE9BQXBCO1FBQTZCLENBQUEsRUFBRyxDQUFDLENBQWpDO1FBQW9DLENBQUEsRUFBRztNQUF2QyxDQUpTO0tBREQ7SUFPVixTQUFBLEVBQVcsUUFBQSxDQUFDLElBQUQsQ0FBQTtBQUNiLFVBQUEsU0FBQSxFQUFBLENB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QUEsQ0FBQSxDQUFBO1dBQ3RCLFVBQUEsR0FBYSxDQUFBLENBQUUsSUFBRixDQUFPLENBQUMsRUFBUixDQUFXLFVBQVg7RUFEUyxDQUF4Qjs7RUFHQSxXQUFBLENBQVksUUFBQSxDQUFBLENBQUE7V0FDUixPQUFPLENBQUMsT0FBUixDQUFnQixRQUFBLENBQUMsT0FBRCxDQUFBO2FBQ2QsT0FBTyxDQUFDLElBQVIsQ0FBQTtJQURjLENBQWhCO0VBRFEsQ0FBWixFQUdJLEVBSEo7QUE5bEJBIiwic291cmNlc0NvbnRlbnQiOlsiXG4kID0galF1ZXJ5XG5Nb2R1bGUgPSB0aGlzLmtldnRodW5kZXIuTW9kdWxlXG5cbnRpbGVTaXplID0gMjBcblxuc3RlcEJ5U3RlcCA9IGZhbHNlXG50aGlzLmNsb2NrZWQgPSBjbG9ja2VkID0gW11cblxuRGlyZWN0aW9uID0ge1xuICBhZGphY2VudHM6IFtcbiAgICB7bmFtZTogJ3RvcCcsIHJldjogJ2JvdHRvbScsIHg6IDAsIHk6IC0xfVxuICAgIHtuYW1lOiAncmlnaHQnLCByZXY6ICdsZWZ0JywgeDogMSwgeTogMH1cbiAgICB7bmFtZTogJ2JvdHRvbScsIHJldjogJ3RvcCcsIHg6IDAsIHk6IDF9XG4gICAge25hbWU6ICdsZWZ0JywgcmV2OiAncmlnaHQnLCB4OiAtMSwgeTogMH1cbiAgXVxuICBnZXRCeU5hbWU6IChuYW1lKSAtPlxuICAgIGZvciBkaXJlY3Rpb24gaW4gQGFkamFjZW50c1xuICAgICAgaWYgZGlyZWN0aW9uLm5hbWUgPT0gbmFtZVxuICAgICAgICByZXR1cm4gZGlyZWN0aW9uXG4gICAgbnVsbFxuICBnZXRCeUNvb3JkOiAoeCwgeSkgLT5cbiAgICBmb3IgZGlyZWN0aW9uIGluIEBhZGphY2VudHNcbiAgICAgIGlmIGRpcmVjdGlvbi54ID09IHggYW5kIGRpcmVjdGlvbi55ID09IHlcbiAgICAgICAgcmV0dXJuIGRpcmVjdGlvblxuICAgIG51bGxcbn1cblxuY2xhc3MgVGlsZSBleHRlbmRzIE1vZHVsZVxuICBjb25zdHJ1Y3RvcjogKEB4LCBAeSwgQHR5cGUpIC0+XG4gICAgc3VwZXIoKVxuICAgIEBjb250YWluZXJEaXNwbGF5ID0gJCgnI1RpbGVDb250YWluZXInKVxuICAgIEBjb250YWluZXIgPSB0aWxlc1xuICAgIEBjaGlsZHJlbiA9IFtdXG4gICAgQGRyYXcoKVxuICBkcmF3OiAtPlxuICAgIG5ld0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZGlzcGxheVBvcyA9IEBnZXREaXNwbGF5UG9zKClcbiAgICBAZGlzcGxheSA9IGpRdWVyeShuZXdEaXYpXG4gICAgICAuYWRkQ2xhc3MoJ3RpbGUnKVxuICAgICAgLmFkZENsYXNzKEB0eXBlKVxuICAgICAgLmFwcGVuZFRvKEBjb250YWluZXJEaXNwbGF5KVxuICAgICAgLmNzcyh0b3A6IGRpc3BsYXlQb3MueSwgbGVmdDogZGlzcGxheVBvcy54KVxuICByZW1vdmU6IC0+XG4gICAgQGRpc3BsYXkucmVtb3ZlKClcbiAgZ2V0RGlzcGxheVBvczogLT5cbiAgICBAdGlsZVRvRGlzcGxheVBvcyhAeCwgQHkpXG4gIHRpbGVUb0Rpc3BsYXlQb3M6ICh4LCB5KSAtPlxuICAgIHg6eCp0aWxlU2l6ZSwgeTp5KnRpbGVTaXplXG4gIGFkZENoaWxkOiAoY2hpbGQpIC0+XG4gICAgQGNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgY2hpbGQudGlsZSA9IHRoaXNcbiAgZ2V0QWRqYWNlbnRzOiAtPlxuICAgIGRpcmVjdGlvbnMgPSBEaXJlY3Rpb24uYWRqYWNlbnRzXG4gICAgcmVzID0gW11cbiAgICBmb3IgZGlyZWN0aW9uIGluIGRpcmVjdGlvbnNcbiAgICAgIHRpbGUgPSBAY29udGFpbmVyLmdldFRpbGUoQHgrZGlyZWN0aW9uLngsQHkrZGlyZWN0aW9uLnkpXG4gICAgICBpZiB0aWxlP1xuICAgICAgICByZXMucHVzaCh0aWxlKVxuICAgIHJlcyBcbiAgQGNyZWF0ZUZyb21EYXRhID0gKGRhdGEpIC0+XG4gICAgdGlsZSA9IG5ldyBUaWxlKGRhdGEueCwgZGF0YS55LCBkYXRhLnR5cGUpXG5cbmNsYXNzIE1hY2hpbmUgZXh0ZW5kcyBNb2R1bGVcbiAgQHByb3BlcnRpZXNcbiAgICB0aWxlOlxuICAgICAgY2hhbmdlOiAtPlxuICAgICAgICBkaXNwbGF5UG9zID0gQHRpbGUuZ2V0RGlzcGxheVBvcygpXG4gICAgICAgIEBkaXNwbGF5LmNzcyh0b3A6IGRpc3BsYXlQb3MueSwgbGVmdDogZGlzcGxheVBvcy54KVxuICAgICAgICBAZGlzcGxheS5hcHBlbmRUbyhAdGlsZS5jb250YWluZXJEaXNwbGF5KVxuICAgIGRpc3BsYXk6XG4gICAgICBpbml0OiAtPlxuICAgICAgICAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpXG4gICAgICAgICAgLmFkZENsYXNzKCdtYWNoaW5lJylcblxuICAgICAgICAgIFxuQ29ubmVjdGVkID1cbiAgaW5jbHVkZWQ6ICgpIC0+XG4gICAgQHByb3BlcnRpZXNcbiAgICAgIHNpZ25hbHM6XG4gICAgICAgIGluaXQ6IC0+XG4gICAgICAgICAgW11cbiAgICAgIGNvbm5lY3Rpb25zOlxuICAgICAgICBpbml0OiAtPlxuICAgICAgICAgIFtdXG4gICAgQDo6Y2FuQ29ubmVjdFRvID0gQDo6Y2FuQ29ubmVjdFRvIHx8ICh0YXJnZXQpIC0+XG4gICAgICBmYWxzZVxuICAgIEA6Om9uQWRkQ29ubmVjdGlvbiA9IEA6Om9uQWRkQ29ubmVjdGlvbiB8fCAoY29ubiktPlxuICAgIEA6Om9uUmVtb3ZlQ29ubmVjdGlvbiA9IEA6Om9uUmVtb3ZlQ29ubmVjdGlvbiB8fCAoY29ubiktPlxuICAgIEA6Om9uTmV3U2lnbmFsVHlwZSA9IEA6Om9uTmV3U2lnbmFsVHlwZSB8fCAoc2lnbmFsKSAtPlxuICAgIEA6Om9uQWRkU2lnbmFsID0gQDo6b25BZGRTaWduYWwgfHwgKHNpZ25hbCwgb3ApIC0+XG4gICAgQDo6b25SZW1vdmVTaWduYWwgPSBAOjpvblJlbW92ZVNpZ25hbCB8fCAoc2lnbmFsLCBvcCkgLT5cbiAgICBAOjpvblJlbW92ZVNpZ25hbFR5cGUgPSBAOjpvblJlbW92ZVNpZ25hbFR5cGUgfHwgKHNpZ25hbCwgb3ApIC0+XG4gICAgQDo6b25SZXBsYWNlU2lnbmFsID0gQDo6b25SZXBsYWNlU2lnbmFsIHx8IChvbGRTaWduYWwsIG5ld1NpZ25hbCwgb3ApIC0+XG4gICAgQDo6YWNjZXB0U2lnbmFsID0gQDo6YWNjZXB0U2lnbmFsIHx8IChzaWduYWwpIC0+XG4gICAgICB0cnVlXG4gICAgQDo6Z2V0T3V0cHV0cyA9IEA6OmdldE91dHB1dHMgfHwgKCkgLT5cbiAgICAgIEBnZXRBZGphY2VudENvbm5lY3Rpb25zKClcbiAgaW5pdEFkamFjZW50Q29ubmVjdGlvbnM6IC0+XG4gICAgYWRkZWQgPSBbXVxuICAgIHJlbW92ZWQgPSBAY29ubmVjdGlvbnNcbiAgICBmb3IgY29ubiBpbiBAZ2V0QWRqYWNlbnRDb25uZWN0aW9ucygpXG4gICAgICBpID0gcmVtb3ZlZC5pbmRleE9mKGNvbm4pXG4gICAgICBpZiBpID4gLTFcbiAgICAgICAgcmVtb3ZlZC5zcGxpY2UoaSwgMSlcbiAgICAgIGVsc2VcbiAgICAgICAgYWRkZWQucHVzaChjb25uKVxuICAgIGZvciBjb25uIGluIHJlbW92ZWRcbiAgICAgIEByZW1vdmVDb25uZWN0aW9uKGNvbm4pXG4gICAgICBjb25uLnJlbW92ZUNvbm5lY3Rpb24odGhpcylcbiAgICBmb3IgY29ubiBpbiBhZGRlZFxuICAgICAgQGFkZENvbm5lY3Rpb24oY29ubilcbiAgICAgIGNvbm4uYWRkQ29ubmVjdGlvbih0aGlzKVxuICBhZGRDb25uZWN0aW9uOiAoY29ubiktPlxuICAgIGlmIHRoaXMuY2FuQ29ubmVjdFRvKGNvbm4pIGFuZCBjb25uLmNhbkNvbm5lY3RUbyh0aGlzKVxuICAgICAgQGNvbm5lY3Rpb25zLnB1c2goY29ubilcbiAgICAgIEBvbkFkZENvbm5lY3Rpb24oY29ubilcbiAgcmVtb3ZlQ29ubmVjdGlvbjogKGNvbm4pLT5cbiAgICBpID0gQGNvbm5lY3Rpb25zLmluZGV4T2YoY29ubilcbiAgICBpZiBpID4gLTFcbiAgICAgIEBjb25uZWN0aW9ucy5zcGxpY2UoaSwgMSlcbiAgICAgIEBvblJlbW92ZUNvbm5lY3Rpb24oY29ubilcbiAgZ2V0QWRqYWNlbnRDb25uZWN0aW9uczogLT5cbiAgICByZXMgPSBbXVxuICAgIGlmIEB0aWxlP1xuICAgICAgZm9yIHRpbGUgaW4gQHRpbGUuZ2V0QWRqYWNlbnRzKClcbiAgICAgICAgZm9yIGNoaWxkIGluIHRpbGUuY2hpbGRyZW5cbiAgICAgICAgICBpZiBjaGlsZC5jYW5Db25uZWN0VG8/IGFuZCAoY2hpbGQuY2FuQ29ubmVjdFRvKHRoaXMpIG9yIHRoaXMuY2FuQ29ubmVjdFRvKGNoaWxkKSlcbiAgICAgICAgICAgIHJlcy5wdXNoKGNoaWxkKVxuICAgIHJlc1xuICBnZXRDb25uZWN0aW9uQnlEaXJlY3Rpb246KG5hbWUpLT5cbiAgICBmb3Igd2lyZSBpbiBAZ2V0QWRqYWNlbnRDb25uZWN0aW9ucygpXG4gICAgICBkaXJlY3Rpb24gPSBEaXJlY3Rpb24uZ2V0QnlDb29yZCggd2lyZS50aWxlLnggLSBAdGlsZS54LCB3aXJlLnRpbGUueSAtIEB0aWxlLnkpXG4gICAgICBpZiBkaXJlY3Rpb24ubmFtZSA9PSBuYW1lXG4gICAgICAgIHJldHVybiB3aXJlXG4gIGNvbnRhaW5zU2lnbmFsOiAoc2lnbmFsLCBjaGVja0xhc3QgPSBmYWxzZSwgY2hlY2tPcmlnaW4pLT5cbiAgICBmb3IgYyBpbiBAc2lnbmFsc1xuICAgICAgaWYgYy5tYXRjaChzaWduYWwsIGNoZWNrTGFzdCwgY2hlY2tPcmlnaW4pXG4gICAgICAgIHJldHVybiBjXG4gICAgbnVsbFxuICBhZGRTaWduYWw6IChzaWduYWwsIG9wKSAtPlxuICAgIHVubGVzcyBvcD8uZmluZExpbWl0ZXIodGhpcylcbiAgICAgIHVubGVzcyBvcFxuICAgICAgICBvcCA9IG5ldyBTaWduYWxPcGVyYXRpb24oKVxuICAgICAgICBhdXRvU3RhcnQgPSB0cnVlXG4gICAgICBvcC5hZGRPcGVyYXRpb24gPT5cbiAgICAgICAgaWYgIUBjb250YWluc1NpZ25hbChzaWduYWwsIHRydWUpIGFuZCBAYWNjZXB0U2lnbmFsKHNpZ25hbClcbiAgICAgICAgICBzaW1pbGFyID0gQGNvbnRhaW5zU2lnbmFsKHNpZ25hbClcbiAgICAgICAgICBAc2lnbmFscy5wdXNoKHNpZ25hbClcbiAgICAgICAgICBAb25BZGRTaWduYWwoc2lnbmFsLCBvcClcbiAgICAgICAgICB1bmxlc3Mgc2ltaWxhclxuICAgICAgICAgICAgQG9uTmV3U2lnbmFsVHlwZShzaWduYWwsIG9wKVxuICAgICAgaWYgYXV0b1N0YXJ0XG4gICAgICAgIG9wLnN0YXJ0KClcbiAgICBzaWduYWxcbiAgcmVtb3ZlU2lnbmFsOiAoc2lnbmFsLCBvcCkgLT5cbiAgICB1bmxlc3Mgb3A/LmZpbmRMaW1pdGVyKHRoaXMpXG4gICAgICB1bmxlc3Mgb3BcbiAgICAgICAgb3AgPSBuZXcgU2lnbmFsT3BlcmF0aW9uXG4gICAgICAgIGF1dG9TdGFydCA9IHRydWVcbiAgICAgIG9wLmFkZE9wZXJhdGlvbiA9PlxuICAgICAgICBpZiAoZXhpc3RpbmcgPSBAY29udGFpbnNTaWduYWwoc2lnbmFsLCB0cnVlKSkgYW5kIEBhY2NlcHRTaWduYWwoc2lnbmFsKVxuICAgICAgICAgIEBzaWduYWxzLnNwbGljZShAc2lnbmFscy5pbmRleE9mKGV4aXN0aW5nKSwgMSlcbiAgICAgICAgICBAb25SZW1vdmVTaWduYWwoc2lnbmFsLCBvcClcbiAgICAgICAgICBvcC5hZGRPcGVyYXRpb24gPT5cbiAgICAgICAgICAgICAgc2ltaWxhciA9IEBjb250YWluc1NpZ25hbChzaWduYWwpXG4gICAgICAgICAgICAgIGlmIHNpbWlsYXJcbiAgICAgICAgICAgICAgICBAb25SZXBsYWNlU2lnbmFsKHNpZ25hbCwgc2ltaWxhciwgb3ApXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAb25SZW1vdmVTaWduYWxUeXBlKHNpZ25hbCwgb3ApXG4gICAgICAgICAgICAsIDBcbiAgICAgICAgaWYgc3RlcEJ5U3RlcFxuICAgICAgICAgIG9wLnN0ZXAoKVxuICAgICAgaWYgYXV0b1N0YXJ0XG4gICAgICAgIHJldHVybiBvcC5zdGFydCgpXG4gIHByZXBGb3J3YXJkZWRTaWduYWw6IChzaWduYWwpIC0+XG4gICAgaWYgc2lnbmFsLmxhc3QgPT0gdGhpcyB0aGVuIHNpZ25hbCBlbHNlIHNpZ25hbC53aXRoTGFzdCh0aGlzKVxuICBmb3J3YXJkU2lnbmFsOiAoc2lnbmFsLCBvcCkgLT5cbiAgICBuZXh0ID0gQHByZXBGb3J3YXJkZWRTaWduYWwoc2lnbmFsKVxuICAgIGZvciBrZXksIGNvbm4gb2YgQGdldE91dHB1dHMoKVxuICAgICAgaWYgc2lnbmFsLmxhc3QgIT0gY29ublxuICAgICAgICBjb25uLmFkZFNpZ25hbChuZXh0LCBvcClcbiAgZm9yd2FyZEFsbFNpZ25hbHNUbzogKGNvbm4sIG9wKSAtPlxuICAgIGZvciBzaWduYWwgaW4gQHNpZ25hbHNcbiAgICAgIG5leHQgPSBAcHJlcEZvcndhcmRlZFNpZ25hbChzaWduYWwpXG4gICAgICBjb25uLmFkZFNpZ25hbChuZXh0LCBvcClcbiAgc3RvcEZvcndhcmRlZFNpZ25hbDogKHNpZ25hbCwgb3ApIC0+XG4gICAgbmV4dCA9IEBwcmVwRm9yd2FyZGVkU2lnbmFsKHNpZ25hbClcbiAgICBmb3Iga2V5LCBjb25uIG9mIEBnZXRPdXRwdXRzKClcbiAgICAgIGlmIHNpZ25hbC5sYXN0ICE9IGNvbm5cbiAgICAgICAgY29ubi5yZW1vdmVTaWduYWwobmV4dCwgb3ApXG4gIHN0b3BBbGxGb3J3YXJkZWRTaWduYWxUbzogKGNvbm4sIG9wKSAtPlxuICAgIGZvciBzaWduYWwgaW4gQHNpZ25hbHNcbiAgICAgIG5leHQgPSBAcHJlcEZvcndhcmRlZFNpZ25hbChzaWduYWwpXG4gICAgICBjb25uLnJlbW92ZVNpZ25hbChuZXh0LCBvcClcbiAgICAgICAgICAgICAgICBcbiAgICBcbiAgICAgICAgICBcbmNsYXNzIFBvd2VyU291cmNlIGV4dGVuZHMgTWFjaGluZVxuICBAaW5jbHVkZSBDb25uZWN0ZWRcbiAgQHByb3BlcnRpZXNcbiAgICBhY3RpdmF0ZWQ6XG4gICAgICBjaGFuZ2U6IC0+XG4gICAgICAgIEBkaXNwbGF5LnRvZ2dsZUNsYXNzKCdhY3RpdmF0ZWQnLEBhY3RpdmF0ZWQpXG4gICAgICAgIG9wID0gbmV3IFNpZ25hbE9wZXJhdGlvbigpXG4gICAgICAgIHNpZ25hbCA9IG5ldyBTaWduYWwodGhpcywgJ3Bvd2VyJywgdHJ1ZSlcbiAgICAgICAgaWYgQGFjdGl2YXRlZFxuICAgICAgICAgIEBmb3J3YXJkU2lnbmFsKHNpZ25hbCwgb3ApXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAc3RvcEZvcndhcmRlZFNpZ25hbChzaWduYWwsIG9wKVxuICAgICAgICBvcC5zdGFydCgpXG4gIGNoYW5nZVRpbGU6IC0+XG4gICAgc3VwZXIoKVxuICAgIEBpbml0QWRqYWNlbnRDb25uZWN0aW9ucygpXG4gIGluaXREaXNwbGF5OiAtPlxuICAgIHN1cGVyKClcbiAgICAgIC5hZGRDbGFzcygncG93ZXJTb3VyY2UnKVxuICAgICAgLmFkZENsYXNzKCdmYSBmYS1wb3dlci1vZmYnKVxuICAgICAgLmNsaWNrID0+XG4gICAgICAgIEBhY3RpdmF0ZWQgPSAhQGFjdGl2YXRlZFxuICBjYW5Db25uZWN0VG86ICh0YXJnZXQpIC0+XG4gICAgdGFyZ2V0LndpcmVUeXBlP1xuICAgIFxuY2xhc3MgU3dpdGNoIGV4dGVuZHMgTWFjaGluZVxuICBAaW5jbHVkZSBDb25uZWN0ZWRcbiAgQHByb3BlcnRpZXNcbiAgICBhY3RpdmF0ZWQ6XG4gICAgICBjaGFuZ2U6IC0+XG4gICAgICAgIG9wID0gbmV3IFNpZ25hbE9wZXJhdGlvbigpXG4gICAgICAgIEBkaXNwbGF5LnRvZ2dsZUNsYXNzKCdhY3RpdmF0ZWQnLEBhY3RpdmF0ZWQpXG4gICAgICAgIGlmIEBhY3RpdmF0ZWRcbiAgICAgICAgICBieVR5cGUgPSBAc2lnbmFscy5yZWR1Y2UgKGJ5VHlwZSxzaWduYWwpLT5cbiAgICAgICAgICAgICAgdW5sZXNzIGJ5VHlwZVtzaWduYWwudHlwZV0/XG4gICAgICAgICAgICAgICAgYnlUeXBlW3NpZ25hbC50eXBlXSA9IHNpZ25hbFxuICAgICAgICAgICAgICBieVR5cGVcbiAgICAgICAgICAgICwge31cbiAgICAgICAgICBmb3IgdHlwZSwgc2lnbmFsIG9mIGJ5VHlwZVxuICAgICAgICAgICAgQGZvcndhcmRTaWduYWwoc2lnbmFsLCBvcClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZvciBzaWduYWwgaW4gQHNpZ25hbHMuc2xpY2UoKVxuICAgICAgICAgICAgQHN0b3BGb3J3YXJkZWRTaWduYWwoc2lnbmFsLCBvcClcbiAgICAgICAgb3Auc3RhcnQoKVxuICBjaGFuZ2VUaWxlOiAtPlxuICAgIHN1cGVyKClcbiAgICBAaW5pdEFkamFjZW50Q29ubmVjdGlvbnMoKVxuICBpbml0RGlzcGxheTogLT5cbiAgICBzdXBlcigpXG4gICAgICAuYWRkQ2xhc3MoJ3N3aXRjaCcpXG4gICAgICAuY2xpY2sgPT5cbiAgICAgICAgQGFjdGl2YXRlZCA9ICFAYWN0aXZhdGVkXG4gIGNhbkNvbm5lY3RUbzogKHRhcmdldCkgLT5cbiAgICB0YXJnZXQud2lyZVR5cGU/XG4gIG9uTmV3U2lnbmFsVHlwZTogKHNpZ25hbCwgb3ApIC0+XG4gICAgaWYgQGFjdGl2YXRlZFxuICAgICAgQGZvcndhcmRTaWduYWwoc2lnbmFsLCBvcClcbiAgb25SZXBsYWNlU2lnbmFsOiAob2xkU2lnbmFsLCBuZXdTaWduYWwsIG9wKSAtPlxuICAgIGlmIEBhY3RpdmF0ZWRcbiAgICAgIEBmb3J3YXJkU2lnbmFsKG5ld1NpZ25hbCwgb3ApXG4gIG9uUmVtb3ZlU2lnbmFsOiAoc2lnbmFsLCBvcCkgLT5cbiAgICBpZiBAYWN0aXZhdGVkXG4gICAgICBAc3RvcEZvcndhcmRlZFNpZ25hbChzaWduYWwsIG9wKVxuICAgIFxuY2xhc3MgTGlnaHQgZXh0ZW5kcyBNYWNoaW5lXG4gIEBpbmNsdWRlIENvbm5lY3RlZFxuICBAcHJvcGVydGllc1xuICAgIGFjdGl2YXRlZDpcbiAgICAgIGNoYW5nZTogLT5cbiAgICAgICAgQGRpc3BsYXkudG9nZ2xlQ2xhc3MoJ2FjdGl2YXRlZCcsQGFjdGl2YXRlZClcbiAgY2hhbmdlVGlsZTogLT5cbiAgICBzdXBlcigpXG4gICAgQGluaXRBZGphY2VudENvbm5lY3Rpb25zKClcbiAgaW5pdERpc3BsYXk6IC0+XG4gICAgc3VwZXIoKVxuICAgICAgLmFkZENsYXNzKCdsaWdodCcpXG4gICAgICAuYWRkQ2xhc3MoJ2ZhIGZhLWxpZ2h0YnVsYi1vJylcbiAgY2FuQ29ubmVjdFRvOiAodGFyZ2V0KSAtPlxuICAgIHRhcmdldC53aXJlVHlwZT9cbiAgb25OZXdTaWduYWxUeXBlOiAoc2lnbmFsKSAtPlxuICAgIGlmIHNpZ25hbC50eXBlID09ICdwb3dlcidcbiAgICAgIEBhY3RpdmF0ZWQgPSB0cnVlXG4gIG9uUmVtb3ZlU2lnbmFsVHlwZTogKHNpZ25hbCkgLT5cbiAgICBpZiBzaWduYWwudHlwZSA9PSAncG93ZXInXG4gICAgICBAYWN0aXZhdGVkID0gZmFsc2VcbiAgICBcbmNsYXNzIE9yR2F0ZSBleHRlbmRzIE1hY2hpbmVcbiAgQGluY2x1ZGUgQ29ubmVjdGVkXG4gIEBwcm9wZXJ0aWVzXG4gICAgYWN0aXZhdGVkOlxuICAgICAgY2hhbmdlOiAtPlxuICAgICAgICBAZGlzcGxheS50b2dnbGVDbGFzcygnYWN0aXZhdGVkJyxAYWN0aXZhdGVkKVxuICBjb25zdHJ1Y3RvcjogKG91dHB1dERpcmVjdGlvbikgLT5cbiAgICBzdXBlcigpXG4gICAgQG91dHB1dERpcmVjdGlvbiA9IERpcmVjdGlvbi5nZXRCeU5hbWUob3V0cHV0RGlyZWN0aW9uKVxuICBpbml0RGlzcGxheTogLT5cbiAgICBzdXBlcigpXG4gICAgICAuYWRkQ2xhc3MoJ29yR2F0ZScpXG4gICAgICAuYWRkQ2xhc3MoQG91dHB1dERpcmVjdGlvbi5uYW1lKydPdXRwdXQnKVxuICBjaGFuZ2VUaWxlOiAtPlxuICAgIHN1cGVyKClcbiAgICBAaW5pdEFkamFjZW50Q29ubmVjdGlvbnMoKVxuICBjYW5Db25uZWN0VG86ICh0YXJnZXQpIC0+XG4gICAgdGFyZ2V0LndpcmVUeXBlP1xuICBhY2NlcHRTaWduYWw6IChzaWduYWwpIC0+XG4gICAgc2lnbmFsLmdldERpcmVjdGlvbihAdGlsZSkgIT0gQG91dHB1dERpcmVjdGlvblxuICBvbk5ld1NpZ25hbFR5cGU6IChzaWduYWwsIG9wKSAtPlxuICAgIGlmIHNpZ25hbC50eXBlID09ICdwb3dlcidcbiAgICAgIEBhY3RpdmF0ZWQgPSB0cnVlXG4gICAgQGZvcndhcmRTaWduYWwoc2lnbmFsLCBvcClcbiAgb25SZXBsYWNlU2lnbmFsOiAob2xkU2lnbmFsLCBuZXdTaWduYWwsIG9wKSAtPlxuICAgIEBmb3J3YXJkU2lnbmFsKG5ld1NpZ25hbCwgb3ApXG4gIGdldE91dHB1dHM6ICgpIC0+XG4gICAgYyA9IEBnZXRDb25uZWN0aW9uQnlEaXJlY3Rpb24oQG91dHB1dERpcmVjdGlvbi5uYW1lKVxuICAgIGlmIGM/IHRoZW4gW2NdIGVsc2UgW11cbiAgb25SZW1vdmVTaWduYWxUeXBlOiAoc2lnbmFsKSAtPlxuICAgIGlmIHNpZ25hbC50eXBlID09ICdwb3dlcidcbiAgICAgIEBhY3RpdmF0ZWQgPSBmYWxzZVxuICBvblJlbW92ZVNpZ25hbDogKHNpZ25hbCwgb3ApIC0+XG4gICAgQHN0b3BGb3J3YXJkZWRTaWduYWwoc2lnbmFsLCBvcClcblxuY2xhc3MgQW5kR2F0ZSBleHRlbmRzIE1hY2hpbmVcbiAgQGluY2x1ZGUgQ29ubmVjdGVkXG4gIEBwcm9wZXJ0aWVzXG4gICAgYWN0aXZhdGVkOlxuICAgICAgY2hhbmdlOiAtPlxuICAgICAgICBAZGlzcGxheS50b2dnbGVDbGFzcygnYWN0aXZhdGVkJyxAYWN0aXZhdGVkKVxuICBjb25zdHJ1Y3RvcjogKG91dHB1dERpcmVjdGlvbikgLT5cbiAgICBzdXBlcigpXG4gICAgQG91dHB1dERpcmVjdGlvbiA9IERpcmVjdGlvbi5nZXRCeU5hbWUob3V0cHV0RGlyZWN0aW9uKVxuICBpbml0RGlzcGxheTogLT5cbiAgICBzdXBlcigpXG4gICAgICAuYWRkQ2xhc3MoJ2FuZEdhdGUnKVxuICAgICAgLmFkZENsYXNzKEBvdXRwdXREaXJlY3Rpb24ubmFtZSsnT3V0cHV0JylcbiAgY2hhbmdlVGlsZTogLT5cbiAgICBzdXBlcigpXG4gICAgQGluaXRBZGphY2VudENvbm5lY3Rpb25zKClcbiAgY2FuQ29ubmVjdFRvOiAodGFyZ2V0KSAtPlxuICAgIHRhcmdldC53aXJlVHlwZT9cbiAgZ2V0T3V0cHV0czogKCkgLT5cbiAgICBjID0gQGdldENvbm5lY3Rpb25CeURpcmVjdGlvbihAb3V0cHV0RGlyZWN0aW9uLm5hbWUpXG4gICAgaWYgYz8gdGhlbiBbY10gZWxzZSBbXVxuICBnZXRJbnB1dENvbm5lY3Rpb25zOiAtPlxuICAgIEBnZXRBZGphY2VudENvbm5lY3Rpb25zKCkuZmlsdGVyICh3aXJlKSA9PlxuICAgICAgZGlyZWN0aW9uID0gRGlyZWN0aW9uLmdldEJ5Q29vcmQoIHdpcmUudGlsZS54IC0gQHRpbGUueCwgd2lyZS50aWxlLnkgLSBAdGlsZS55KVxuICAgICAgZGlyZWN0aW9uLm5hbWUgIT0gQG91dHB1dERpcmVjdGlvbi5uYW1lXG4gIGFjY2VwdFNpZ25hbDogKHNpZ25hbCkgLT5cbiAgICBzaWduYWwuZ2V0RGlyZWN0aW9uKEB0aWxlKSAhPSBAb3V0cHV0RGlyZWN0aW9uXG4gIG9uQWRkU2lnbmFsOiAoc2lnbmFsLCBvcCkgLT5cbiAgICBpQ29ubiA9IEBnZXRJbnB1dENvbm5lY3Rpb25zKClcbiAgICBjU2lnbmFscyA9IEBzaWduYWxzLmZpbHRlciAoYykgLT5cbiAgICAgIGMudHlwZSA9PSBzaWduYWwudHlwZVxuICAgIGlmIGlDb25uLmxlbmd0aCA9PSBjU2lnbmFscy5sZW5ndGhcbiAgICAgIGlmIHNpZ25hbC50eXBlID09ICdwb3dlcidcbiAgICAgICAgQGFjdGl2YXRlZCA9IHRydWVcbiAgICAgIEBmb3J3YXJkU2lnbmFsKHNpZ25hbCwgb3ApXG4gIG9uUmVtb3ZlU2lnbmFsOiAoc2lnbmFsLCBvcCkgLT5cbiAgICBpZiBzaWduYWwuZ2V0RGlyZWN0aW9uKEB0aWxlKSAhPSBAb3V0cHV0RGlyZWN0aW9uXG4gICAgICBAYWN0aXZhdGVkID0gZmFsc2VcbiAgICAgIEBzdG9wRm9yd2FyZGVkU2lnbmFsKHNpZ25hbCwgb3ApXG4gICAgICAgIFxuY2xhc3MgTm90R2F0ZSBleHRlbmRzIE1hY2hpbmVcbiAgQGluY2x1ZGUgQ29ubmVjdGVkXG4gIEBwcm9wZXJ0aWVzXG4gICAgYWN0aXZhdGVkOlxuICAgICAgY2hhbmdlOiAtPlxuICAgICAgICBAZGlzcGxheS50b2dnbGVDbGFzcygnYWN0aXZhdGVkJyxAYWN0aXZhdGVkKVxuICBjb25zdHJ1Y3RvcjogKG91dHB1dERpcmVjdGlvbikgLT5cbiAgICBzdXBlcigpXG4gICAgQG91dHB1dERpcmVjdGlvbiA9IERpcmVjdGlvbi5nZXRCeU5hbWUob3V0cHV0RGlyZWN0aW9uKVxuICBpbml0RGlzcGxheTogLT5cbiAgICBzdXBlcigpXG4gICAgICAuYWRkQ2xhc3MoJ25vdEdhdGUnKVxuICAgICAgLmFkZENsYXNzKEBvdXRwdXREaXJlY3Rpb24ubmFtZSsnT3V0cHV0JylcbiAgY2hhbmdlVGlsZTogLT5cbiAgICBzdXBlcigpXG4gICAgQGluaXRBZGphY2VudENvbm5lY3Rpb25zKClcbiAgICBAaW5pdE91dHB1dCgpXG4gIGluaXRPdXRwdXQ6IC0+XG4gICAgaWYgQHNpZ25hbHMubGVuZ3RoID09IDBcbiAgICAgIHNpZ25hbCA9IG5ldyBTaWduYWwodGhpcywncG93ZXInLHRydWUpXG4gICAgICBAZm9yd2FyZFNpZ25hbChzaWduYWwpXG4gIGNhbkNvbm5lY3RUbzogKHRhcmdldCkgLT5cbiAgICB0YXJnZXQud2lyZVR5cGU/XG4gIGFjY2VwdFNpZ25hbDogKHNpZ25hbCkgLT5cbiAgICBzaWduYWwuZ2V0RGlyZWN0aW9uKEB0aWxlKSAhPSBAb3V0cHV0RGlyZWN0aW9uXG4gIGdldE91dHB1dHM6ICgpIC0+XG4gICAgYyA9IEBnZXRDb25uZWN0aW9uQnlEaXJlY3Rpb24oQG91dHB1dERpcmVjdGlvbi5uYW1lKVxuICAgIGlmIGM/IHRoZW4gW2NdIGVsc2UgW11cbiAgb25OZXdTaWduYWxUeXBlOiAoc2lnbmFsLCBvcCkgLT5cbiAgICBpZiBzaWduYWwudHlwZSA9PSAncG93ZXInXG4gICAgICBAYWN0aXZhdGVkID0gdHJ1ZVxuICAgIEBzdG9wRm9yd2FyZGVkU2lnbmFsKHNpZ25hbCwgb3ApXG4gICAgb3AuYWRkTGltaXRlcih0aGlzKVxuICBvblJlcGxhY2VTaWduYWw6IChvbGRTaWduYWwsIG5ld1NpZ25hbCwgb3ApIC0+XG4gICAgQHN0b3BGb3J3YXJkZWRTaWduYWwobmV3U2lnbmFsLCBvcClcbiAgcHJlcEZvcndhcmRlZFNpZ25hbDogKHNpZ25hbCkgLT5cbiAgICB1bmxlc3Mgc2lnbmFsLm9yaWdpbiBpbnN0YW5jZW9mIE5vdEdhdGVcbiAgICAgIHNpZ25hbCA9IG5ldyBTaWduYWwodGhpcywncG93ZXInLHRydWUpXG4gICAgaWYgc2lnbmFsLmxhc3QgPT0gdGhpcyB0aGVuIHNpZ25hbCBlbHNlIHNpZ25hbC53aXRoTGFzdCh0aGlzKVxuICBvblJlbW92ZVNpZ25hbFR5cGU6IChzaWduYWwsIG9wKSAtPlxuICAgIGlmIHNpZ25hbC50eXBlID09ICdwb3dlcidcbiAgICAgIEBhY3RpdmF0ZWQgPSBmYWxzZVxuICAgIEBmb3J3YXJkU2lnbmFsKHNpZ25hbCwgb3ApXG4gICAgb3AuYWRkTGltaXRlcih0aGlzKVxuICAgICAgICBcbmNsYXNzIFdpcmUgZXh0ZW5kcyBNb2R1bGVcbiAgY29uc3RydWN0b3I6IChAd2lyZVR5cGUgPSAncmVkJykgLT5cbiAgICBzdXBlcigpXG4gIEBpbmNsdWRlIENvbm5lY3RlZFxuICBAcHJvcGVydGllc1xuICAgIHRpbGU6XG4gICAgICBjaGFuZ2U6IC0+XG4gICAgICAgIGRpc3BsYXlQb3MgPSBAdGlsZS5nZXREaXNwbGF5UG9zKClcbiAgICAgICAgQGRpc3BsYXkuY3NzKHRvcDogZGlzcGxheVBvcy55LCBsZWZ0OiBkaXNwbGF5UG9zLngpXG4gICAgICAgIEBkaXNwbGF5LmFwcGVuZFRvKEB0aWxlLmNvbnRhaW5lckRpc3BsYXkpXG4gICAgICAgIEBpbml0QWRqYWNlbnRDb25uZWN0aW9ucygpXG4gICAgZGlzcGxheTpcbiAgICAgIGluaXQ6IC0+XG4gICAgICAgICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSlcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3dpcmUnKVxuICAgICAgICAgIC5hZGRDbGFzcyhAd2lyZVR5cGUpXG4gICAgY29ublRvcDpcbiAgICAgIGNoYW5nZTogLT5cbiAgICAgICAgQGRpc3BsYXkudG9nZ2xlQ2xhc3MoJ2Nvbm5Ub3AnLEBjb25uVG9wKVxuICAgIGNvbm5SaWdodDpcbiAgICAgIGNoYW5nZTogLT5cbiAgICAgICAgQGRpc3BsYXkudG9nZ2xlQ2xhc3MoJ2Nvbm5SaWdodCcsQGNvbm5SaWdodClcbiAgICBjb25uQm90dG9tOlxuICAgICAgY2hhbmdlOiAtPlxuICAgICAgICBAZGlzcGxheS50b2dnbGVDbGFzcygnY29ubkJvdHRvbScsQGNvbm5Cb3R0b20pXG4gICAgY29ubkxlZnQ6XG4gICAgICBjaGFuZ2U6IC0+XG4gICAgICAgIEBkaXNwbGF5LnRvZ2dsZUNsYXNzKCdjb25uTGVmdCcsQGNvbm5MZWZ0KVxuICAgIGFjdGl2YXRlZDpcbiAgICAgIGNoYW5nZTogLT5cbiAgICAgICAgQGRpc3BsYXkudG9nZ2xlQ2xhc3MoJ2FjdGl2YXRlZCcsQGFjdGl2YXRlZClcbiAgb25BZGRDb25uZWN0aW9uOiAoY29ubiktPlxuICAgICAgZGlyZWN0aW9uID0gRGlyZWN0aW9uLmdldEJ5Q29vcmQoIGNvbm4udGlsZS54IC0gQHRpbGUueCwgY29ubi50aWxlLnkgLSBAdGlsZS55KVxuICAgICAgY29uTmFtZSA9ICdjb25uJyArIGRpcmVjdGlvbi5uYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgZGlyZWN0aW9uLm5hbWUuc2xpY2UoMSlcbiAgICAgIHRoaXNbY29uTmFtZV0gPSB0cnVlXG4gICAgICBAZm9yd2FyZEFsbFNpZ25hbHNUbyhjb25uKVxuICBvblJlbW92ZUNvbm5lY3Rpb246IChjb25uKS0+XG4gICAgICBkaXJlY3Rpb24gPSBEaXJlY3Rpb24uZ2V0QnlDb29yZCggY29ubi50aWxlLnggLSBAdGlsZS54LCBjb25uLnRpbGUueSAtIEB0aWxlLnkpXG4gICAgICBjb25OYW1lID0gJ2Nvbm4nICsgZGlyZWN0aW9uLm5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBkaXJlY3Rpb24ubmFtZS5zbGljZSgxKVxuICAgICAgdGhpc1tjb25OYW1lXSA9IGZhbHNlXG4gIGNhbkNvbm5lY3RUbzogKHRhcmdldCkgLT5cbiAgICAhdGFyZ2V0LndpcmVUeXBlPyBvciB0YXJnZXQud2lyZVR5cGUgPT0gQHdpcmVUeXBlXG4gICAgXG4gIG9uTmV3U2lnbmFsVHlwZTogKHNpZ25hbCwgb3ApIC0+XG4gICAgaWYgc2lnbmFsLnR5cGUgPT0gJ3Bvd2VyJ1xuICAgICAgQGFjdGl2YXRlZCA9IHRydWVcbiAgICBAZm9yd2FyZFNpZ25hbChzaWduYWwsIG9wKVxuICBvblJlcGxhY2VTaWduYWw6IChvbGRTaWduYWwsIG5ld1NpZ25hbCwgb3ApIC0+XG4gICAgQGZvcndhcmRTaWduYWwobmV3U2lnbmFsLCBvcClcbiAgb25SZW1vdmVTaWduYWxUeXBlOiAoc2lnbmFsKSAtPlxuICAgIGlmIHNpZ25hbC50eXBlID09ICdwb3dlcidcbiAgICAgIEBhY3RpdmF0ZWQgPSBmYWxzZVxuICBvblJlbW92ZVNpZ25hbDogKHNpZ25hbCwgb3ApIC0+XG4gICAgQHN0b3BGb3J3YXJkZWRTaWduYWwoc2lnbmFsLCBvcClcbiAgICBcbiAgQG1hdHJpeERhdGFUeXBlID0ge1xuICAgIHJlZDogMVxuICAgIGJsdWU6IDJcbiAgfVxuICBAbG9hZE1hdHJpeCA9ICh0aWxlQ29udGFpbmVyLCBtYXRyaXgpIC0+XG4gICAgZm9yIHksIHJvdyBvZiBtYXRyaXhcbiAgICAgIGZvciB4LCB2YWwgb2Ygcm93XG4gICAgICAgIGZvciB0eXBlLCBudW0gb2YgQG1hdHJpeERhdGFUeXBlXG4gICAgICAgICAgaWYgdmFsICYgbnVtXG4gICAgICAgICAgICB0aWxlID0gdGlsZUNvbnRhaW5lci5nZXRUaWxlKHBhcnNlSW50KHgpLCBwYXJzZUludCh5KSlcbiAgICAgICAgICAgIHRpbGUuYWRkQ2hpbGQobmV3IFdpcmUodHlwZSkpXG5cbmNsYXNzIFNpZ25hbCBleHRlbmRzIE1vZHVsZVxuICBjb25zdHJ1Y3RvcjogKEBvcmlnaW4sIEB0eXBlID0gJ3NpZ25hbCcsIEBleGNsdXNpdmUgPSBmYWxzZSkgLT5cbiAgICBzdXBlcigpXG4gICAgQGxhc3QgPSBAb3JpZ2luXG4gIHdpdGhMYXN0OiAobGFzdCkgLT5cbiAgICBzaWduYWwgPSBuZXcgQF9fcHJvdG9fXy5jb25zdHJ1Y3RvcihAb3JpZ2luLCBAdHlwZSwgQGV4Y2x1c2l2ZSlcbiAgICBzaWduYWwubGFzdCA9IGxhc3RcbiAgICBzaWduYWxcbiAgY29weTogLT5cbiAgICBzaWduYWwgPSBuZXcgQF9fcHJvdG9fXy5jb25zdHJ1Y3RvcihAb3JpZ2luLCBAdHlwZSwgQGV4Y2x1c2l2ZSlcbiAgICBzaWduYWwubGFzdCA9IEBsYXN0XG4gICAgc2lnbmFsXG4gIG1hdGNoOiAoc2lnbmFsLCBjaGVja0xhc3QgPSBmYWxzZSwgY2hlY2tPcmlnaW4gPSBAZXhjbHVzaXZlKSAtPlxuICAgICghY2hlY2tMYXN0IG9yIHNpZ25hbC5sYXN0ID09IEBsYXN0KSBhbmQgKGNoZWNrT3JpZ2luIG9yIHNpZ25hbC5vcmlnaW4gPT0gQG9yaWdpbikgYW5kIHNpZ25hbC50eXBlID09IEB0eXBlXG4gIGdldERpcmVjdGlvbjogKGZyb20pLT5cbiAgICBkaXJlY3Rpb24gPSBEaXJlY3Rpb24uZ2V0QnlDb29yZCggQGxhc3QudGlsZS54IC0gZnJvbS54LCBAbGFzdC50aWxlLnkgLSBmcm9tLnkpXG4gICAgXG5jbGFzcyBTaWduYWxPcGVyYXRpb24gZXh0ZW5kcyBNb2R1bGVcbiAgY29uc3RydWN0b3I6ICgpIC0+XG4gICAgc3VwZXIoKVxuICAgIEBxdWV1ZSA9IFtdXG4gICAgQGxpbWl0ZXJzID0gW11cbiAgYWRkT3BlcmF0aW9uOiAoZnVuY3QsIHByaW9yaXR5ID0gMSkgLT5cbiAgICBpZiBwcmlvcml0eVxuICAgICAgQHF1ZXVlLnVuc2hpZnQgZnVuY3RcbiAgICBlbHNlXG4gICAgICBAcXVldWUucHVzaCBmdW5jdFxuICBhZGRMaW1pdGVyOiAoY29ubmVjdGVkKSAtPlxuICAgIGlmICFAZmluZExpbWl0ZXIoY29ubmVjdGVkKVxuICAgICAgQGxpbWl0ZXJzLnB1c2ggY29ubmVjdGVkXG4gIGZpbmRMaW1pdGVyOiAoY29ubmVjdGVkKSAtPlxuICAgIEBsaW1pdGVycy5pbmRleE9mKGNvbm5lY3RlZCkgPiAtMVxuICBzdGFydDogKCkgLT5cbiAgICBpZiBzdGVwQnlTdGVwXG4gICAgICBjbG9ja2VkLnB1c2godGhpcylcbiAgICBlbHNlXG4gICAgICB3aGlsZSBAcXVldWUubGVuZ3RoXG4gICAgICAgIEBzdGVwKClcbiAgc3RlcDogKCkgLT5cbiAgICBpZiBAcXVldWUubGVuZ3RoID09IDBcbiAgICAgIEBkb25lKClcbiAgICBlbHNlXG4gICAgICBmdW5jdCA9IEBxdWV1ZS5zaGlmdChmdW5jdClcbiAgICAgIGZ1bmN0KHRoaXMpXG4gIGRvbmU6ICgpIC0+XG4gICAgaW5kZXggPSBjbG9ja2VkLmluZGV4T2YodGhpcylcbiAgICBpZiBpbmRleCAhPSAtMVxuICAgICAgY2xvY2tlZC5zcGxpY2UoaW5kZXgsIDEpXG5cbmNsYXNzIFRpbGVDb250YWluZXJcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvb3JkcyA9IHt9XG4gICAgQHRpbGVzID0gW11cbiAgYWRkVGlsZTogKHRpbGUpIC0+XG4gICAgQHRpbGVzLnB1c2godGlsZSlcbiAgICBAY29vcmRzW3RpbGUueF0gPSB7fSB1bmxlc3MgQGNvb3Jkc1t0aWxlLnhdP1xuICAgIEBjb29yZHNbdGlsZS54XVt0aWxlLnldID0gdGlsZVxuICBnZXRUaWxlOiAoeCwgeSkgLT5cbiAgICBpZiBAY29vcmRzW3hdP1t5XT9cbiAgICAgIEBjb29yZHNbeF1beV1cbiAgbG9hZE1hdHJpeDogKG1hdHJpeCkgLT5cbiAgICB0eXBlcyA9IHt3Oid3YWxsJywgZjonZmxvb3InfVxuICAgIGZvciB5LCByb3cgb2YgbWF0cml4XG4gICAgICBmb3IgeCwgbGV0dGVyIG9mIHJvd1xuICAgICAgICBkYXRhID0ge1xuICAgICAgICAgIHg6IHBhcnNlSW50KHgpLFxuICAgICAgICAgIHk6IHBhcnNlSW50KHkpLFxuICAgICAgICAgIHR5cGU6IHR5cGVzW2xldHRlcl0sXG4gICAgICAgIH1cbiAgICAgICAgQGFkZFRpbGUoVGlsZS5jcmVhdGVGcm9tRGF0YShkYXRhKSlcbiAgYWxsVGlsZXM6IC0+XG4gICAgQHRpbGVzLnNsaWNlKClcbiAgY2xlYXJBbGw6IC0+XG4gICAgZm9yIHRpbGUgaW4gQHRpbGVzXG4gICAgICB0aWxlLnJlbW92ZSgpXG4gICAgQGNvb3JkcyA9IHt9XG4gICAgQHRpbGVzID0gW11cbiAgICBcbnRoaXMudGlsZXMgPSB0aWxlcyA9IG5ldyBUaWxlQ29udGFpbmVyKClcblxudGlsZXMubG9hZE1hdHJpeChbXG4gIFtcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiXSxcbiAgW1wid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCJdLFxuICBbXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIl0sXG4gIFtcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiXSxcbiAgW1wid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCJdLFxuICBbXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIl0sXG4gIFtcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiXSxcbiAgW1wid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCJdLFxuICBbXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIl0sXG4gIFtcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiXSxcbiAgW1wid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcIndcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwid1wiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJmXCIsIFwiZlwiLCBcImZcIiwgXCJ3XCJdLFxuICBbXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIiwgXCJ3XCIsIFwid1wiLCBcIndcIl0sXG5dKVxuXG5XaXJlLmxvYWRNYXRyaXgodGlsZXMsIFtcbiAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICBbMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMSwgMCwgMSwgMSwgMCwgMCwgMCwgMiwgMiwgMiwgMCwgMF0sXG4gIFswLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAyLCAwLCAyLCAyLCAyXSxcbiAgWzAsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDIsIDIsIDIsIDMsIDIsIDIsIDIsIDAsIDIsIDIsIDIsIDJdLFxuICBbMCwgMCwgMSwgMCwgMSwgMSwgMCwgMSwgMSwgMSwgMSwgMSwgMCwgMCwgMiwgMiwgMCwgMCwgMCwgMF0sXG4gIFswLCAwLCAxLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgWzAsIDEsIDEsIDAsIDAsIDEsIDEsIDAsIDEsIDEsIDAsIDEsIDAsIDAsIDIsIDIsIDAsIDIsIDAsIDJdLFxuICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMSwgMCwgMSwgMCwgMCwgMCwgMiwgMCwgMCwgMCwgMF0sXG4gIFswLCAwLCAwLCAwLCAwLCAwLCAxLCAwLCAxLCAwLCAxLCAxLCAwLCAwLCAwLCAyLCAyLCAwLCAyLCAyXSxcbiAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICBbMCwgMCwgMCwgMCwgMCwgMCwgMSwgMSwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG5dKVxuXG50aWxlcy5nZXRUaWxlKDcsMykuYWRkQ2hpbGQobmV3IFBvd2VyU291cmNlKCkpXG50aWxlcy5nZXRUaWxlKDE2LDIpLmFkZENoaWxkKG5ldyBQb3dlclNvdXJjZSgpKVxudGlsZXMuZ2V0VGlsZSgxLDEpLmFkZENoaWxkKG5ldyBMaWdodCgpKVxudGlsZXMuZ2V0VGlsZSg2LDEpLmFkZENoaWxkKG5ldyBMaWdodCgpKVxudGlsZXMuZ2V0VGlsZSgxOSwxKS5hZGRDaGlsZChuZXcgTGlnaHQoKSlcbnRpbGVzLmdldFRpbGUoNSw4KS5hZGRDaGlsZChuZXcgUG93ZXJTb3VyY2UoKSlcbnRpbGVzLmdldFRpbGUoNSwxMCkuYWRkQ2hpbGQobmV3IFBvd2VyU291cmNlKCkpXG50aWxlcy5nZXRUaWxlKDcsOCkuYWRkQ2hpbGQobmV3IEFuZEdhdGUoJ3JpZ2h0JykpXG50aWxlcy5nZXRUaWxlKDcsNikuYWRkQ2hpbGQobmV3IFBvd2VyU291cmNlKCkpXG50aWxlcy5nZXRUaWxlKDksOCkuYWRkQ2hpbGQobmV3IE9yR2F0ZSgncmlnaHQnKSlcbnRpbGVzLmdldFRpbGUoMTUsOSkuYWRkQ2hpbGQobmV3IExpZ2h0KCkpXG50aWxlcy5nZXRUaWxlKDE1LDUpLmFkZENoaWxkKG5ldyBOb3RHYXRlKCdib3R0b20nKSlcbnRpbGVzLmdldFRpbGUoMTQsNSkuYWRkQ2hpbGQobmV3IE5vdEdhdGUoJ2JvdHRvbScpKVxudGlsZXMuZ2V0VGlsZSgzLDQpLmFkZENoaWxkKG5ldyBOb3RHYXRlKCdsZWZ0JykpXG50aWxlcy5nZXRUaWxlKDYsNCkuYWRkQ2hpbGQobmV3IE5vdEdhdGUoJ2xlZnQnKSlcbnRpbGVzLmdldFRpbGUoOSwxKS5hZGRDaGlsZChuZXcgT3JHYXRlKCdsZWZ0JykpXG50aWxlcy5nZXRUaWxlKDE1LDMpLmFkZENoaWxkKG5ldyBTd2l0Y2goKSlcbnRpbGVzLmdldFRpbGUoMTcsOCkuYWRkQ2hpbGQobmV3IE5vdEdhdGUoJ3JpZ2h0JykpXG50aWxlcy5nZXRUaWxlKDE4LDYpLmFkZENoaWxkKG5ldyBOb3RHYXRlKCdsZWZ0JykpXG50aWxlcy5nZXRUaWxlKDE2LDYpLmFkZENoaWxkKG5ldyBOb3RHYXRlKCdsZWZ0JykpXG50aWxlcy5nZXRUaWxlKDE5LDUpLmFkZENoaWxkKG5ldyBQb3dlclNvdXJjZSgpKVxudGlsZXMuZ2V0VGlsZSgxOSw3KS5hZGRDaGlsZChuZXcgU3dpdGNoKCkpXG50aWxlcy5nZXRUaWxlKDE4LDkpLmFkZENoaWxkKG5ldyBMaWdodCgpKVxuXG4kKCcjU3RlcEJ5U3RlcCcpLmNoYW5nZSAtPlxuICBzdGVwQnlTdGVwID0gJCh0aGlzKS5pcygnOmNoZWNrZWQnKVxuXG5zZXRJbnRlcnZhbCAtPlxuICAgIGNsb2NrZWQuZm9yRWFjaCAoY2xvY2tlZCkgLT5cbiAgICAgIGNsb2NrZWQuc3RlcCgpXG4gICwgNTBcbiJdfQ==
//# sourceURL=coffeescript
