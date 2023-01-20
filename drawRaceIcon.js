//Plugin to draw the race Icon of the unit/class next to the name
//Moves the Icon dynamically with the length of the char name
//That may cause the icon to be drawn over other UI Elements
//if the name is too long.
//Should it be prefered to draw it on a static position
//simply change the line of the var x
//To draw the icon  give the unit the custom parameter
//{drawRaceIcon: 1}
//
//Should a unit/class have more than one race
//One can select the Icon which should be drawn by adding
//the custom parameter drawRaceIconId: 1
//where 1 doesnt stand for the Id found in the race menu
//but rather, starting from 0, the position of the race
//in the class menu which means the first selected race
//from top to bottom is 0, the second 1, the third 2 etc
//
//Example with the 3 base races of SRPG Studio, if one selects
//Male and Other, Male is Id 0 and Other is Id 1.
// {
//		drawRaceIcon: 1,
//		drawRaceIconId: 1
// }
// draws the Icon selected for Other

var TCG_drawRaceIcon01 = UnitMenuTopWindow.drawWindowContent;
UnitMenuTopWindow.drawWindowContent = function (x, y) {
	TCG_drawRaceIcon01.call(this, x, y);
	if (typeof this._unit.custom.drawRaceIcon === 'number') {
		if (this._unit.custom.drawRaceIcon === 1) {
			this._drawUnitRace(x, y);
		}
	}
	else if (typeof this._unit.getClass().custom.drawRaceIcon === 'number') {
		if (this._unit.getClass().custom.drawRaceIcon === 1) {
			this._drawUnitRace(x, y);
        }
	}
};

UnitMenuTopWindow._drawUnitRace = function (xBase, yBase) {

	var y = yBase + 13; // Change this to modify the icon placement in the directions up/down
	var unitrace = this._unit.getClass().getRaceReferenceList();
	var raceId = 0;
	if (unitrace.getTypeCount() > 1 && typeof this._unit.custom.drawRaceIconId === 'number') {
		raceId = this._unit.custom.drawRaceIconId;
	}
	else if (unitrace.getTypeCount() > 1 && typeof this._unit.getClass().custom.drawRaceIconId === 'number') {
		raceId = this._unit.getClass().custom.drawRaceIconId;
    }
	
	var handle = unitrace.getTypeData(raceId).getIconResourceHandle();
	
	var length = this._unit.getName();
	var x = xBase + 140 + (length.length * 7); // Change this to modify the icon placement in the directions left/right
	//length.length * 7 is an approximation of how many pixels? i guess one text character is

	GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
};

