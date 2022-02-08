export default class ArrayMap<K, V> extends Map<K, V> {
    /**
     * Calls a defined callback function on each element of an {@link ArrayMap}, and returns an array that contains the results.
     * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the map.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    map<U>(this: ArrayMap<K, V>, callbackfn: (value: V, key: K, map: ArrayMap<K, V>) => U, thisArg?: any) {
        const output: U[] = [];

        this.forEach((v, k) => output.push(callbackfn.call(thisArg, v, k, this)));

        return output;
    };

    /**
     * Joins another {@link ArrayMap} or {@link Map} into this map
     * @param map {@link ArrayMap} or {@link Map} to join
     */
    join(map: ArrayMap<K, V> | Map<K, V>) {
        map.forEach((v, k) => this.set(k, v));
        return this;
    }
}