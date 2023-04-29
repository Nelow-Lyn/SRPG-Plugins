/**
 * Very specific plugin.
 * Reduces the hit of a specified unit against an Enemy
 * Give the enemy the two custom paramters:
 * 
 * {reduceHitOfUnit:0, reduceHitOfUnitAmount:50}
 * 
 * where reduceHitOfUnit is the ID of the unit you want it to be applied to 
 * and reduceHitOfUnitAmount is the hit value to be reduced.
 * 
 * Plugin by Nelow/Lyn
 * */

(function () {

    var NL_SpecificAccDebuff = HitCalculator.calculateSingleHit;

    HitCalculator.calculateSingleHit = function (active, passive, weapon, totalStatus) {

        var value = NL_SpecificAccDebuff.call(this, active, passive, weapon, totalStatus);

        if (passive.custom.reduceHitOfUnit != null && passive.custom.reduceHitOfUnit === active.getBaseId()) {
            value -= passive.custom.reduceHitOfUnitAmount;
        }

        return value;
    }

})();
