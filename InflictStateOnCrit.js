// Plugin for inflicting a state on a critical hit.
// If a given Unit or Class has the custom parameter "inflictStateOnCrit" followed by the id
// then on a critical hit it will inflict that state with a 100% chance
// example {inflictStateOnCrit: 1} will inflict the state with the id 1 on a critical hit.

(function() {
var TCG_inflictStateOnCrit = AttackEvaluator.HitCritical._checkStateAttack;
AttackEvaluator.HitCritical._checkStateAttack = function (virtualActive, virtualPassive, attackEntry) {
	TCG_inflictStateOnCrit.call(this, virtualActive, virtualPassive, attackEntry);
	var unitclass = virtualActive.unitSelf.getClass();
	if (attackEntry.isCritical && (virtualActive.unitSelf.custom.inflictStateOnCrit != null)) {
		var list = root.getBaseData().getStateList();
		var state = list.getDataFromId(virtualActive.unitSelf.custom.inflictStateOnCrit);
		attackEntry.stateArrayPassive.push(state);
		virtualPassive.stateArray.push(state);
	}
	else if (attackEntry.isCritical && unitclass.custom.inflictStateOnCrit != null) {
		var list = root.getBaseData().getStateList();
		var state = list.getDataFromId(unitclass.custom.inflictStateOnCrit);
		attackEntry.stateArrayPassive.push(state);
		virtualPassive.stateArray.push(state);
	}
};
})();
