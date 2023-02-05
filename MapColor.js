/**
 * Plugin to draw custom colours on the Map
 * Can be heavily customized to draw the entire map in a colour, or only a part of it.
 * This required atleast the following custom parameters on a Map
 * {mapColour:{colour:0x333333, alpha:128, drawMapColour:true}}
 * Where colour is the colour you want as a hex number for an RGB colour, 
 * alpha is the alpha channel of the colour as a number between 0-255,
 * and drawMapColour defines if it should be drawn at the start of the map or not.
 * 
 * All of these 3 parameters can be changed ingame via event.
 * To do so, make a Execute script event, set it to execute code
 * and call any of these 3 methods:
 * 
 * MapColour.setMapDraw(boolean); //true or false
 * MapColour.setColour(colour); // Number of colour in the format 0xCCFFE5 Important to always write 0x first, then the Hexnumber.
 * MapColour.setAlpha(alpha); // Number between 0-255
 * 
 * 
 * Additionally, should you only want to change the colour of a specific part of the map,
 * the custom parameter of the map can be expanded
 * {mapColour:{colour:0x333333, alpha:128,drawMapColour:true,startX:2,endX:6,startY:5,endY:10}}
 * 
 * This allows you to set a start coordinate X and Y, and an end coordinate X and Y for the part
 * of the map you want to be drawn in a different colour.
 * Important here is, both end X and end Y need to be a higher number than the start X and start Y
 * respectively.
 * 
 * Same as with the map colour and alpha, these coordinates can be changed ingame aswell with an
 * Execute Script event. For that purpose there are 4 methods to update the coordinates
 * and one method to update the IndexArray.
 * 
 * MapColour.setStartX(coordinate); //coordinate is a Number equal to the coordinate on the map.
 * MapColour.setStartY(coordinate);
 * MapColour.setEndY(coordinate);
 * MapColour.setEndY(coordinate);
 * 
 * MapColour.updateIndexArray();
 * 
 * The latter one needs to be called whenever you
 * change the coordinates. For example:
 * 
 * MapColour.setStartX(2);
 * MapColour.setStartY(2);
 * MapColour.updateIndexArray();
 * 
 * Without calling updateIndexArray, it would keep drawing the same portion of the map as before.
 * 
 * 
 * Plugin by Nelow/Lyn
 * */

(function() {
var NL_mapColour01 = MapLayer.drawMapLayer;
MapLayer.drawMapLayer = function () {
    NL_mapColour01.call(this);
    if (MapColour._drawMapColourCheck === true) {
        MapColour._drawMapColour();     
    }
};

var NL_mapColour02 = CurrentMap.prepareMap;
CurrentMap.prepareMap = function () {
    NL_mapColour02.call(this);
    if (typeof root.getCurrentSession().getCurrentMapInfo().custom.mapColour !== 'undefined') {
        if (root.getCurrentSession().getCurrentMapInfo().custom.mapColour.drawMapColour === true) {
            MapColour._drawMapColourCheck = true;
            MapColour._createIndexArray();
        }

    }
};

var MapColour = defineObject(BaseObject, {

    _mapIndexArray: null,
    _drawMapColourCheck: false,

    setColour: function (colour) {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        if (typeof colour === 'number') {
            mapColour.colour = colour;
        }
    },

    setAlpha: function (alpha) {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        if (typeof alpha === 'number') {
            mapColour.alpha = alpha;
        }
    },

    setStartX: function (coordinate) {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        if (typeof coordinate === 'number') {
            mapColour.startX = coordinate;
        }
    },
    setStartY: function (coordinate) {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        if (typeof coordinate === 'number') {
            mapColour.startY = coordinate;
        }
    },
    setEndX: function (coordinate) {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        if (typeof coordinate === 'number') {
            mapColour.endX = coordinate;
        }
    },
    setEndY: function (coordinate) {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        if (typeof coordinate === 'number') {
            mapColour.endY = coordinate;
        }
    },
    updateIndexArray: function(){
        this._createIndexArray();
    },

    setMapDraw: function (boolean) {
        if (typeof boolean === 'boolean') {
            this._drawMapColourCheck = boolean;
        }
    },
    _getColour: function () {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        var colour = null;
        if (typeof mapColour.colour === 'number') {
            colour = mapColour.colour;
        }
        return colour;
    },

    _getAlpha: function () {
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        var alpha = null;
        if (typeof mapColour.alpha === 'number') {
            alpha = mapColour.alpha;
        }
        return alpha;
    },
    _createIndexArray: function () {
        var iStart = 0, jStart = 0;
        var i, j;
        this._mapIndexArray = [];
        var mapColour = root.getCurrentSession().getCurrentMapInfo().custom.mapColour;
        var endX = CurrentMap.getWidth();
        var endY = CurrentMap.getHeight();
        if (typeof mapColour.startX === 'number') {
            iStart = mapColour.startX;
        }
        if (typeof mapColour.endX === 'number') {
            endX = mapColour.endX;
        }
        if (typeof mapColour.startY === 'number') {
            jStart = mapColour.startY;
        }
        if (typeof mapColour.endY === 'number') {
            endY = mapColour.endY;
        }
        for (i = iStart; i < endX; i++) {
            for (j = jStart; j < endY; j++) {
                this._mapIndexArray.push(CurrentMap.getIndex(i, j));
            }
        }
    },
    _drawMapColour: function () {
        root.drawFadeLight(this._mapIndexArray, this._getColour(), this._getAlpha());
    }
});
})();
