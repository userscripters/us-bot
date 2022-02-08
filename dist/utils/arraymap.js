export default class ArrayMap extends Map {
    map(callbackfn, thisArg) {
        const output = [];
        this.forEach((v, k) => output.push(callbackfn.call(thisArg, v, k, this)));
        return output;
    }
    ;
    join(map) {
        map.forEach((v, k) => this.set(k, v));
        return this;
    }
}
