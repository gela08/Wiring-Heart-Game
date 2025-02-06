(function() {
    var moduleKeywords,
      indexOf = [].indexOf;
  
    this.kevthunder = {};
  
    moduleKeywords = ['extended', 'included'];
  
    this.kevthunder.Module = class Module {
      tap(name) {
        var args;
        args = Array.prototype.slice.call(arguments);
        if (typeof name === 'function') {
          name.apply(this, args.slice(1));
        } else {
          this[name].apply(this, args.slice(1));
        }
        return this;
      }
  
      static extend(obj) {
        var key, ref, value;
        for (key in obj) {
          value = obj[key];
          if (indexOf.call(moduleKeywords, key) < 0) {
            this[key] = value;
          }
        }
        if ((ref = obj.extended) != null) {
          ref.apply(this);
        }
        return this;
      }
  
      static include(obj) {
        var key, ref, value;
        for (key in obj) {
          value = obj[key];
          if (indexOf.call(moduleKeywords, key) < 0) {
            // Assign properties to the prototype
            this.prototype[key] = value;
          }
        }
        if ((ref = obj.included) != null) {
          ref.apply(this);
        }
        return this;
      }
  
      static property(prop, desc) {
        var maj;
        maj = prop.charAt(0).toUpperCase() + prop.slice(1);
        if (desc.default != null) {
          this.prototype['_' + prop] = desc.default;
        } else {
          this.prototype['_' + prop] = null;
        }
        if (!((desc.get != null) && desc.get === false)) {
          if (desc.get != null) {
            this.prototype['get' + maj] = desc.get;
          } else if (desc.init != null) {
            this.prototype['init' + maj] = desc.init;
            this.prototype['get' + maj] = function() {
              if (this['_' + prop] == null) {
                this['_' + prop] = this['init' + maj]();
              }
              return this['_' + prop];
            };
          } else {
            this.prototype['get' + maj] = function() {
              return this['_' + prop];
            };
          }
          desc.get = function() {
            return this['get' + maj]();
          };
        }
        if (!((desc.set != null) && desc.set === false)) {
          if (desc.set != null) {
            this.prototype['set' + maj] = desc.set;
          } else if (desc.change != null) {
            this.prototype['change' + maj] = desc.change;
            this.prototype['set' + maj] = function(val) {
              var old;
              if (this['_' + prop] !== val) {
                old = this['_' + prop];
                this['_' + prop] = val;
                return this['change' + maj](old);
              }
            };
          } else {
            this.prototype['set' + maj] = function(val) {
              return this['_' + prop] = val;
            };
          }
          desc.set = function(val) {
            return this['set' + maj](val);
          };
        }
        return Object.defineProperty(this.prototype, prop, desc);
      }
  
      static properties(properties) {
        var desc, prop, results;
        results = [];
        for (prop in properties) {
          desc = properties[prop];
          results.push(this.property(prop, desc));
        }
        return results;
      }
  
    };
  
  }).call(this);
  
  //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGNBQUE7SUFBQTs7RUFBQSxJQUFJLENBQUMsVUFBTCxHQUFrQixDQUFBOztFQUVsQixjQUFBLEdBQWlCLENBQUMsVUFBRCxFQUFhLFVBQWI7O0VBRVgsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUF0QixNQUFBLE9BQUE7SUFDRSxHQUFLLENBQUMsSUFBRCxDQUFBO0FBQ1AsVUFBQTtNQUFJLElBQUEsR0FBTyxLQUFLLENBQUEsU0FBRSxDQUFBLEtBQUssQ0FBQyxJQUFiLENBQWtCLFNBQWxCO01BQ1AsSUFBRyxPQUFPLElBQVAsS0FBZSxVQUFsQjtRQUNFLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxFQUFpQixJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsQ0FBakIsRUFERjtPQUFBLE1BQUE7UUFHRSxJQUFDLENBQUMsSUFBRCxDQUFNLENBQUMsS0FBUixDQUFjLElBQWQsRUFBb0IsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLENBQXBCLEVBSEY7O2FBSUE7SUFORzs7SUFPSSxPQUFSLE1BQVEsQ0FBQyxHQUFELENBQUE7QUFDWCxVQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7TUFBSSxLQUFBLFVBQUE7O3lCQUFzQyxnQkFBWDtVQUN6QixJQUFDLENBQUMsR0FBRCxDQUFELEdBQVM7O01BRFg7O1dBRVksQ0FBRSxLQUFkLENBQW9CLElBQXBCOzthQUNBO0lBSk87O0lBS0MsT0FBVCxPQUFTLENBQUMsR0FBRCxDQUFBO0FBQ1osVUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO01BQUksS0FBQSxVQUFBOzt5QkFBc0MsZ0JBQVg7O1VBRXpCLElBQUMsQ0FBQSxTQUFFLENBQUMsR0FBRCxDQUFILEdBQVc7O01BRmI7O1dBR1ksQ0FBRSxLQUFkLENBQW9CLElBQXBCOzthQUNBO0lBTFE7O0lBTUMsT0FBVixRQUFVLENBQUMsSUFB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OztxQkFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQVYsRUFBZ0IsSUFBaEI7TUFERixDQUFBOztJQURXOztFQXZEZjtBQUpBIiwic291cmNlc0NvbnRlbnQiOlsidGhpcy5rZXZ0aHVuZGVyID0ge31cblxubW9kdWxlS2V5d29yZHMgPSBbJ2V4dGVuZGVkJywgJ2luY2x1ZGVkJ11cblxuY2xhc3MgdGhpcy5rZXZ0aHVuZGVyLk1vZHVsZVxuICB0YXA6IChuYW1lKSAtPlxuICAgIGFyZ3MgPSBBcnJheTo6c2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgaWYgdHlwZW9mIG5hbWUgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgbmFtZS5hcHBseSB0aGlzLCBhcmdzLnNsaWNlKDEpXG4gICAgZWxzZVxuICAgICAgQFtuYW1lXS5hcHBseSB0aGlzLCBhcmdzLnNsaWNlKDEpXG4gICAgdGhpc1xuICBAZXh0ZW5kOiAob2JqKSAtPlxuICAgIGZvciBrZXksIHZhbHVlIG9mIG9iaiB3aGVuIGtleSBub3QgaW4gbW9kdWxlS2V5d29yZHNcbiAgICAgIEBba2V5XSA9IHZhbHVlXG4gICAgb2JqLmV4dGVuZGVkPy5hcHBseShAKVxuICAgIHRoaXNcbiAgQGluY2x1ZGU6IChvYmopIC0+XG4gICAgZm9yIGtleSwgdmFsdWUgb2Ygb2JqIHdoZW4ga2V5IG5vdCBpbiBtb2R1bGVLZXl3b3Jkc1xuICAgICAgIyBBc3NpZ24gcHJvcGVydGllcyB0byB0aGUgcHJvdG90eXBlXG4gICAgICBAOjpba2V5XSA9IHZhbHVlXG4gICAgb2JqLmluY2x1ZGVkPy5hcHBseShAKVxuICAgIHRoaXNcbiAgQHByb3BlcnR5OiAocHJvcCwgZGVzYykgLT5cbiAgICBtYWogPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKTtcbiAgICBpZiBkZXNjLmRlZmF1bHQ/XG4gICAgICBAcHJvdG90eXBlWydfJytwcm9wXSA9IGRlc2MuZGVmYXVsdFxuICAgIGVsc2VcbiAgICAgIEBwcm90b3R5cGVbJ18nK3Byb3BdID0gbnVsbFxuICAgIHVubGVzcyBkZXNjLmdldD8gYW5kIGRlc2MuZ2V0ID09IGZhbHNlXG4gICAgICBpZiBkZXNjLmdldD9cbiAgICAgICAgQHByb3RvdHlwZVsnZ2V0JyttYWpdID0gZGVzYy5nZXRcbiAgICAgIGVsc2UgaWYgZGVzYy5pbml0P1xuICAgICAgICBAcHJvdG90eXBlWydpbml0JyttYWpdID0gZGVzYy5pbml0XG4gICAgICAgIEBwcm90b3R5cGVbJ2dldCcrbWFqXSA9IC0+XG4gICAgICAgICAgdW5sZXNzIHRoaXNbJ18nK3Byb3BdP1xuICAgICAgICAgICAgdGhpc1snXycrcHJvcF0gPSB0aGlzWydpbml0JyttYWpdKClcbiAgICAgICAgICB0aGlzWydfJytwcm9wXVxuICAgICAgZWxzZVxuICAgICAgICBAcHJvdG90eXBlWydnZXQnK21hal0gPSAtPlxuICAgICAgICAgIHRoaXNbJ18nK3Byb3BdXG4gICAgICBkZXNjLmdldCA9IC0+XG4gICAgICAgIHRoaXNbJ2dldCcrbWFqXSgpXG4gICAgdW5sZXNzIGRlc2Muc2V0PyBhbmQgZGVzYy5zZXQgPT0gZmFsc2VcbiAgICAgIGlmIGRlc2Muc2V0P1xuICAgICAgICBAcHJvdG90eXBlWydzZXQnK21hal0gPSBkZXNjLnNldFxuICAgICAgZWxzZSBpZiBkZXNjLmNoYW5nZT9cbiAgICAgICAgQHByb3RvdHlwZVsnY2hhbmdlJyttYWpdID0gZGVzYy5jaGFuZ2VcbiAgICAgICAgQHByb3RvdHlwZVsnc2V0JyttYWpdID0gKHZhbCktPlxuICAgICAgICAgIGlmIHRoaXNbJ18nK3Byb3BdICE9IHZhbFxuICAgICAgICAgICAgb2xkID0gdGhpc1snXycrcHJvcF1cbiAgICAgICAgICAgIHRoaXNbJ18nK3Byb3BdID0gdmFsXG4gICAgICAgICAgICB0aGlzWydjaGFuZ2UnK21hal0ob2xkKVxuICAgICAgZWxzZVxuICAgICAgICBAcHJvdG90eXBlWydzZXQnK21hal0gPSAodmFsKS0+XG4gICAgICAgICAgdGhpc1snXycrcHJvcF0gPSB2YWxcbiAgICAgIGRlc2Muc2V0ID0gKHZhbCkgLT5cbiAgICAgICAgdGhpc1snc2V0JyttYWpdKHZhbClcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkgQHByb3RvdHlwZSwgcHJvcCwgZGVzY1xuICBAcHJvcGVydGllczogKHByb3BlcnRpZXMpIC0+XG4gICAgZm9yIHByb3AsIGRlc2Mgb2YgcHJvcGVydGllc1xuICAgICAgQHByb3BlcnR5IHByb3AsIGRlc2NcbiJdfQ==
  //# sourceURL=coffeescript