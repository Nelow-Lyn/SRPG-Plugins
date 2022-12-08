//Simple plugin which allows to add a third class group
// To work it needs a custom parameter on a unit called ThirdClassGroup with the id of the group you want
// {ThirdClassGroup : 2} for example adds the group with the ID 2 as the third promotion group
// It's also possible to add more class groups beyond the 3rd but that would require minimal changes to this plugin.
// Specifically lines 28 and 82 would need to be expanded with another else if.
// Also the Class up max count needs to be adjusted accordingly

var TCG_ThirdClassGroup01 = ClassChangeSelectManager._checkGroup;
ClassChangeSelectManager._checkGroup = function (unit, item) {
	TCG_ThirdClassGroup01.call(this, unit, item);
			var i, count, classGroupId, classUpCount, classUpMaxCount;
			var group = null;
			var info = item.getClassChangeInfo();

			if (DataConfig.isBattleSetupClassChangeAllowed()) {
				// If class can be changed in the SceneType.BATTLESETUP, class group 2 is used.
				classGroupId = unit.getClassGroupId2();
				classUpMaxCount = 1;
			}
			else {
				if (this._unit.getClassUpCount() === 0) {
					// If class has never been changed yet, class group 1 is used. 
					classGroupId = this._unit.getClassGroupId1();
				}
				else if (unit.getClassUpCount() === 1) {
					// If class has been changed, use class group 2.
					classGroupId = this._unit.getClassGroupId2();
				}
				else {
					//If class has been changed twice and unit has a custom class group 3, use that.
					if (unit.custom.ThirdClassGroup != null) {
						classGroupId = unit.custom.ThirdClassGroup;
					}
				}
				classUpMaxCount = 3;
			}

			// If id is -1, it means that this unit cannot change the class.
			if (classGroupId === -1) {
				this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChange);
				this.changeCycleMode(ClassChangeSelectMode.MSG);
				return null;
			}

			// Check if the unit's groupId is included.
			count = info.getClassGroupCount();

			for (i = 0; i < count; i++) {
				group = info.getClassGroupData(i);
				if (group.getId() === classGroupId) {
					break;
				}
			}

			// If groupId is not included, it means that the unit cannot change the class with the item.
			if (i === count) {
				this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChangeItem);
				this.changeCycleMode(ClassChangeSelectMode.MSG);
				return null;
			}

			classUpCount = unit.getClassUpCount();
			if (classUpCount >= classUpMaxCount) {
				// Class has already changed, so no more class change is possible.
				this._infoWindow.setInfoMessage(StringTable.ClassChange_UnableClassChangeMore);
				this.changeCycleMode(ClassChangeSelectMode.MSG);
				return null;
			}
			return group;
};

var TCG_ThirdClassGroup02 = ClassChangeChecker.getClassGroupId;
ClassChangeChecker.getClassGroupId = function (unit, isMapCall) {
	TCG_ThirdClassGroup02.call(this, unit, isMapCall);
	var classGroupId;

	if (unit.getClassUpCount() === 0) {
		// If class has never been changed even once, use class group 1.
		classGroupId = unit.getClassGroupId1();
	}
	else if (unit.getClassUpCount() === 1) {
		// If class has been changed, use class group 2.
		classGroupId = unit.getClassGroupId2();
	}
	else {
		if (unit.custom.ThirdClassGroup != null) {
			classGroupId = unit.custom.ThirdClassGroup;
		}
	}

	// If isMapCall is true, it means class has been changed with a class change item.
	// If isMapCall is false, it means that class change was done through a class change command on the Battle Setup Scene.
	if (isMapCall && DataConfig.isBattleSetupClassChangeAllowed()) {
		// If it's a class change by class change item, moreover,
		// class change is allowed at the Battle Setup Scene,
		// refer to the class group 2 without asking number of class change. 
		classGroupId = unit.getClassGroupId2();
	}

	return classGroupId;
};