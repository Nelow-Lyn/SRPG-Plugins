/**
 * Plugin to make a Damage Item heal the user.
 * This works for both normal items and staffs.
 * 
 * Simply add a custom parameter to the item/staff
 * {healDamageDealt: true}
 * to enable this.
 * 
 * This plugin allows some customization:
 * 
 * - RunTimeAnime = true/false  Decides if you want to use a Runtime or Original effect.
 * - ScaleWithMag = true/false  Adds the Mag of a unit on top of the Damage dealt to the heal effect.
 * - ScaleWithStr = true/false  Adds the Str of a unit on top of the Damage dealt to the heal effect.
 * If neither of them is set to true, it will scale by constant instead, meaning it will multiply the healing by the 
 * variable constant (default 2);
 * 
 * Plugin by Nelow/Lyn
 */

(function () {

	var RunTimeAnime = true;
	var AnimeId = 307;

	var ScaleWithMag = true;
	var ScaleWithStr = false;
	var constant = 2;


	DamageItemUse.enterMainUseCycle = function (itemUseParent) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var damageInfo = itemTargetInfo.item.getDamageInfo();
		var type = itemTargetInfo.item.getRangeType();
		var plus = Calculator.calculateDamageItemPlus(itemTargetInfo.unit, itemTargetInfo.targetUnit, itemTargetInfo.item);

		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();

		if (type !== SelectionRangeType.SELFONLY) {
			generator.locationFocus(itemTargetInfo.targetUnit.getMapX(), itemTargetInfo.targetUnit.getMapY(), true);
		}

		generator.damageHitEx(itemTargetInfo.targetUnit, this._getItemDamageAnime(itemTargetInfo),
			damageInfo.getDamageValue() + plus, damageInfo.getDamageType(), damageInfo.getHit(), itemTargetInfo.unit, itemUseParent.isItemSkipMode());

		if (itemTargetInfo.item.custom.healDamageDealt != null && itemTargetInfo.item.custom.healDamageDealt === true) {
			anime = root.getBaseData().getEffectAnimationList(RunTimeAnime).getDataFromId(AnimeId);
			if (ScaleWithMag) {
				var value = RealBonus.getMag(itemTargetInfo.unit) + damageInfo.getDamageValue();
			} else if (ScaleWithStr) {
				var value = RealBonus.getStr(itemTargetInfo.unit) + damageInfo.getDamageValue();
			} else {
				var value = damageInfo.getDamageValue() * constant;
            }
			
			generator.hpRecovery(itemTargetInfo.unit, anime, value, RecoveryType.SPECIFY, false)
		}
		return this._dynamicEvent.executeDynamicEvent();
	}



})();
