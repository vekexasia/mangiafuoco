var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
function bot() {
    return new Promise(resolve => setTimeout(() => resolve(1), 1000));
}
function bit() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield bot();
        return new Promise(resolve => resolve(12 + res));
    });
}
const promise = bit();
promise.then(result => console.log('dioporcone', result));
//# sourceMappingURL=test.js.map